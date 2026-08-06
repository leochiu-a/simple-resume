import { Resume } from "./resume";

/**
 * The languages a resume can be written in. Both are codes the Chrome Translator
 * API accepts verbatim — `zh-Hant` rather than `zh`, which is Simplified.
 */
export type ResumeLang = "zh-Hant" | "en";

/**
 * A dotted path into a `Resume`: "profile", "employmentHistory.0.description".
 * Only the fields listed in `TRANSLATABLE_PATTERNS` ever appear as one.
 */
export type FieldPath = string;

/**
 * What a translated field was made from, kept so the editor can tell three
 * states apart without asking the translator again:
 *
 * - stale — the primary text has moved on since `source` was captured
 * - edited — the field no longer reads `machine`, so a human changed it
 * - clean — neither of the above
 *
 * Storing the strings rather than a hash costs a few KB and buys plain `===`
 * comparisons, plus a free "revert to the translation" (write `machine` back).
 */
export interface FieldProvenance {
  /** The primary-language text this translation was made from. */
  source: string;
  /** What the translator produced. Reverting to it clears the edited flag. */
  machine: string;
}

export interface TranslationMeta {
  fields: Record<FieldPath, FieldProvenance>;
  translatedAt: number;
}

/**
 * The whole document: one `Resume` per language, and one of them — `primaryLang`
 * — is the source of truth. Every other locale is a translation of it that the
 * user may hand-correct, and those corrections never travel back: nothing writes
 * to `locales[primaryLang]` while a different locale is active.
 *
 * `Resume` itself is untouched by any of this, so the templates, the PDF and the
 * WebMCP tools keep seeing exactly the shape they always have.
 */
export interface ResumeDoc {
  version: 2;
  primaryLang: ResumeLang;
  activeLang: ResumeLang;
  locales: Partial<Record<ResumeLang, Resume>>;
  /** Present for translated locales only — the primary has nothing to track. */
  translation: Partial<Record<ResumeLang, TranslationMeta>>;
}
