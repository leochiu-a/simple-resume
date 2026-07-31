import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { downloadHtml } from "./helpers";

/**
 * The HTML export is built from the resume object in the browser and handed to
 * the user as a Blob, so these tests read the downloaded file back and — for
 * the layout assertions — open it as a standalone document, exactly as a
 * recipient would.
 */
const exportHtml = async (page: Page) => {
  const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
  await downloadHtml(page);
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("resume.html");

  // Playwright's temp download has no extension, and Chromium will not render a
  // file:// URL as HTML without one, so keep the suggested filename.
  const path = test.info().outputPath("resume.html");
  await download.saveAs(path);

  return { html: readFileSync(path, "utf8"), path };
};

test.describe("HTML export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("downloads a self-contained document", async ({ page }) => {
    const { html } = await exportHtml(page);

    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("<title>My Name — Senior job</title>");
    // Everything but the Google Fonts stylesheet has to be inlined, and no
    // scripts may ride along.
    expect(html).not.toContain("<script");
    const hosts = new Set([...html.matchAll(/https?:\/\/([^/"' ]+)/g)].map((m) => m[1]));
    expect([...hosts].sort()).toEqual([
      "fonts.googleapis.com",
      "fonts.gstatic.com",
      "github.com",
      "medium.com",
      "threads.net",
    ]);
  });

  test("renders the whole resume when opened on its own", async ({ page }) => {
    const { path } = await exportHtml(page);

    await page.goto(pathToFileURL(path).href);

    await expect(page.getByRole("heading", { level: 1, name: "My Name" })).toBeVisible();
    await expect(page.getByText("Senior job")).toBeVisible();
    await expect(page.getByText("Taipei")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Employment History" })).toBeVisible();
    await expect(page.getByText("Senior Engineer, Google")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();
    await expect(
      page.getByText("Bachelor of Computer Science, University of California").first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Github" })).toHaveAttribute(
      "href",
      "https://github.com",
    );

    // The picked sidebar colour is baked into the stylesheet.
    const sidebarColor = await page
      .locator(".sidebar")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(sidebarColor).toBe("rgb(9, 76, 66)");
  });

  test("exports the current form state, including hidden sections", async ({ page }) => {
    await page.getByRole("textbox").nth(1).fill("Ada Lovelace");
    await page.getByRole("heading", { name: "Skills" }).getByRole("button").click();

    const { html } = await exportHtml(page);

    expect(html).toContain("Ada Lovelace");
    expect(html).not.toContain("My Name");
    // Skills is hidden, so neither the heading nor its entries are exported.
    expect(html).not.toContain("<h2>Skills</h2>");
    expect(html).not.toContain("TypeScript");
  });

  test("escapes resume content instead of emitting markup", async ({ page }) => {
    await page.getByRole("textbox").nth(1).fill("<img src=x onerror=alert(1)>");

    const { html } = await exportHtml(page);

    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});
