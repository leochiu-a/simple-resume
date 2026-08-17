import { StyleSheet } from "@react-pdf/renderer";

import { SANS } from "../fonts";
import { PAGE_MIN_HEIGHT, PAGE_PADDING, pt } from "./units";

/**
 * One dense column, no panel and no gutter — the template for someone whose ten
 * years have to fit on one page, and for the parsers that read it.
 *
 * Density here is not just a smaller type size. It is a line saved per entry: the
 * job title and its company share one line, the school and its degree share one,
 * and the skills are a single wrapped run rather than a two-column list. Those
 * are the three places the other templates spend a line each on a second row.
 *
 * The picked colour goes on the section headings and the rule that trails them,
 * which is the same bargain Formal strikes by tinting the name: there is no panel
 * to fill, so the colour lands on type and a near-white choice makes that type
 * near-invisible. That is the user's to make — what it must not do is take the
 * body copy with it, so everything below a heading stays in ink.
 *
 * `display: "flex"` is spelled out on every flex container because these same
 * objects are applied as CSS in the preview, where flex is not the default.
 *
 * Sans throughout. The one serif face available is bold-only display type (see
 * `fonts.ts`), and there is no display text on this sheet to spend it on.
 */

const BODY_LINE_HEIGHT = 1.28;
const TIGHT_LINE_HEIGHT = 1.15;

export const INK = "rgb(2, 6, 27)";
/** Dates, sublines and the contact line — read after the thing they qualify. */
export const MUTED = "rgb(94, 102, 116)";

export const SECTION_SPACING = pt(13);
/** The gap between entries, and between a summary's paragraphs. */
export const PARAGRAPH_SPACING = pt(9);

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
    fontSize: pt(12.5),
    lineHeight: BODY_LINE_HEIGHT,
    color: INK,
  },

  /* Header ---------------------------------------------------------------- */

  header: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(4),
    marginBottom: pt(14),
  },
  name: {
    fontFamily: SANS,
    fontSize: pt(23),
    fontWeight: "bold",
    lineHeight: TIGHT_LINE_HEIGHT,
  },
  /*
   * The wanted job and every contact detail on one wrapping line.
   *
   * A run of `Text` in a wrapping row rather than one joined string, because a
   * detail left blank has to take its separator with it — and because the row is
   * what lets a long line wrap between two details instead of mid-address.
   */
  contactRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: pt(6),
  },
  contactItem: {
    fontFamily: SANS,
    fontSize: pt(12.5),
    color: MUTED,
  },
  contactSeparator: {
    fontFamily: SANS,
    fontSize: pt(12.5),
    color: MUTED,
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
    rowGap: pt(5),
  },
  /*
   * The heading and its rule share a line: the title sits at the left and the
   * rule runs from the end of it out to the right margin.
   *
   * That is what keeps this from being Modern's heading-over-a-hairline at a
   * smaller size — and it is also the denser of the two, since the rule costs no
   * line of its own.
   */
  sectionHeading: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    columnGap: pt(8),
  },
  sectionTitle: {
    fontFamily: SANS,
    fontSize: pt(11.5),
    fontWeight: "bold",
    letterSpacing: pt(1.4),
    lineHeight: TIGHT_LINE_HEIGHT,
    textTransform: "uppercase",
  },
  /*
   * Drawn as a filled box rather than a border: a border would need `boxSizing`
   * to measure the same in both renderers, and a rule has no content to size
   * around anyway.
   */
  sectionRule: {
    flex: 1,
    height: pt(1),
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
    columnGap: pt(10),
  },
  entryHeadline: {
    flex: 1,
    fontFamily: SANS,
    fontSize: pt(13),
  },
  /** The job title and the school; what follows the comma is set normally. */
  entryHeadlineStrong: {
    fontFamily: SANS,
    fontWeight: "bold",
  },
  entryDate: {
    fontFamily: SANS,
    fontSize: pt(12),
    color: MUTED,
  },
  /** Only Projects uses this — its url has no date's line to share. */
  entrySubline: {
    fontFamily: SANS,
    fontSize: pt(12),
    color: MUTED,
  },

  descriptionRow: {
    display: "flex",
    flexDirection: "row",
    marginTop: pt(2),
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
       which should sit at the section's own 5pt. Pulling the list up by that
       margin leaves the first entry where it was and every later one spaced. */
    marginTop: `-${PARAGRAPH_SPACING}`,
  },
  /** Opens a run. The margin is the gap `entryList` used to put between entries. */
  entryHead: {
    display: "flex",
    flexDirection: "column",
    marginTop: PARAGRAPH_SPACING,
  },
  /** Continues a run, at the gap `descriptionRow` opens between two bullets. */
  entryBullet: {
    display: "flex",
    flexDirection: "row",
    marginTop: pt(2),
  },

  bullet: {
    fontFamily: SANS,
    marginRight: pt(7),
  },
  bulletText: {
    flex: 1,
    fontFamily: SANS,
  },

  /**
   * Skills as one wrapping run separated by middots, not a list.
   *
   * Six skills as a two-column bulleted list is three lines and a lot of paper;
   * the same six read as one. It is also the shape a parser handles best — a
   * single delimited run under a "Skills" heading, with no column order to get
   * wrong.
   */
  inlineList: {
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
