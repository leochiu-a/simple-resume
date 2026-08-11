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

/**
 * The gap this template puts between two entries in a section.
 *
 * It used to be the entry list's own `gap`. An entry is a run of separately
 * unbreakable blocks now (see `employment-history.tsx`), and a gap on the list
 * would space every bullet as far apart as two whole jobs — so it is carried by
 * whichever block opens a run instead.
 */
const ENTRY_SPACING = "12pt";

/**
 * A list of entries whose bullets may break across a page.
 *
 * No `gap`: the blocks inside carry their own spacing. The negative top margin
 * cancels the one on the first `entryHead`, which would otherwise push the first
 * entry away from the section title.
 */
export const splitEntryList = {
  ...styles.flexCol,
  marginTop: `-${ENTRY_SPACING}`,
};

/** Opens a run: the headline, its dates, and the first bullet, bound together. */
export const entryHead = {
  ...styles.flexCol,
  marginTop: ENTRY_SPACING,
};

/** Continues a run — one bullet, free to start a new page. */
export const entryBullet = {
  ...styles.flexRow,
  gap: "4pt",
  paddingLeft: "12px",
};
