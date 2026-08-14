import { pathToFileURL } from "node:url";

import { expect, test } from "@playwright/test";

import { downloadHtml, downloadMenu, preview, selectTemplate } from "./helpers";
import { HALF_FILLED_PROJECTS, seedResume } from "./seeds";

/**
 * A project entry nobody has filled in yet is left out of every rendering.
 *
 * Adding a project appends a blank entry, and the exports disagreed about what to
 * do with it: the HTML dropped it, the PDF and the preview printed its empty
 * headline as a gap under the section title. One resume rendered two ways is one
 * bug, not a matter of taste, so both are held to the HTML's answer here.
 */
const TEMPLATES = ["Classic", "Modern", "Formal", "Timeline", "Ledger"];

test.describe("projects", () => {
  for (const template of TEMPLATES) {
    test(`${template} leaves out a project that was added but never filled in`, async ({
      page,
    }) => {
      await seedResume(page, HALF_FILLED_PROJECTS);
      await page.goto("/resume-editor");
      await selectTemplate(page, template);

      const sheet = preview(page).locator("[data-resume-page] > div").first();

      // The finished one is there to prove the section rendered at all — an
      // assertion about what is absent is worth nothing if nothing was drawn.
      // Exact: the url under the name contains it too, and both are on the sheet.
      await expect(sheet.getByText("Tideline", { exact: true })).toBeVisible();

      /* Every entry is wrapped in an avoid-break block, and the blank project is
         the only one in these seeds carrying no words. Counting contentless
         blocks is therefore how the stray entry shows up, and it stays true
         whichever template placed it — a blank entry draws nothing to search for.

         The bullet glyph is stripped before the check because the templates
         disagree about the shape of the stray: Formal and Ledger drop the empty
         bullet and leave a bare gap, while Classic renders the • with nothing
         beside it. Both are the same missing entry. */
      const contentless = await sheet.evaluate(
        (content) =>
          [...content.querySelectorAll("[data-avoid-break]")].filter(
            (el) => (el.textContent ?? "").replace(/[•\s]/g, "") === "",
          ).length,
      );

      expect(contentless).toBe(0);
    });
  }

  test("the HTML export agrees, and keeps the project's link", async ({ page }) => {
    await seedResume(page, HALF_FILLED_PROJECTS);
    await page.goto("/resume-editor");

    await expect(downloadMenu(page)).toBeEnabled();

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await downloadHtml(page);
    const download = await downloadPromise;

    const path = test.info().outputPath("resume.html");
    await download.saveAs(path);

    await page.goto(pathToFileURL(path).href);

    await expect(page.getByRole("link", { name: "https://github.com/tideline" })).toHaveAttribute(
      "href",
      "https://github.com/tideline",
    );

    // One project in the section, not two: the blank entry gets no article.
    const projects = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: "Projects",
        exact: true,
      }),
    });
    await expect(projects.locator("article")).toHaveCount(1);
  });
});
