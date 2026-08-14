import { pathToFileURL } from "node:url";

import { expect, test, type Page } from "@playwright/test";

import { downloadHtml, downloadMenu, preview, selectTemplate } from "./helpers";
import { HALF_FILLED_PROJECTS, seedResume, type SeedResume } from "./seeds";

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

  /**
   * "A link to your work" reads the project urls too.
   *
   * It used to count the Links section alone, and skip itself entirely when that
   * section was hidden — so someone whose evidence was three linked GitHub
   * projects was told they had no links, which is both wrong and unfixable
   * without adding the URL a second time.
   */
  test.describe("the link check", () => {
    const hidingLinks = (url: string): SeedResume => ({
      ...HALF_FILLED_PROJECTS,
      projects: [{ ...HALF_FILLED_PROJECTS.projects[0], url }],
      visibility: { ...HALF_FILLED_PROJECTS.visibility, socialLinks: false },
    });

    /** The panel files each check under "To fix" or "Passing". */
    const group = (page: Page, heading: string) =>
      page.locator("section").filter({ has: page.getByRole("heading", { name: heading }) });

    const openScorePanel = async (page: Page) => {
      await page.getByRole("button", { name: "Resume score" }).click();
      await expect(page.getByRole("heading", { name: "Passing" })).toBeVisible();
    };

    test("passes on a project's url when the Links section is hidden", async ({ page }) => {
      await seedResume(page, hidingLinks("https://github.com/tideline"));
      await page.goto("/resume-editor");
      await openScorePanel(page);

      await expect(group(page, "Passing").getByText("A link to your work")).toBeVisible();
    });

    test("still asks for one when nothing on the page links anywhere", async ({ page }) => {
      await seedResume(page, hidingLinks(""));
      await page.goto("/resume-editor");
      await openScorePanel(page);

      await expect(group(page, "To fix").getByText("A link to your work")).toBeVisible();
    });
  });
});
