import { StyleSheet } from "@react-pdf/renderer";

import { SANS, SERIF } from "../fonts";
import { DATE_COLUMN_GAP, DATE_COLUMN_WIDTH, PAGE_MIN_HEIGHT, pt } from "./units";

/**
 * Every dated entry hangs its date range in a narrow left margin, with the entry
 * itself in the wide column beside it — the arrangement an academic CV has used
 * for as long as there have been academic CVs, because it lets a reader scan the
 * chronology down one edge without reading a word of the entries.
 *
 * Not to be confused with Ledger, which also puts something in a left gutter. That
 * one puts the *section titles* there and gives every section the same treatment.
 * Here the gutter belongs to the entries, and it carries a different fact — when,
 * not what — which is a different thing to scan for.
 *
 * Only Experience and Education put anything in it, because only they have dates.
 * The other four keep the same two columns with the gutter left empty, so that
 * every section's content starts on one edge — see `section.tsx` for why they do
 * not simply run the full measure instead.
 *
 * The dates are set flush right, against the gap rather than against the margin.
 * That gives the column the clean edge the design depends on: ranged left, the
 * ragged right-hand ends of "May 2019 — Present" and "January 2018 — November
 * 2024" would sit at different distances from the entries they label.
 *
 * `display: "flex"` is spelled out on every flex container because these same
 * objects are applied as CSS in the preview, where flex is not the default.
 *
 * Only "Noto Serif" is available in bold (see `fonts.ts`), so the serif is spent
 * on the display text that is bold anyway — the name and the section titles — and
 * everything set at a regular weight stays in "Noto Sans".
 */

const BODY_LINE_HEIGHT = 1.32;
const TIGHT_LINE_HEIGHT = 1.15;

export const INK = "rgb(2, 6, 27)";
/** The dates in the margin, and the sublines under a headline. */
export const MUTED = "rgb(96, 102, 112)";
/** Under the header and under each section title. */
const HAIRLINE_COLOR = "#d8d8d8";

