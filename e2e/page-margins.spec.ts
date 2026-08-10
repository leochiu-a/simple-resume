import { expect, test, type Page } from "@playwright/test";

import { downloadPdf, preview, readPdfPageText, selectTemplate } from "./helpers";
import { LONG_SEEDS, seedResume, UNBROKEN } from "./seeds";

/**
 * Every page keeps a margin at its top and bottom, on page two as much as on page
 * one.
 *
 * It used to only be true of page one. @react-pdf re-applies a `Page`'s padding to
 * each page the content spills onto, so a template that kept its margin on an
 * inner column got one indent and no more — the PDF's second page opened with its
 * first line against the trim. The preview had the same hole for a different
 * reason: it is one continuous run of content behind an A4 window, where that same
 * CSS padding can only ever indent the first page and the last.
 *
 * Both renderings are checked, against the same seeds, because they are two
 * renderings of one document and a fix in either alone is half a fix.
 */

const TEMPLATES = ["Classic", "Modern", "Formal", "Timeline"];

const A4_HEIGHT_PX = (842 * 4) / 3;

/**
 * Browsers round layout to 1/64px, and a range's client rects hug the glyphs
 * rather than the line box around them — so a line placed exactly on the margin
 * measures a pixel or two either side of it.
 */
const SLACK_PX = 3;

/**
 * How far the PDF's text must stay from the trim, in points.
 *
 * Comfortably under every template's own page padding — the smallest is Modern's
 * 20pt — and comfortably over what the bug left behind, which was 6pt to 15pt.
 * Pinning each template's exact margin would only restate its stylesheet.
 */
const MIN_PDF_GAP_PT = 20;

/**
 * The margin the sheet itself declares, in preview pixels. Read from the page
 * rather than hardcoded: each template sets its own, and the preview's breaks are
 * meant to follow whatever it says.
 */
const declaredMargin = (page: Page) =>
  preview(page)
    .locator("page")
    .first()
    .evaluate((sheet) => {
      const style = getComputedStyle(sheet);
      return {
        top: Number.parseFloat(style.paddingTop),
        bottom: Number.parseFloat(style.paddingBottom),
      };
    });

/** Every line of text on the sheet, measured from the top of the whole run. */
const textLines = (page: Page) =>
  preview(page)
    .locator("[data-resume-page] > div")
    .first()
    .evaluate((content) => {
      const sheetTop = content.getBoundingClientRect().top;
      const leaves = Array.from(content.querySelectorAll("text")).filter(
        (el) => !el.querySelector("text"),
      );

      return leaves.flatMap((el) => {
        const range = el.ownerDocument.createRange();
        range.selectNodeContents(el);
        return Array.from(range.getClientRects()).map((rect) => ({
          top: rect.top - sheetTop,
          bottom: rect.bottom - sheetTop,
          text: el.textContent?.slice(0, 40),
        }));
      });
    });

test.describe("page margins", () => {
  for (const template of TEMPLATES) {
    for (const [name, resume] of Object.entries(LONG_SEEDS)) {
      test(`${template} keeps the preview's text off the trim — ${name}`, async ({ page }) => {
        await seedResume(page, resume);
        await page.goto("/resume-editor");
        await selectTemplate(page, template);

        const margin = await declaredMargin(page);
        expect(margin.top).toBeGreaterThan(0);
        expect(margin.bottom).toBeGreaterThan(0);

        const lines = await textLines(page);

        // The seeds are sized to spill. A sheet that came out one page long would
        // pass everything below without a page break to get wrong.
        expect(Math.max(...lines.map((line) => line.bottom))).toBeGreaterThan(A4_HEIGHT_PX);

        const intruding = lines.filter((line) => {
          const index = Math.floor(line.top / A4_HEIGHT_PX);

          return (
            // Into the top margin of a page it was moved onto. The first page is
            // exempt: nothing was moved onto it, so what sits where up there is
            // the template's own layout rather than a break.
            (index > 0 && line.top < index * A4_HEIGHT_PX + margin.top - SLACK_PX) ||
            // Or past the point where its page stops allowing text.
            line.bottom > (index + 1) * A4_HEIGHT_PX - margin.bottom + SLACK_PX
          );
        });

        expect(intruding).toEqual([]);
      });
    }

    test(`${template} keeps the PDF's text off the trim on every page`, async ({ page }) => {
      // The seed the preview cannot place — one paragraph taller than a page — is
      // still the PDF's job to get right, so it is the one the PDF is held to.
      await seedResume(page, UNBROKEN);
      await page.goto("/resume-editor");
      await selectTemplate(page, template);

      const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
      await downloadPdf(page);
      const sheets = readPdfPageText((await (await downloadPromise).path())!);

      expect(sheets.length).toBeGreaterThan(1);

      const jammed = sheets
        .map((sheet, index) => ({ page: index + 1, ...sheet }))
        .filter((sheet) => sheet.topGap < MIN_PDF_GAP_PT || sheet.bottomGap < MIN_PDF_GAP_PT);

      expect(jammed).toEqual([]);
    });
  }
});
