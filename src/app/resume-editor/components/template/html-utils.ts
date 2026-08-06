/** Helpers shared by the standalone HTML builders. */

import { toParagraphs } from "@/lib/paragraphs";

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * The profile as one `<p>` per paragraph.
 *
 * `white-space: pre-line` keeps the single newlines *inside* a paragraph, which
 * `escapeHtml` alone would leave for the browser to collapse. Between paragraphs
 * the `<p>` does the work, so the export reads the way the textarea does.
 *
 * `className` is optional because only Formal's summary is styled by class.
 */
export const paragraphsHtml = (profile: string, className?: string) =>
  toParagraphs(profile)
    .map(
      (paragraph) =>
        `<p${className ? ` class="${className}"` : ""} style="white-space: pre-line;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

/**
 * Only http(s) and mailto links survive; anything else (javascript:, data:, …)
 * is dropped so a pasted social link cannot turn into script in the exported
 * file.
 */
export const safeHref = (url: string) => {
  try {
    const parsed = new URL(url, "https://example.com");
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? url : null;
  } catch {
    return null;
  }
};

export const GOOGLE_FONTS_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />`;
