import { Resume } from "@/types/resume";
import { FieldPath, TranslationMeta } from "@/types/resume-doc";
import { getFieldValue, listTranslatableFields } from "./fields";

export interface FieldStatus {
  path: FieldPath;
  /** The primary text has moved on since this translation was made. */
  stale: boolean;
  /** The text here is no longer what the translator produced. */
  edited: boolean;
}

/**
 * Compares a translated locale against the primary it came from.
 *
 * Both answers fall out of string equality, which is the whole reason the
 * provenance stores the strings rather than a hash of them.
 */
export const listFieldStatuses = (
  source: Resume,
  target: Resume,
  meta: TranslationMeta | undefined,
): FieldStatus[] =>
  listTranslatableFields(source).map(({ path }) => {
    const previous = meta?.fields[path];

    return {
      path,
      stale: !previous || previous.source !== getFieldValue(source, path),
      edited: !!previous && getFieldValue(target, path) !== previous.machine,
    };
  });

export const countStale = (statuses: FieldStatus[]) =>
  statuses.filter((status) => status.stale).length;

/**
 * Records one locale as an up-to-date translation of another without having
 * translated anything.
 *
 * Used when the two swap roles. Without it the demoted locale has no provenance
 * at all, so every field reads stale and the editor offers to "update" it — an
 * offer that would replace hand-written original text with a round trip back
 * through the translator.
 */
export const seedProvenance = (source: Resume, target: Resume): TranslationMeta => ({
  fields: Object.fromEntries(
    listTranslatableFields(source).map(({ path }) => [
      path,
      { source: getFieldValue(source, path), machine: getFieldValue(target, path) },
    ]),
  ),
  translatedAt: Date.now(),
});

/** The translation the field would revert to, when there is one to revert to. */
export const machineValue = (meta: TranslationMeta | undefined, path: FieldPath) =>
  meta?.fields[path]?.machine;
