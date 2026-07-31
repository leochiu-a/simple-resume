import { StyleSheet } from "@react-pdf/renderer";

import { SANS } from "../fonts";
import { PAGE_MIN_HEIGHT, pt } from "./units";

/**
 * A banded sheet: the name and job title sit between two heavy rules across the
 * full width, below which a 70% main column carries the summary, experience and
 * education, and a 30% rail on the right carries contacts, skills and links. A
 * third heavy rule closes the sheet at the bottom.
 *
 * Section headings are the signature: the rule beneath them runs dark under the
 * title itself and continues in light grey across the rest of the column.
 *
 * `display: "flex"` is spelled out on every flex container because these same
 * objects are applied as CSS in the preview, where flex is not the default.
 */

const BODY_LINE_HEIGHT = 1.51;
const LABEL_LINE_HEIGHT = 1.17;

export const INK = "#02061b";
/** The grey the section rules and the timeline connectors are drawn in. */
export const RULE_COLOR = "#e6e6e6";

export const SECTION_SPACING = pt(24);
export const PARAGRAPH_SPACING = pt(16);

/**
 * The dot is 8px tall against a 21px first line (14px × 1.51), so it is nudged
 * down by half the difference to sit on the middle of the date rather than at the
 * top of its line box.
 */
const MARKER_SIZE_PX = 8;
export const MARKER_OFFSET_PX = 6;

