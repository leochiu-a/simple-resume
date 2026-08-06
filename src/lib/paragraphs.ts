/**
 * Splits a free-text field into the paragraphs it was typed as.
 *
 * The profile is the one field that is a block of prose rather than a list, so
 * it is stored as the raw string the textarea holds — newlines and all. The
 * renderers used to drop them: the preview draws @react-pdf's tree as HTML,
 * where `white-space` is `normal` and a newline collapses to a space, and the
 * HTML export wrapped everything in one `<p>`. Typed paragraphs came out as a
 * single unbroken block.
 *
 * A blank line starts a new paragraph and a single newline is a line break, so
 * both survive: paragraphs are separated here, and the lines within one are kept
 * as `\n` for the renderer to break on (`white-space: pre-line` in HTML, which
 * @react-pdf also honours inside a `Text`).
 *
 * Runs of more than one blank line collapse to a single paragraph break rather
 * than producing empty paragraphs, which is what a reader means by pressing
 * enter a few extra times.
 *
 * Nothing here tries to repair a break that fell inside a word — the shape text
 * pasted out of a PDF or an email client arrives in, hard-wrapped at the source's
 * column (`Letraset sheets c` / `ontaining`). It is tempting, because such a
 * break is visibly wrong, but `word\nword` is exactly the shape of an intentional
 * list too:
 *
 *     Available on request
 *     References supplied separately
 *
 * The two are indistinguishable, so healing one corrupts the other — and a
 * writer can see and delete a torn word, while silently joined lines look like
 * text they never wrote. The break is therefore rendered as typed, and the
 * editor is where it gets fixed.
 */
export const toParagraphs = (text: string): string[] =>
  text
    // One or more blank lines: a newline, then whitespace holding another.
    .split(/\n[^\S\n]*(?:\n\s*)+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
