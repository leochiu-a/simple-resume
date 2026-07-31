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

export const styles = StyleSheet.create({
  page: {
    display: "flex",
    flexDirection: "row",
    minHeight: PAGE_MIN_HEIGHT,
    backgroundColor: "#fff",
    fontFamily: SANS,
    fontSize: pt(14),
    lineHeight: BODY_LINE_HEIGHT,
    color: CONTENT_COLOR,
  },

  sidebar: {
    display: "flex",
    flexDirection: "column",
    width: "38%",
    padding: `${pt(25)} ${pt(18)} ${pt(25)} ${pt(24)}`,
    rowGap: SECTION_SPACING,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    width: "62%",
    padding: `${pt(25)} ${pt(24)} ${pt(25)} ${pt(16)}`,
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
