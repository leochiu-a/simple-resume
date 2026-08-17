/**
 * The layout this template follows is specified in CSS pixels on a 745px-wide
 * sheet, while the PDF page is 595.28pt wide. Every size in `styles.ts` is
 * therefore written as the original pixel value and converted here once, so the
 * numbers stay comparable with the design they came from.
 *
 * The result carries an explicit `pt` unit rather than being a bare number. The
 * preview renders the same style objects as plain CSS (see `resume-iframe.tsx`),
 * where a unitless number would silently mean pixels and shrink the layout by a
 * quarter; `"11.19pt"` is understood by @react-pdf and the browser alike.
 */

const REFERENCE_SHEET_WIDTH_PX = 745;
const A4_WIDTH_PT = 595.28;

const PT_PER_PX = A4_WIDTH_PT / REFERENCE_SHEET_WIDTH_PX;

export const pt = (px: number) => `${Math.round(px * PT_PER_PX * 100) / 100}pt`;

/**
 * Slightly under A4's 841.89pt so the sheet stays one page: it keeps the sheet
 * white to the bottom edge in the preview, where the page has no intrinsic
 * height of its own.
 */
export const PAGE_MIN_HEIGHT = "841pt";

/**
 * The date margin's share of the text column, as a percentage string.
 *
 * The two renderers have to agree on this number or the dates and the entries
 * beside them drift apart between the preview and the PDF, so it is defined once
 * here and both `styles.ts` and the HTML builder read it.
 *
 * 22% is what a date range needs. Narrower and "January 2018 — November 2024"
 * wraps to three lines against a two-line headline, which puts the gutter's text
 * taller than the entry it labels.
 */
export const DATE_COLUMN_WIDTH = "22%";
/** What separates the date from the entry it belongs to. */
export const DATE_COLUMN_GAP = pt(18);
