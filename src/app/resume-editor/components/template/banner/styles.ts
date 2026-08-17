import { StyleSheet } from "@react-pdf/renderer";

import { SANS, SERIF } from "../fonts";
import { PAGE_BLEED, PAGE_MIN_HEIGHT, PAGE_PADDING, pt } from "./units";

/**
 * A full-bleed colour band across the top of the sheet, then a single column of
 * sections beneath it.
 *
 * The band is the whole design, and it is the only place the picked colour goes.
 * That is what lets the body stay flush to the left margin with no indent and no
 * rules: the eye is given its landmark at the top of the page and needs no
 * further furniture to find its way down. It also means the colour cannot make
 * the body unreadable — a heading tinted with the picked colour would vanish the
 * moment someone chose a near-white one, which is a failure the band avoids by
 * flipping its own text instead (see `banner-color.ts`).
 *
 * `display: "flex"` is spelled out on every flex container because these same
 * objects are applied as CSS in the preview, where flex is not the default.
 *
 * Only "Noto Serif" is available in bold (see `fonts.ts`), so the serif is spent
 * on the one piece of display text that is bold anyway — the name — and
 * everything else stays in "Noto Sans".
 */

const BODY_LINE_HEIGHT = 1.35;
const TIGHT_LINE_HEIGHT = 1.15;

/** The ink the body is set in. The band brings its own, picked to suit its fill. */
export const INK = "rgb(2, 6, 27)";
/** Dates and sublines, which are read after the thing they qualify. */
export const MUTED = "rgb(90, 98, 112)";

export const SECTION_SPACING = pt(22);
/** The gap between entries, and between a summary's paragraphs. */
export const PARAGRAPH_SPACING = pt(15);

