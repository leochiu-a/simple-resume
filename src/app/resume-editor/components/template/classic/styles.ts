import { StyleSheet } from "@react-pdf/renderer";

/**
 * The band kept clear at the top and bottom of *every* page.
 *
 * It lives on the `Page` rather than on the content column because that is the
 * only place either renderer repeats it: @react-pdf re-applies a page's padding
 * to each page it spills onto, and `use-pagination` reads this same padding back
 * off the element to decide where the preview's breaks may land. The 40pt used
 * to be the column's own `margin-top`, which by definition only ever indented
 * the first page — page two opened with its first line against the trim.
 */
export const PAGE_PADDING_Y = "40pt";

export const styles = StyleSheet.create({
  page: {
    display: "flex",
    flexDirection: "row",
    paddingTop: PAGE_PADDING_Y,
    paddingBottom: PAGE_PADDING_Y,
    backgroundColor: "#fff",
  },
  flexRow: {
    display: "flex",
    flexDirection: "row",
  },
  flexCol: {
    display: "flex",
    flexDirection: "column",
  },
  /*
   * No `height`: the panel is stretched by the `top` and `bottom` the template
   * anchors it with. A height alongside those two over-constrains the box, and
   * the one that loses is `bottom` — which is the end that has to reach the foot
   * of the sheet.
   */
  info: {
    width: "190pt",
    flexShrink: 0,
  },
});