/** The gap between entries, which the connector has to reach across. */
const ENTRY_GAP_PX = 16;

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

  /* The banded header: heavy rules above and below the identity. */
  header: {
    display: "flex",
    flexDirection: "column",
    paddingTop: pt(24),
    paddingBottom: pt(24),
    borderTopWidth: pt(3),
    borderTopStyle: "solid",
    borderTopColor: INK,
    borderBottomWidth: pt(3),
    borderBottomStyle: "solid",
    borderBottomColor: INK,
  },
  /* Coloured with the picked accent — handed in inline, since it is dynamic. */
  name: {
    fontFamily: SANS,
    fontSize: pt(22),
    fontWeight: "bold",
    lineHeight: LABEL_LINE_HEIGHT,
    textTransform: "uppercase",
  },
  jobTitle: {
    fontFamily: SANS,
    marginTop: pt(8),
    textTransform: "uppercase",
    color: INK,
  },

  columns: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: pt(8),
    paddingBottom: pt(8),
    flex: 1,
  },
  main: {
    display: "flex",
    flexDirection: "column",
    width: "70%",
    rowGap: SECTION_SPACING,
    paddingTop: pt(24),
    paddingRight: pt(8),
    borderRightWidth: pt(2),
    borderRightStyle: "solid",
    borderRightColor: RULE_COLOR,
  },
  rail: {
    display: "flex",
    flexDirection: "column",
    width: "30%",
    rowGap: SECTION_SPACING,
    paddingTop: pt(24),
    paddingLeft: pt(8),
  },

  footer: {
    height: pt(3),
    backgroundColor: INK,
  },

  section: {
    display: "flex",
    flexDirection: "column",
  },
  /*
   * The heading is a row of two rules rather than one: `::after` does not exist
   * here, so the grey remainder has to be a real sibling taking `flex: 1`.
   * `alignItems: "flex-end"` is what puts both borders on the same line.
   */
  sectionHeading: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    paddingBottom: PARAGRAPH_SPACING,
  },
  /* Wraps only the title, so the dark rule is exactly as wide as the word. */
  sectionTitleBox: {
    borderBottomWidth: pt(2),
    borderBottomStyle: "solid",
    borderBottomColor: INK,
  },
  /* The margin sits inside the box above, holding the rule off the letters. */
  sectionTitle: {
    fontFamily: SANS,
    fontSize: pt(16),
    fontWeight: "bold",
    letterSpacing: pt(1.2),
    lineHeight: LABEL_LINE_HEIGHT,
    textTransform: "uppercase",
    color: INK,
    marginBottom: pt(6),
  },
  sectionRule: {
    flex: 1,
    borderBottomWidth: pt(2),
    borderBottomStyle: "solid",
    borderBottomColor: RULE_COLOR,
  },

  summary: {
    fontFamily: SANS,
  },

  entryList: {
    display: "flex",
    flexDirection: "column",
    rowGap: PARAGRAPH_SPACING,
  },
  /* Two halves of equal width: dated marker on the left, detail on the right. */
  entry: {
    display: "flex",
    flexDirection: "row",
  },
  /*
   * The reference aligns this row on the baseline. That is dropped: the marker
   * column stretches to carry the connector, so there is nothing left for the
   * date to share a baseline with. The dot takes its own offset instead, which is
   * what baseline was buying (see `marker`).
   *
   * The gutter is an addition. A full range like "JANUARY 2018 — JANUARY 2020"
   * very nearly fills half the column, and without it the date stops a couple of
   * points short of the job title and the two read as one word.
   */
  entryLeft: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    paddingRight: pt(12),
  },
  entryRight: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    rowGap: pt(8),
  },
  /* Education spaces its two lines with the school's own margin instead. */
  educationRight: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },

  /*
   * `alignSelf: "stretch"` is what makes the connector possible: it opts the
   * column out of the row's baseline alignment so it spans the whole entry, and
   * the connector below the dot can then simply take `flex: 1`.
   */
  markerColumn: {
    display: "flex",
    flexDirection: "column",
    alignSelf: "stretch",
    alignItems: "flex-start",
    marginRight: pt(6),
  },
  /*
   * `boxSizing` is redundant for the PDF — yoga always lays borders out inside
   * the box — but the preview is plain CSS, where the default content-box would
   * add the 2px border on top of the 8px and round a 12px square instead of
   * drawing a circle.
   */
  marker: {
    boxSizing: "border-box",
    width: pt(MARKER_SIZE_PX),
    height: pt(MARKER_SIZE_PX),
    marginTop: pt(MARKER_OFFSET_PX),
    borderWidth: pt(2),
    borderStyle: "solid",
    borderColor: INK,
    borderRadius: pt(MARKER_SIZE_PX / 2),
    backgroundColor: "#fff",
    flexShrink: 0,
  },
  /*
   * Centred under the 8px dot: (8 - 2) / 2. The negative bottom margin is what
   * carries the line across the gap between entries and onto the next dot —
   * `flex: 1` alone would stop it at this entry's own bottom edge.
   */
  connector: {
    width: pt(2),
    flex: 1,
    marginLeft: pt(3),
    marginBottom: pt(-(ENTRY_GAP_PX + MARKER_OFFSET_PX)),
    backgroundColor: RULE_COLOR,
  },

  /*
   * The date sits in a column of its own rather than being a flex sibling of the
   * marker. As the only block child of a column it inherits a definite width and
   * wraps within it, the way the summary paragraph does; left as a bare flex item
   * beside the marker it would size to its own longest line instead.
   */
  entryDateColumn: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  entryDate: {
    fontFamily: SANS,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  /* Coloured with the picked accent, like the name. */
  entryTitle: {
    fontFamily: SANS,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  entryCompany: {
    fontFamily: SANS,
    fontWeight: "bold",
    paddingBottom: pt(3),
  },
  entrySchool: {
    fontFamily: SANS,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: pt(8),
  },
  entryDegree: {
    fontFamily: SANS,
    fontWeight: "bold",
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
  bullet: {
    fontFamily: SANS,
    marginRight: pt(6),
  },
  bulletText: {
    flex: 1,
    fontFamily: SANS,
  },

  contactList: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(10),
  },
  contactRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    columnGap: pt(6),
  },
  contactText: {
    flex: 1,
    fontFamily: SANS,
  },

  /* Skills are pills; @react-pdf has no grid, so they wrap as flex items. */
  pillRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: pt(6),
    rowGap: pt(8),
  },
  pill: {
    display: "flex",
    boxSizing: "border-box",
    alignItems: "center",
    justifyContent: "center",
    minHeight: pt(15),
    paddingLeft: pt(5),
    paddingRight: pt(5),
    borderWidth: pt(1),
    /* @react-pdf draws no border at all unless the style is explicit. */
    borderStyle: "solid",
    borderColor: INK,
    borderRadius: pt(19),
  },
  pillText: {
    fontFamily: SANS,
    textAlign: "center",
  },

  linkList: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(8),
  },
  /*
   * Deliberately no `flex`: as a child of the column above, `flex: 1` would give
   * each row a zero basis and stack all three links on top of one another.
   */
  linkRow: {
    fontFamily: SANS,
  },
  /*
   * `display: flex` is load-bearing in the preview: a link renders there as a
   * <link> element, which the browser's own stylesheet hides.
   */
  link: {
    display: "flex",
    fontFamily: SANS,
    textDecoration: "underline",
    color: INK,
  },
});
