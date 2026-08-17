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
 * The sheet's own margin, and the same distance back out again.
 *
 * This template is the only one whose colour runs to the paper's edge, and the
 * padding that keeps the body off that edge is the thing in the way. It stays on
 * the `Page` — @react-pdf applies page padding to *every* page, so a resume that
 * spills over still opens its second page below a margin rather than flush
 * against the top edge — and the band cancels it with a matching negative margin.
 *
 * Bleeding by pulling the band out is what keeps that guarantee. Dropping the
 * page's padding and letting each block pad itself would bleed the band just as
 * well and cost the second page its top margin, because a `View`'s padding is
 * not reapplied where it wraps.
 */
export const PAGE_PADDING = pt(36);
export const PAGE_BLEED = `-${PAGE_PADDING}`;
