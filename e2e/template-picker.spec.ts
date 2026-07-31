import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";

import {
  downloadHtml,
  downloadMenu,
  downloadPdf,
  openColorPicker,
  preview,
  readPdfFacts,
} from "./helpers";

/**
 * The editor ships two templates and renders whichever is selected to all three
 * outputs — the preview, the PDF and the standalone HTML. These tests drive the
 * picker and then check each output, so a template that only half-works cannot
 * pass.
 */

const templatePicker = (page: Page) => page.getByRole("button", { name: "Change template" });

const selectTemplate = async (page: Page, label: string) => {
  await templatePicker(page).click();
  await page.getByRole("menuitem").filter({ hasText: label }).click();
  await expect(templatePicker(page)).toContainText(label);
};

test.describe("template picker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  // Kept in the order they appear in the registry's TEMPLATES. Adding a template
  // means adding it here too — the assertion below is exact so a new one cannot
  // slip in unnoticed.
  const EXPECTED_TEMPLATES = [/Classic/, /Modern/, /Formal/, /Timeline/];

  test("starts on Classic and offers every registered template", async ({ page }) => {
    await expect(templatePicker(page)).toContainText("Classic");

    await templatePicker(page).click();
    // The same menu carries the colour controls, so the template entries are the
    // ones that are not the custom-colour escape hatch. Still an exact match, so a
    // new template cannot slip in unnoticed.
    await expect(page.getByRole("menuitem").filter({ hasNotText: "Custom colour" })).toHaveText(
      EXPECTED_TEMPLATES,
    );
  });

  test("switches the preview to the Modern layout", async ({ page }) => {
    // The Classic sidebar heading is "Details"; Modern adds a summary heading and
    // renames employment history, so the section names identify the template.
    await expect(preview(page).getByText("Employment History")).toBeVisible();

    await selectTemplate(page, "Modern");

    for (const heading of ["Details", "Links", "Skills", "Summary", "Experience", "Education"]) {
      await expect(preview(page).getByText(heading, { exact: true })).toBeVisible();
    }
    await expect(preview(page).getByText("Employment History")).toBeHidden();
  });

  test("resets the colour to the template's own default", async ({ page }) => {
    // The page itself is white, so the tinted panel is the second background in
    // the preview — the same handle the colour-picker test uses.
    const sidebarColor = () =>
      preview(page)
        .locator('[style*="background-color"]')
        .nth(1)
        .evaluate((el) => getComputedStyle(el).backgroundColor);

    // Classic tints a full-height sidebar dark green.
    await expect.poll(sidebarColor).toBe("rgb(9, 76, 66)");

    await selectTemplate(page, "Modern");

    // Modern tints a light contact panel, so it starts from its own neutral.
    await expect.poll(sidebarColor).toBe("rgb(242, 242, 242)");
  });

  test("exports the Modern template as a standalone document", async ({ page }) => {
    await selectTemplate(page, "Modern");

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await downloadHtml(page);
    const download = await downloadPromise;

    const path = test.info().outputPath("resume.html");
    await download.saveAs(path);

    const html = readFileSync(path, "utf8");
    expect(html).not.toContain("<script");

    await page.goto(pathToFileURL(path).href);

    await expect(page.getByRole("heading", { level: 1, name: "My Name" })).toBeVisible();
    for (const heading of ["Details", "Links", "Skills", "Summary", "Experience", "Education"]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Github" })).toHaveAttribute(
      "href",
      "https://github.com",
    );

    // The two columns sit side by side, with the sidebar the narrower of the two.
    const widths = await page.evaluate(() => ({
      sidebar: document.querySelector(".sidebar")!.getBoundingClientRect().width,
      content: document.querySelector(".content")!.getBoundingClientRect().width,
    }));
    expect(widths.sidebar).toBeGreaterThan(0);
    expect(widths.content).toBeGreaterThan(widths.sidebar);
  });

  test("downloads a valid PDF of the Modern template", async ({ page }) => {
    await selectTemplate(page, "Modern");

    await expect(downloadMenu(page)).toBeEnabled();

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await downloadPdf(page);
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("resume.pdf");

    const pdf = readPdfFacts((await download.path())!);

    expect(pdf.header).toBe("%PDF-1.3");
    expect(pdf.hasEof).toBe(true);
    expect(pdf.pages).toBe(1);
    // Modern is sans-only, so just the two Noto Sans weights are embedded.
    expect(pdf.embeddedFonts).toHaveLength(2);
    for (const family of ["NotoSans-Regular", "NotoSans-Bold"]) {
      expect(pdf.embeddedFonts.some((f) => f.endsWith(family))).toBe(true);
    }
    // Github / Medium / Threads stay clickable in the sidebar.
    expect(pdf.linkAnnotations).toBe(3);
  });

  test("leaves the colour picker working after a template change", async ({ page }) => {
    await selectTemplate(page, "Modern");

    await openColorPicker(page);
    await expect(page.locator(".w-color-sketch")).toBeVisible();
  });
});
