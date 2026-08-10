import { StyleSheet } from "@react-pdf/renderer";

import { SANS } from "../fonts";
import { PAGE_MIN_HEIGHT, pt } from "./units";

/**
 * A two-column sheet: a tinted 38% sidebar carrying the name, contact details,
 * links and skills, and a 62% column carrying the summary, experience and
 * education. Section headings are uppercase and letterspaced, each followed by a
 * hairline rule.
 *
 * `display: "flex"` is spelled out on every flex container because these same
 * objects are applied as CSS in the preview, where flex is not the default.
 */

const BODY_LINE_HEIGHT = 1.51;
const LABEL_LINE_HEIGHT = 1.17;

/** Ink for the right-hand column; the sidebar picks its own — see panel-color. */
export const CONTENT_COLOR = "#2e404a";

export const SECTION_SPACING = pt(32);
export const ICON_SIZE = 20;

/**
 * The band kept clear at the top and bottom of *every* page.
 *
 * It lives on the `Page` rather than on the two columns because that is the only
 * place either renderer repeats it: @react-pdf re-applies a page's padding to
 * each page it spills onto, and `use-pagination` reads this same padding back off
 * the element to decide where the preview's breaks may land. As the columns' own
 * padding it only ever indented the first page — page two opened with its first
 * line against the trim.
 */
export const PAGE_PADDING_Y = pt(25);

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
    flexDirection: "row",
    minHeight: PAGE_MIN_HEIGHT,
    paddingTop: PAGE_PADDING_Y,
    paddingBottom: PAGE_PADDING_Y,
    backgroundColor: "#fff",
    fontFamily: SANS,
    fontSize: pt(14),
    lineHeight: BODY_LINE_HEIGHT,
    color: CONTENT_COLOR,
  },

  sidebar: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    width: "38%",
    paddingRight: pt(18),
    paddingLeft: pt(24),
    rowGap: SECTION_SPACING,
  },

  /*
   * The tint itself, as a layer behind the sidebar's contents rather than the
   * sidebar's own `backgroundColor`.
   *
   * The page's vertical padding is what keeps text off the trim on every page,
   * and a background painted on the padded column would stop at that padding —
   * leaving a white band across the top and bottom of a panel whose whole point
   * is to run edge to edge. Taken out of the flow it can be pushed back over the
   * padding and given the full height of the page. It is the sidebar's first
   * child, so the contents paint over it.
   */
  sidebarPanel: {
    position: "absolute",
    top: `-${PAGE_PADDING_Y}`,
    bottom: `-${PAGE_PADDING_Y}`,
    left: 0,
    right: 0,
    // The floor is a page: in the PDF the panel is stretched by nothing else, and
    // it has to reach the foot of the sheet even on a resume that stops halfway.
    // `bottom` is what carries it past one page in the preview, where the sidebar
    // is as tall as the whole run rather than as tall as a page.
    minHeight: PAGE_MIN_HEIGHT,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    width: "62%",
    padding: `0 ${pt(24)} 0 ${pt(16)}`,
    rowGap: SECTION_SPACING,
  },

  identity: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(20),
  },
  name: {
    fontFamily: SANS,
    fontSize: pt(26),
    fontWeight: "bold",
    lineHeight: LABEL_LINE_HEIGHT,
    textTransform: "uppercase",
  },
  jobTitle: {
    fontFamily: SANS,
    fontSize: pt(16),
  },

  section: {
    display: "flex",
    flexDirection: "column",
  },
  sectionTitle: {
    fontFamily: SANS,
    fontSize: pt(16),
    letterSpacing: pt(0.8),
    lineHeight: LABEL_LINE_HEIGHT,
    textTransform: "uppercase",
  },
  /* 8pt of air above the rule, 16pt below it, matching the reference. */
  sectionRule: {
    marginTop: pt(8),
    marginBottom: pt(16),
    borderTopWidth: pt(1),
    borderTopStyle: "solid",
  },

  detailList: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(8),
  },
  detailRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    columnGap: pt(6),
  },
  detailText: {
    flex: 1,
    fontFamily: SANS,
  },

  bulletList: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(8),
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

  entryList: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(16),
  },
  entry: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(12),
  },
  entryHeader: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(8),
  },
  entryDate: {
    fontFamily: SANS,
  },
  entryTitle: {
    fontFamily: SANS,
    fontWeight: "bold",
  },
  entryLocation: {
    fontFamily: SANS,
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

  summary: {
    fontFamily: SANS,
  },

  /*
   * `display: flex` is load-bearing in the preview: a link renders there as a
   * <link> element, which the browser's own stylesheet hides. @react-pdf has no
   * `currentColor` either, so the panel ink is handed to each link inline.
   */
  link: {
    display: "flex",
    fontFamily: SANS,
    textDecoration: "underline",
  },
});
