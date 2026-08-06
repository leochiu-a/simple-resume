import { ensureTranslator, LangPair, peekTranslator } from "@/lib/translator";
import { Resume } from "@/types/resume";
import { FieldPath, FieldProvenance, TranslationMeta } from "@/types/resume-doc";
import { getFieldValue, listTranslatableFields, setFieldValue } from "./fields";

export interface TranslateProgress {
  done: number;
  total: number;
}

export interface TranslateResumeOptions {
  /** The primary locale — the only thing anything is ever translated from. */
  source: Resume;
  /** The translated locale as it stands, if it has been made before. */
  target?: Resume;
  meta?: TranslationMeta;
  pair: LangPair;
  /** Fields whose hand-edits should be thrown away and translated afresh. */
  overwrite?: readonly FieldPath[];
  onProgress?: (progress: TranslateProgress) => void;
  signal?: AbortSignal;
}

export interface TranslateResumeResult {
  resume: Resume;
  meta: TranslationMeta;
}

interface Job {
  path: FieldPath;
  splitOn?: string;
  sourceText: string;
}

const segmentsOf = (text: string, splitOn?: string) => (splitOn ? text.split(splitOn) : [text]);

const countCalls = (jobs: Job[]) =>
  jobs.reduce(
    (total, job) => total + segmentsOf(job.sourceText, job.splitOn).filter((s) => s.trim()).length,
    0,
  );

/**
 * Produces the translated locale from the primary one.
 *
 * Three things it deliberately does:
 *
 * - Structure comes from the primary every time, so a job added in the source
 *   language shows up here without any merging. Fields outside the translatable
 *   set (name, email, phone, links, skills, dates) are copied, not translated.
 * - A field whose source text has not moved is left exactly as it is — including
 *   when the user rewrote it. Re-running this is cheap and never undoes work.
 * - A field the user rewrote and whose source *has* moved is still left alone,
 *   and its provenance is left stale so the editor can offer the update rather
 *   than take it. Pass the path in `overwrite` to accept the new translation.
 */
export const translateResume = async ({
  source,
  target,
  meta,
  pair,
  overwrite = [],
  onProgress,
  signal,
}: TranslateResumeOptions): Promise<TranslateResumeResult> => {
  // peek first: the translation button may be reached long after the model was
  // enabled, and ensureTranslator would need an activation we no longer hold.
  const translator = await (peekTranslator(pair) ?? ensureTranslator(pair));

  const resume = structuredClone(source);
  // Which sections are shown is a presentation choice made per language, not a
  // translation of anything, so it survives a re-run.
  if (target) resume.visibility = structuredClone(target.visibility);

  const fields = listTranslatableFields(source);
  const nextMeta: TranslationMeta["fields"] = {};
  const jobs: Job[] = [];

  for (const { path, splitOn } of fields) {
    const sourceText = getFieldValue(source, path);
    const previous: FieldProvenance | undefined = meta?.fields[path];
    const targetText = target ? getFieldValue(target, path) : "";
    const edited = !!previous && targetText !== previous.machine;
    const stale = !previous || previous.source !== sourceText;

    if (!stale && previous) {
      // Unchanged at the source: keep whatever is here, edits included.
      setFieldValue(resume, path, targetText);
      nextMeta[path] = previous;
      continue;
    }

    if (stale && edited && previous && !overwrite.includes(path)) {
      // The user's wording wins; the stale provenance is what makes the editor
      // able to say "the original changed" instead of silently overwriting.
      setFieldValue(resume, path, targetText);
      nextMeta[path] = previous;
      continue;
    }

    if (!sourceText.trim()) {
      setFieldValue(resume, path, sourceText);
      nextMeta[path] = { source: sourceText, machine: sourceText };
      continue;
    }

    jobs.push({ path, splitOn, sourceText });
  }

  const total = countCalls(jobs);
  let done = 0;
  onProgress?.({ done, total });

  for (const job of jobs) {
    const segments = segmentsOf(job.sourceText, job.splitOn);
    const translated: string[] = [];

    for (const segment of segments) {
      if (signal?.aborted) throw new DOMException("Translation cancelled", "AbortError");

      // Blank bullets carry layout, not text: sending them wastes a call and
      // can come back as something that is no longer blank.
      if (!segment.trim()) {
        translated.push(segment);
        continue;
      }

      translated.push(await translator.translate(segment, { signal }));
      done += 1;
      onProgress?.({ done, total });
    }

    const value = job.splitOn ? translated.join(job.splitOn) : translated[0];
    setFieldValue(resume, job.path, value);
    nextMeta[job.path] = { source: job.sourceText, machine: value };
  }

  return { resume, meta: { fields: nextMeta, translatedAt: Date.now() } };
};
