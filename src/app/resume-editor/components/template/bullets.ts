import { SPLIT_TEXT } from "@/constants/textarea-split-text";

/**
 * The lines of a description field, as every template draws them.
 *
 * A description is one string with its lines joined by `SPLIT_TEXT` — see
 * `LabeledBulletTextAreaField` — and each of the sixteen section components used
 * to split it for itself. Sixteen copies of one expression is cheap to write and
 * expensive to change: the blank-line filter is the kind of detail that gets
 * fixed in the file someone happened to be in.
 *
 * Blank lines are dropped, but what survives is not trimmed: the templates render
 * what was typed, and trimming here would silently change the text on the sheet
 * rather than merely tidying this function.
 */
export const toBulletLines = (description: string | undefined): string[] =>
  (description ?? "").split(SPLIT_TEXT).filter((line) => line.trim() !== "");
