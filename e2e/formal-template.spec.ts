import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";

import {
  downloadHtml,
  downloadMenu,
  downloadPdf,
  openAppearanceMenu,
  preview,
  readPdfFacts,
  selectTemplate,
} from "./helpers";

/**
 * The Formal template is a single column under a centred serif header. These
 * tests drive the picker to it and then check all three outputs — the preview,
 * the standalone HTML and the PDF — so a template that only half-works cannot
 * pass.
 */

/* The picker is the appearance panel over the preview now, and its contents are
   buttons rather than menu items. Both facts live in `selectTemplate` in
   ./helpers — this used to keep its own copy, which is why it broke when the
   panel moved. */
const selectFormal = (page: Page) => selectTemplate(page, "Formal");

/** Every section the template renders, in the order it renders them. */
const SECTIONS = ["Summary", "Experience", "Education", "Skills", "Links"];

test.describe("Formal template", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("is offered by the picker", async ({ page }) => {
    await openAppearanceMenu(page);
    await expect(page.getByRole("button", { name: /^Formal — / })).toBeVisible();
  });

  test("switches the preview to the single-column layout", async ({ page }) => {
    // Classic names the section "Employment History"; Formal calls it Experience
    // and adds Summary, so the section names identify the template.
    await expect(preview(page).getByText("Employment History")).toBeVisible();

    await selectFormal(page);

    for (const heading of SECTIONS) {
      await expect(preview(page).getByText(heading, { exact: true })).toBeVisible();
    }
    await expect(preview(page).getByText("Employment History")).toBeHidden();

    // The header leads with the contact labels the reference spells out.
    for (const label of ["Address:", "Email address:", "Phone number:"]) {
      await expect(preview(page).getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("exports a standalone HTML document", async ({ page }) => {
    await selectFormal(page);

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await downloadHtml(page);
    const download = await downloadPromise;

    const path = test.info().outputPath("resume.html");
    await download.saveAs(path);

    const html = readFileSync(path, "utf8");
    expect(html).not.toContain("<script");

    await page.goto(pathToFileURL(path).href);

    await expect(page.getByRole("heading", { level: 1, name: "My Name" })).toBeVisible();
    for (const heading of SECTIONS) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }

    await expect(page.getByRole("link", { name: "Github", exact: true })).toHaveAttribute(
      "href",
      "https://github.com",
    );

    // One column: the header sits above the body rather than beside it, and the
    // name is centred within the sheet.
    const layout = await page.evaluate(() => {
      const header = document.querySelector(".header")!.getBoundingClientRect();
      const body = document.querySelector(".body")!.getBoundingClientRect();
      const page = document.querySelector(".page")!.getBoundingClientRect();
      const name = document.querySelector(".name")!.getBoundingClientRect();

      return {
        headerBottom: header.bottom,
        bodyTop: body.top,
        pageCentre: page.left + page.width / 2,
        nameCentre: name.left + name.width / 2,
      };
    });
    expect(layout.bodyTop).toBeGreaterThanOrEqual(layout.headerBottom);
    expect(Math.abs(layout.nameCentre - layout.pageCentre)).toBeLessThan(2);

    // The job title is announced above the name, as the reference orders them.
    const order = await page.evaluate(() => {
      const jobTitle = document.querySelector(".job-title")!.getBoundingClientRect().top;
      const name = document.querySelector(".name")!.getBoundingClientRect().top;
      return { jobTitle, name };
    });
    expect(order.jobTitle).toBeLessThan(order.name);

    // Skills run in two columns.
    const skillColumns = await page.evaluate(() => {
      const items = [...document.querySelectorAll(".skills li")];
      return new Set(items.map((item) => Math.round(item.getBoundingClientRect().left))).size;
    });
    expect(skillColumns).toBe(2);
  });

  test("downloads a valid single-page PDF", async ({ page }) => {
    await selectFormal(page);

    await expect(downloadMenu(page)).toBeEnabled();

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await downloadPdf(page);
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("resume.pdf");

    const pdf = readPdfFacts((await download.path())!);

    expect(pdf.header).toBe("%PDF-1.3");
    expect(pdf.hasEof).toBe(true);
    expect(pdf.pages).toBe(1);

    // The name and the section titles are serif; everything else is sans, so all
    // three registered faces are embedded.
    for (const family of ["NotoSans-Regular", "NotoSans-Bold", "NotoSerif-Bold"]) {
      expect(pdf.embeddedFonts.some((f) => f.endsWith(family))).toBe(true);
    }

    // Github / Medium / Threads stay clickable in the Links section.
    expect(pdf.linkAnnotations).toBe(3);
  });
});