export const styles = StyleSheet.create({
  /*
   * `boxSizing` is load-bearing, not decoration: yoga treats `minHeight` as
   * border-box while the browser defaults to content-box, so without it the
   * preview's sheet grows by the page padding and reports a page that the PDF
   * does not have.
   */
  page: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    minHeight: PAGE_MIN_HEIGHT,
    padding: PAGE_PADDING,
    backgroundColor: "#fff",
    fontFamily: SANS,
    fontSize: pt(14),
    lineHeight: BODY_LINE_HEIGHT,
    color: INK,
  },

  /* Band ------------------------------------------------------------------ */

  /*
   * Pulled out to the paper's edge on three sides by exactly the padding the page
   * puts there. See `units.ts` for why the padding stays on the page rather than
   * being pushed down onto the blocks inside it.
   */
  band: {
    display: "flex",
    flexDirection: "column",
    marginTop: PAGE_BLEED,
    marginLeft: PAGE_BLEED,
    marginRight: PAGE_BLEED,
    marginBottom: pt(26),
    /*
     * Spelled out per edge. `paddingVertical` and `paddingHorizontal` are
     * @react-pdf's own shorthands and are not CSS properties, so the browser drops
     * them: the PDF got its padding and the preview rendered the name hard against
     * the paper's edge with the rule running the full width of the sheet.
     */
    paddingTop: pt(32),
    paddingBottom: pt(32),
    paddingLeft: PAGE_PADDING,
    paddingRight: PAGE_PADDING,
    rowGap: pt(14),
  },
  /*
   * The name and the job it wants, as one block.
   *
   * The gap is not decoration. At 36pt the serif's descenders reach well past the
   * line box a 1.15 line-height draws, so the two lines set flush printed the
   * wanted job through the tail of the name's "y".
   */
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(8),
  },
  name: {
    fontFamily: SERIF,
    fontSize: pt(36),
    fontWeight: "bold",
    lineHeight: TIGHT_LINE_HEIGHT,
  },
  wantedJob: {
    fontFamily: SANS,
    fontSize: pt(14),
    letterSpacing: pt(1.6),
    lineHeight: TIGHT_LINE_HEIGHT,
    textTransform: "uppercase",
  },
  /*
   * Drawn as a filled box rather than a border: a border would need `boxSizing`
   * to measure the same in both renderers, and a rule has no content to size
   * around anyway.
   */
  bandRule: {
    width: "100%",
    height: pt(1),
  },
  contactRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: pt(8),
    rowGap: pt(6),
  },
  contactItem: {
    fontFamily: SANS,
    fontSize: pt(13),
  },
  /*
   * The reference hangs this dot off each item with `::after`, which @react-pdf
   * has no equivalent for, so it is rendered as a Text of its own between items.
   */
  contactSeparator: {
    fontFamily: SANS,
    fontSize: pt(13),
  },

  /* Body ------------------------------------------------------------------ */

  body: {
    display: "flex",
    flexDirection: "column",
    rowGap: SECTION_SPACING,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(10),
  },
  sectionTitle: {
    fontFamily: SANS,
    fontSize: pt(13),
    fontWeight: "bold",
    letterSpacing: pt(1.8),
    lineHeight: TIGHT_LINE_HEIGHT,
    textTransform: "uppercase",
  },

  summary: {
    fontFamily: SANS,
  },

  entryList: {
    display: "flex",
    flexDirection: "column",
    rowGap: PARAGRAPH_SPACING,
  },
  entry: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(3),
  },
  /*
   * Headline left, dates right, on one line. `flex: 1` on the headline is what
   * pushes the date to the margin — `justifyContent: "space-between"` alone would
   * let a long job title run into it.
   */
  entryTopRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
    columnGap: pt(12),
  },
  entryHeadline: {
    flex: 1,
    fontFamily: SANS,
    fontSize: pt(15),
    fontWeight: "bold",
  },
  entryDate: {
    fontFamily: SANS,
    fontSize: pt(13),
    color: MUTED,
  },
  entrySubline: {
    fontFamily: SANS,
    fontSize: pt(13.5),
    color: MUTED,
  },

  description: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(4),
  },
  descriptionRow: {
    display: "flex",
    flexDirection: "row",
    marginTop: pt(4),
  },

  /*
   * An entry whose bullets may break across a page is not one block but a run of
   * them: the headline bound to its first bullet, then each remaining bullet on
   * its own. See `experience.tsx` for why it is split up that way.
   *
   * The spacing has to move with it. Those blocks are siblings in the section's
   * list now, so a single `rowGap` on the list would space bullets as far apart as
   * whole jobs — this list sets no gap at all and each block carries its own top
   * margin instead.
   */
  splitEntryList: {
    display: "flex",
    flexDirection: "column",
    /* Every run opens with `entryHead`'s top margin, including the first one,
       which should sit at the section's own 10pt. Pulling the list up by that
       margin leaves the first entry where it was and every later one spaced. */
    marginTop: `-${PARAGRAPH_SPACING}`,
  },
  /** Opens a run. The margin is the gap `entryList` used to put between entries. */
  entryHead: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(3),
    marginTop: PARAGRAPH_SPACING,
  },
  /** Continues a run, at the gap `description` used to open between two bullets. */
  entryBullet: {
    display: "flex",
    flexDirection: "row",
    marginTop: pt(4),
  },

  /*
   * Two columns of skills. @react-pdf has no CSS grid, so the row wraps and each
   * item claims half of it.
   */
  skillList: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: pt(6),
  },
  /*
   * `boxSizing` is load-bearing here, not decoration. Yoga measures the 50% as
   * border-box, so the padding sits inside it; the browser defaults to
   * content-box, so in the preview each item came out wider than half and only
   * one fitted per row — two columns in the PDF, a single stack on screen.
   */
  skillItem: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "row",
    width: "50%",
    paddingRight: pt(12),
  },

  bulletList: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(6),
  },
  bulletRow: {
    display: "flex",
    flexDirection: "row",
  },
  bullet: {
    fontFamily: SANS,
    marginRight: pt(8),
  },
  bulletText: {
    flex: 1,
    fontFamily: SANS,
  },

  /*
   * `display: flex` is load-bearing in the preview: a link renders there as a
   * <link> element, which the browser's own stylesheet hides.
   */
  link: {
    display: "flex",
    fontFamily: SANS,
    color: INK,
    textDecoration: "underline",
  },
});