export const SECTION_SPACING = pt(20);
/** The gap between entries, and between a summary's paragraphs. */
export const PARAGRAPH_SPACING = pt(14);

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
    padding: pt(38),
    backgroundColor: "#fff",
    fontFamily: SANS,
    fontSize: pt(13.5),
    lineHeight: BODY_LINE_HEIGHT,
    color: INK,
  },

  /* Header ---------------------------------------------------------------- */

  header: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    rowGap: pt(8),
    paddingBottom: pt(16),
    marginBottom: pt(20),
    borderBottomWidth: pt(1),
    borderBottomStyle: "solid",
    borderBottomColor: HAIRLINE_COLOR,
  },
  /*
   * The name and the job it wants, as one block.
   *
   * The gap is not decoration. At 30pt the serif's descenders reach past the line
   * box a 1.15 line-height draws, so the two lines set flush printed the wanted
   * job through the tail of the name's "y".
   */
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(6),
  },
  name: {
    fontFamily: SERIF,
    fontSize: pt(30),
    fontWeight: "bold",
    lineHeight: TIGHT_LINE_HEIGHT,
  },
  wantedJob: {
    fontFamily: SANS,
    fontSize: pt(14),
    color: MUTED,
  },
  contactRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: pt(7),
    rowGap: pt(4),
  },
  contactItem: {
    fontFamily: SANS,
    fontSize: pt(13),
  },
  contactSeparator: {
    fontFamily: SANS,
    fontSize: pt(13),
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
    rowGap: pt(10),
  },
  sectionTitle: {
    boxSizing: "border-box",
    fontFamily: SERIF,
    fontSize: pt(14),
    fontWeight: "bold",
    letterSpacing: pt(1),
    lineHeight: TIGHT_LINE_HEIGHT,
    textTransform: "uppercase",
    paddingBottom: pt(6),
    borderBottomWidth: pt(1),
    borderBottomStyle: "solid",
    borderBottomColor: HAIRLINE_COLOR,
  },

  /* The dated columns ------------------------------------------------------ */

  /** One entry: its date range on the left, everything else on the right. */
  datedRow: {
    display: "flex",
    flexDirection: "row",
    columnGap: DATE_COLUMN_GAP,
  },
  /*
   * Flush right, so the column has one clean edge facing the entries.
   *
   * `flexShrink: 0` matters: without it a long headline in the column beside it
   * squeezes this one narrower than its percentage, and the dates stop lining up
   * with each other down the page — which is the entire point of the layout.
   */
  dateColumn: {
    flexShrink: 0,
    width: DATE_COLUMN_WIDTH,
    fontFamily: SANS,
    fontSize: pt(12.5),
    textAlign: "right",
    color: MUTED,
  },
  entryColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    rowGap: pt(3),
  },

  /* Entries ---------------------------------------------------------------- */

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
  entryHeadline: {
    fontFamily: SANS,
    fontSize: pt(14.5),
    fontWeight: "bold",
  },
  entrySubline: {
    fontFamily: SANS,
    fontSize: pt(13),
    color: MUTED,
  },
  /** Projects have no date to hang in the margin, so their url rides the headline. */
  entryTopRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
    columnGap: pt(12),
  },
  entryHeadlineFlex: {
    flex: 1,
    fontFamily: SANS,
    fontSize: pt(14.5),
    fontWeight: "bold",
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
  /**
   * Opens a run in Projects, which has no date to hang in the gutter and so needs
   * a column rather than the row `entryHead` is.
   *
   * The margin is not optional. `splitEntryList` pulls the whole list up by one
   * PARAGRAPH_SPACING on the understanding that every block opening a run puts it
   * back; a head style without it leaves the negative uncancelled, and the section
   * rides up into the rule under its own heading. That is exactly what Projects
   * did while it borrowed `entry`, which has no margin because the lists that use
   * it space their children with `rowGap` instead.
   */
  projectHead: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(3),
    marginTop: PARAGRAPH_SPACING,
  },
  /** Opens a run. The margin is the gap `entryList` used to put between entries. */
  entryHead: {
    display: "flex",
    flexDirection: "row",
    columnGap: DATE_COLUMN_GAP,
    marginTop: PARAGRAPH_SPACING,
  },
  /**
   * Continues a run. It carries the same empty gutter as the head above it, so a
   * bullet that lands on the next page still starts at the entry column's edge
   * rather than sliding back under the dates.
   */
  entryBullet: {
    display: "flex",
    flexDirection: "row",
    columnGap: DATE_COLUMN_GAP,
    marginTop: pt(4),
  },
  /** The gutter's width with nothing in it, under a date that has already been said. */
  dateColumnSpacer: {
    flexShrink: 0,
    width: DATE_COLUMN_WIDTH,
  },

  /**
   * The same two columns for a section that has no dates at all, so that every
   * section's content starts on one edge. See `section.tsx` for why they do not
   * simply run the full measure.
   */
  insetRow: {
    display: "flex",
    flexDirection: "row",
    columnGap: DATE_COLUMN_GAP,
  },
  insetBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  /**
   * A bullet in a column of them — the Links list.
   *
   * Deliberately *not* the same style as the one below, though the two differ by a
   * single property. Shared, the `flex: 1` that a continuation bullet needs to
   * claim the rest of its row makes these siblings in a column divide the column's
   * height between them instead, and three links render stacked on top of one
   * another.
   */
  bulletRow: {
    display: "flex",
    flexDirection: "row",
  },
  /** A bullet that is the second cell of a row, beside the empty date gutter. */
  continuationBullet: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
  },
  bullet: {
    fontFamily: SANS,
    marginRight: pt(7),
  },
  bulletText: {
    flex: 1,
    fontFamily: SANS,
  },

  summary: {
    fontFamily: SANS,
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
