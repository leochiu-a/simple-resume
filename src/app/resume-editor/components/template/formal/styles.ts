import { StyleSheet } from "@react-pdf/renderer";

import { SANS, SERIF } from "../fonts";
import { PAGE_MIN_HEIGHT, pt } from "./units";

/**
 * A single-column sheet led by a centred header: the wanted job above the name,
 * the contact details on one wrapping row, and a dashed rule closing the block
 * off. Below it every section is a bold uppercase title over an indented body,
 * with no rules anywhere.
 *
 * `display: "flex"` is spelled out on every flex container because these same
 * objects are applied as CSS in the preview, where flex is not the default.
 *
 * Only "Noto Serif" is available in bold (see `fonts.ts`), so the serif is spent
 * on the display text that is bold anyway — the name and the section titles —
 * and everything set at a regular weight stays in "Noto Sans".
 */

const BODY_LINE_HEIGHT = 1.3;
const LABEL_LINE_HEIGHT = 1.1;

/** The ink the whole sheet is set in; only the name takes the picked colour. */
export const INK = "rgb(2, 6, 27)";

/** The dashed rule under the header, and the dot between contact details. */
const HAIRLINE_COLOR = "#dadada";
const SEPARATOR_COLOR = "#aaa";

/**
 * 20 rather than the 24 it was, to pay for the profile's leading below.
 *
 * This template's default sheet finishes within about ten points of the bottom,
 * so giving the profile any leading of its own pushed four runs onto a second
 * page — a short resume with two links stranded there. The height had to come from
 * somewhere, and the gaps between sections were the loosest thing on the sheet.
 * Air moved out of the spaces between blocks and into the one block that is
 * running prose, which is a better distribution of the same page.
 *
 * It stops at 20, and the profile at 1.4 rather than the 1.5 the other templates
 * use, because that is the pair that fits. Going further on either — 18 with a
 * 1.5 profile, or 14 with 24's worth of section air — buys nothing and costs the
 * airiness that is this template's whole character: at 14 its sections sit as
 * tight as Compact's, which is the template whose entire point is being dense.
 *
 * Not free to grow again without re-checking: the single-page assertion in
 * `e2e/formal-template.spec.ts` is what catches it.
 */
export const SECTION_SPACING = pt(20);
/** The gap between entries, and between a summary's paragraphs. */
export const PARAGRAPH_SPACING = pt(18.4);
/** Every section body is indented this far from the sheet's own padding. */
const BODY_INDENT = pt(30);

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
    padding: pt(36),
    backgroundColor: "#fff",
    fontFamily: SANS,
    fontSize: pt(14),
    lineHeight: BODY_LINE_HEIGHT,
    color: INK,
  },

  /* Header ---------------------------------------------------------------- */

  header: {
    display: "flex",
    flexDirection: "column",
    paddingBottom: pt(20),
  },
  headerInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    rowGap: pt(16),
    paddingBottom: pt(22),
    borderBottomWidth: pt(1.5),
    borderBottomStyle: "dashed",
    borderBottomColor: HAIRLINE_COLOR,
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    rowGap: pt(8),
  },
  jobTitle: {
    fontFamily: SANS,
    fontSize: pt(16),
    fontWeight: "bold",
  },
  name: {
    fontFamily: SERIF,
    fontSize: pt(38),
    fontWeight: "bold",
    lineHeight: LABEL_LINE_HEIGHT,
  },

  contactRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "baseline",
    columnGap: pt(8),
    rowGap: pt(8),
  },
  contactItem: {
    fontFamily: SANS,
  },
  contactLabel: {
    fontFamily: SANS,
    fontWeight: "bold",
  },
  /*
   * The reference hangs this dot off each item with `::after`, which @react-pdf
   * has no equivalent for, so it is rendered as a Text of its own between items.
   */
  contactSeparator: {
    fontFamily: SANS,
    marginLeft: pt(8),
    color: SEPARATOR_COLOR,
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
    rowGap: pt(8),
  },
  sectionTitle: {
    fontFamily: SERIF,
    fontSize: pt(16),
    fontWeight: "bold",
    lineHeight: LABEL_LINE_HEIGHT,
    textTransform: "uppercase",
  },

  /**
   * The profile is the one place on the sheet with several lines of running prose,
   * and it sets its own leading rather than taking the page's.
   *
   * It has to be said explicitly: @react-pdf does not inherit a `Page`'s
   * `lineHeight` into the nested `Text` the shared `Summary` renders, while the
   * preview does inherit it, because CSS `line-height` does. So this block printed
   * at the font's natural leading and displayed at the page's, and neither was the
   * leading a paragraph of this measure wants.
   *
   * Saying it costs height, which is why the two spacing constants above came
   * down. See them for the trade.
   */
  summary: {
    fontFamily: SANS,
    paddingLeft: BODY_INDENT,
    fontSize: pt(14),
    lineHeight: 1.4,
  },

  entryList: {
    display: "flex",
    flexDirection: "column",
    rowGap: PARAGRAPH_SPACING,
    paddingLeft: BODY_INDENT,
  },
  entry: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(8),
  },
  entryHeadline: {
    fontFamily: SANS,
    fontSize: pt(16),
    fontWeight: "bold",
  },
  /** The experience headline shouts; its date range stays as typed. */
  entryHeadlineUpper: {
    textTransform: "uppercase",
  },
  entryHeadlineDate: {
    fontFamily: SANS,
    fontWeight: "normal",
    textTransform: "none",
  },
  entrySubline: {
    fontFamily: SANS,
    fontWeight: "normal",
  },

  description: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(4),
  },
  descriptionRow: {
    display: "flex",
    flexDirection: "row",
    marginLeft: pt(16),
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
    paddingLeft: BODY_INDENT,
    /* Every run opens with `entryHead`'s top margin, including the first one,
       which should sit at the section's own 8pt. Pulling the list up by that
       margin leaves the first entry where it was and every later one spaced. */
    marginTop: `-${PARAGRAPH_SPACING}`,
  },
  /** Opens a run. The margin is the gap `entryList` used to put between entries. */
  entryHead: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(8),
    marginTop: PARAGRAPH_SPACING,
  },
  /** Continues a run, at the gap `description` used to open between two bullets. */
  entryBullet: {
    display: "flex",
    flexDirection: "row",
    marginLeft: pt(16),
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
    rowGap: pt(9.2),
    paddingLeft: BODY_INDENT,
  },
  skillItem: {
    display: "flex",
    flexDirection: "row",
    width: "50%",
  },

  bulletList: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(8),
    paddingLeft: BODY_INDENT,
  },
  bulletRow: {
    display: "flex",
    flexDirection: "row",
  },
  bullet: {
    fontFamily: SANS,
    marginRight: pt(6),
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
