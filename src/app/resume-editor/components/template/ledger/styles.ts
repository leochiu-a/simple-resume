import { StyleSheet } from "@react-pdf/renderer";

import { SANS, SERIF } from "../fonts";
import { LABEL_COLUMN_WIDTH, PAGE_MIN_HEIGHT, pt } from "./units";

/**
 * A sheet ruled like a ledger: every section is a row whose title sits in a
 * narrow left gutter, with the content in the wide column beside it. Nothing is
 * tinted but the rule under the header and the section titles themselves.
 *
 * This is what makes it a different layout rather than a restyled Formal. The
 * Modern template also has two columns, but it splits the *content* between them
 * — skills on one side, experience on the other. Here the split is between the
 * label and the content, so every section still reads top to bottom in one order.
 * That keeps it linear for a parser while looking like a designed sheet.
 *
 * `display: "flex"` is spelled out on every flex container because these same
 * objects are applied as CSS in the preview, where flex is not the default.
 *
 * Only "Noto Serif" is available in bold (see `fonts.ts`), so the serif is spent
 * on the display text that is bold anyway — the name — and everything else stays
 * in "Noto Sans".
 */

const BODY_LINE_HEIGHT = 1.35;
const LABEL_LINE_HEIGHT = 1.15;

/** The ink the whole sheet is set in; the rule and the titles take the colour. */
export const INK = "rgb(2, 6, 27)";
/** Sublines and dates, which sit back from the text they annotate. */
const MUTED = "#5b6070";

export const SECTION_SPACING = pt(22);
/** The gap between entries, and between a summary's paragraphs. */
export const PARAGRAPH_SPACING = pt(16);

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
    padding: pt(44),
    backgroundColor: "#fff",
    fontFamily: SANS,
    fontSize: pt(13.5),
    lineHeight: BODY_LINE_HEIGHT,
    color: INK,
  },

  /* Header ---------------------------------------------------------------- */

  /*
   * The header is the one row that ignores the gutter: the name spans the full
   * width so the sheet opens on it, and the rule beneath sets the colour before
   * any section does.
   */
  header: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(10),
    paddingBottom: pt(16),
    marginBottom: SECTION_SPACING,
    borderBottomWidth: pt(2.5),
    borderBottomStyle: "solid",
  },
  name: {
    fontFamily: SERIF,
    fontSize: pt(34),
    fontWeight: "bold",
    lineHeight: LABEL_LINE_HEIGHT,
  },
  wantedJob: {
    fontFamily: SANS,
    fontSize: pt(15),
    letterSpacing: pt(1.2),
    textTransform: "uppercase",
    color: MUTED,
  },

  /*
   * The contact details sit on one wrapping row under the name. There is no
   * separator character between them — the column gap alone does that work, which
   * saves the `::after` dance the Formal header needs.
   */
  contactRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: pt(14),
    rowGap: pt(4),
    marginTop: pt(2),
  },
  contactItem: {
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

  /*
   * A section is a row, not a column: the title in the gutter and the content
   * beside it. `alignItems: "flex-start"` keeps the title at the top of the row
   * rather than centred against a tall block of entries.
   */
  section: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sectionTitle: {
    flexShrink: 0,
    width: LABEL_COLUMN_WIDTH,
    paddingRight: pt(12),
    fontFamily: SANS,
    fontSize: pt(12),
    fontWeight: "bold",
    letterSpacing: pt(0.8),
    lineHeight: LABEL_LINE_HEIGHT,
    textTransform: "uppercase",
  },
  /*
   * The content column. `flex: 1` rather than a width, so it takes whatever the
   * gutter leaves — the two have to add up to the row exactly or the text wraps
   * short of the margin.
   */
  sectionBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
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
   * An entry's headline is itself a row: the title on the left and the dates
   * pushed to the right margin, which is what gives the column its ledger feel.
   */
  entryHeadline: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    columnGap: pt(12),
  },
  entryTitle: {
    flex: 1,
    fontFamily: SANS,
    fontSize: pt(14.5),
    fontWeight: "bold",
  },
  /** Dates are set back and never wrap, so the right edge stays a straight line. */
  entryDate: {
    flexShrink: 0,
    fontFamily: SANS,
    fontSize: pt(12),
    color: MUTED,
  },
  entrySubline: {
    fontFamily: SANS,
    fontSize: pt(13),
    color: MUTED,
  },

  description: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(4),
    marginTop: pt(5),
  },
  descriptionRow: {
    display: "flex",
    flexDirection: "row",
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
       which should sit flush against the section's title. Pulling the list up by
       that margin leaves the first entry where it was and every later one
       spaced. */
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
  skillItem: {
    display: "flex",
    flexDirection: "row",
    width: "50%",
    paddingRight: pt(10),
  },

  bulletList: {
    display: "flex",
    flexDirection: "column",
    rowGap: pt(5),
  },
  bulletRow: {
    display: "flex",
    flexDirection: "row",
  },
  bullet: {
    fontFamily: SANS,
    marginRight: pt(7),
    color: MUTED,
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
