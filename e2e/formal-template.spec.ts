import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";

import {
  downloadHtml,
  downloadMenu,
  downloadPdf,
  entryBlockLayout,
  openAppearanceMenu,
  preview,
  readPdfFacts,
  selectTemplate,
} from "./helpers";
import { LONG_DESCRIPTIONS, seedResume } from "./seeds";

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

  test("leaves out a contact detail that was never filled in", async ({ page }) => {
    await selectFormal(page);

    await expect(preview(page).getByText("Phone number:", { exact: true })).toBeVisible();

    // By `name`, not by label: the form's labels are styled divs rather than
    // <label> elements, so there is nothing for `getByLabel` to resolve.
    await page.locator('input[name="phone"]').fill("");

    // The label goes with the value: kept in, an empty phone number printed as a
    // bare "Phone number:" trailed by a separator dot.
    await expect(preview(page).getByText("Phone number:", { exact: true })).toBeHidden();
    await expect(preview(page).getByText("Address:", { exact: true })).toBeVisible();
    await expect(preview(page).getByText("Email address:", { exact: true })).toBeVisible();
  });

  /**
   * A long role used to be one unbreakable block, so an entry that did not fit in
   * what was left of a page moved onto the next one whole — on a ten-bullet job
   * that left most of a page empty behind it.
   *
   * What has to hold instead is narrower: a headline may not be the last thing on
   * its page, and no single bullet may be split. The page break belongs *between*
   * two bullets, and the space before it should be used.
   */
  test("breaks a long role between its bullets, not before its headline", async ({ page }) => {
    await seedResume(page, LONG_DESCRIPTIONS);
    await page.goto("/resume-editor");
    await selectFormal(page);

    const layout = await entryBlockLayout(page, /Staff Frontend Engineer/);

    // The seed is three long roles, so it has to spill.
    expect(Math.max(...layout.blocks.map((b) => b.page))).toBeGreaterThan(0);

    const heads = layout.blocks.filter((b) => b.isHead);
    expect(heads).toHaveLength(3);

    /* Each headline shares its unbreakable block with the company line and the
       first bullet, which is what makes it impossible to strand: the block moves
       as one, so wherever the headline goes that bullet goes too. The title and
       its date are two runs, the company a third, the bullet's disc and text the
       fourth and fifth. */
    for (const head of heads) {
      expect(head.runsInside).toBeGreaterThanOrEqual(5);
    }

    // And the bullets after it are separate blocks, so a run spans pages rather
    // than moving whole.
    const spanning = heads.filter((head) =>
      layout.blocks.some((b) => !b.isHead && b.page > head.page && b.top > head.top),
    );
    expect(spanning.length).toBeGreaterThan(0);

    // And a run is genuinely split rather than shunted: at least one page ends
    // close to its limit instead of a long way short of it.
    expect(Math.min(...layout.trailingGaps)).toBeLessThan(120);
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
