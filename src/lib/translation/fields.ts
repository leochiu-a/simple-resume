import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { Resume } from "@/types/resume";
import { FieldPath } from "@/types/resume-doc";

interface TranslatablePattern {
  /** A dotted path where `*` stands for every index of an array. */
  pattern: string;
  /** Set when the field packs several strings into one, e.g. a bullet list. */
  splitOn?: string;
}

/**
 * The fields a translator is allowed to touch, and nothing else.
 *
 * Everything absent from this list is copied from the primary verbatim, which is
 * the point: `name`, `email`, `phone` and the URLs are not prose, and running a
 * skill list through a translator turns TypeScript into 打字稿 and Google into
 * 谷歌. Company names sit just inside that line too — they are copied, and the
 * editor offers to translate one on request instead.
 */
const TRANSLATABLE_PATTERNS: readonly TranslatablePattern[] = [
  { pattern: "wantedJob" },
  { pattern: "city" },
  { pattern: "profile" },
  { pattern: "employmentHistory.*.jobTitle" },
  // Bullets joined by SPLIT_TEXT. Translated one at a time: a whole list in one
  // call comes back with the separators moved or eaten, and shorter inputs
  // translate better anyway.
  { pattern: "employmentHistory.*.description", splitOn: SPLIT_TEXT },
  // The project's own name is a proper noun and its URL is not prose — both are
  // copied. Only the bullets describing the work are translated, one at a time
  // for the same reason as the employment ones.
  { pattern: "projects.*.description", splitOn: SPLIT_TEXT },
  { pattern: "educations.*.school" },
  { pattern: "educations.*.degree" },
  { pattern: "educations.*.major" },
] as const;

export interface TranslatableField {
  path: FieldPath;
  splitOn?: string;
}

const readPath = (target: unknown, segments: string[]): unknown =>
  segments.reduce<unknown>(
    (value, segment) =>
      value === null || value === undefined
        ? undefined
        : (value as Record<string, unknown>)[segment],
    target,
  );

export const getFieldValue = (resume: Resume, path: FieldPath): string => {
  const value = readPath(resume, path.split("."));

  return typeof value === "string" ? value : "";
};

/** Mutates in place; callers own a clone made for the purpose. */
export const setFieldValue = (resume: Resume, path: FieldPath, value: string) => {
  const segments = path.split(".");
  const last = segments.pop();
  if (!last) return;

  const parent = readPath(resume, segments);
  if (parent === null || typeof parent !== "object") return;

  (parent as Record<string, unknown>)[last] = value;
};

/** Resolves the `*` in every pattern against the resume actually in hand. */
export const listTranslatableFields = (resume: Resume): TranslatableField[] =>
  TRANSLATABLE_PATTERNS.flatMap(({ pattern, splitOn }) => {
    const star = pattern.indexOf(".*.");
    if (star === -1) return [{ path: pattern, splitOn }];

    const arrayKey = pattern.slice(0, star);
    const rest = pattern.slice(star + 3);
    const list = readPath(resume, arrayKey.split("."));
    if (!Array.isArray(list)) return [];

    return list.map((_, index) => ({ path: `${arrayKey}.${index}.${rest}`, splitOn }));
  });
