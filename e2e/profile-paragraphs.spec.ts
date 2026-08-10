import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

import { downloadHtml, downloadPdf, preview, readPdfPageText, selectTemplate } from "./helpers";

/**
 * The profile is the one free-text field, and the paragraphs typed into it were
 * being thrown away on the way to the screen. Each template passed the raw
 * string to a single `Text`: the preview draws that tree as HTML, where
 * `white-space` is `normal` and a newline collapses to a space, and the HTML
 * export wrapped the lot in one `<p>`. Typed paragraphs came out as one
 * unbroken block in both.
 *
 * The PDF was the exception — @react-pdf breaks a `Text` on a literal newline
 * of its own accord, so it always honoured them. Its tests here therefore
 * guard against a regression rather than record a fix: the profile now renders
 * through a shared `Summary` component, and these hold it to what the PDF
 * already did.
 *
 * A blank line starts a new paragraph and a single newline is a line break, so
 * both have to survive into all three outputs.
 */

const TEMPLATES = ["Classic", "Modern", "Formal", "Timeline"];

/** Three paragraphs, the last carrying a single newline inside it. */
const PARAGRAPHS = [
  "Alpha paragraph, the first one.",
  "Beta paragraph, after a blank line.",
  "Gamma paragraph.\nDelta line, after a single newline.",
].join("\n\n");

/** The same words with no breaks at all, as the baseline to measure against. */
const ONE_RUN =
  "Alpha paragraph, the first one. Beta paragraph, after a blank line. Gamma paragraph. Delta line, after a single newline.";

const fillProfile = async (page: import("@playwright/test").Page, text: string) => {
  await page.goto("/resume-editor");
  await page.locator('textarea[name="profile"]').fill(text);
};

test.describe("profile paragraphs", () => {
  for (const template of TEMPLATES) {
    test(`${template} shows them as separate blocks in the preview`, async ({ page }) => {
      await fillProfile(page, PARAGRAPHS);
      await selectTemplate(page, template);

      const blocks = preview(page)
        .locator("[data-resume-page] > div")
        .first()
        .locator("text")
        .filter({ hasText: /paragraph|line,/i });

      // One element per line the writer typed — three paragraphs, the last of
      // which holds two — rather than one element holding all of it. The split
      // goes down to the line because that is the grain the preview's paginator
      // breaks on; see `summary.tsx`.
      await expect(blocks).toHaveCount(4);

      // The newline inside the third paragraph is a real break, so the line after
      // it starts below the line before it rather than beside it.
      const [gamma, delta] = await blocks.evaluateAll((elements) =>
        elements.slice(-2).map((element) => element.getBoundingClientRect()),
      );
      expect(delta.top).toBeGreaterThanOrEqual(gamma.bottom - 1);
    });

    test(`${template} keeps them in the exported PDF`, async ({ page }) => {
      const runsFor = async (text: string) => {
        await fillProfile(page, text);
        await selectTemplate(page, template);

        const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
        await downloadPdf(page);
        return readPdfPageText((await (await downloadPromise).path())!)[0].runs;
      };

      /*
       * Breaking the same words across three paragraphs and one newline has to
       * draw them on strictly more lines than one unbroken run does.
       *
       * Not an exact count: how many extra depends on where each paragraph
       * happens to wrap, which differs per template, and pinning the number
       * would make this a test of the font metrics rather than of the breaks.
       * Collapsed newlines would make the two identical, which is the failure
       * this has to catch.
       */
      expect(await runsFor(PARAGRAPHS)).toBeGreaterThan(await runsFor(ONE_RUN));
    });

    test(`${template} keeps them in the exported HTML`, async ({ page }) => {
      await fillProfile(page, PARAGRAPHS);
      await selectTemplate(page, template);

      const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
      // Via the helper rather than a `/download/i` regex of its own: the export
      // menu's trigger is named there and nowhere else, so a rename cannot leave
      // this file behind again.
      await downloadHtml(page);
      const html = readFileSync((await (await downloadPromise).path())!, "utf8");

      // A paragraph each, and `pre-line` so the newline inside the third holds.
      expect((html.match(/white-space: pre-line/g) ?? []).length).toBe(3);
      expect(html).not.toContain("Alpha paragraph, the first one.\n\nBeta");
    });
  }
});
