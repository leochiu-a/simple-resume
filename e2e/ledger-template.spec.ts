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
 * The Ledger template puts each section's title in a narrow left gutter with the
 * content in the wide column beside it. These tests drive the picker to it and
 * then check all three outputs — the preview, the standalone HTML and the PDF — so
 * a template that only half-works cannot pass.
 */

const selectLedger = (page: Page) => selectTemplate(page, "Ledger");

/** Every section the template renders, in the order it renders them. */
const SECTIONS = ["Summary", "Experience", "Projects", "Education", "Skills", "Links"];

test.describe("Ledger template", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("is offered by the picker", async ({ page }) => {
    await openAppearanceMenu(page);
    await expect(page.getByRole("button", { name: /^Ledger — / })).toBeVisible();
  });

  test("switches the preview to the label-gutter layout", async ({ page }) => {
    // Classic names the section "Employment History"; Ledger calls it Experience
    // and adds Summary, so the section names identify the template.
    await expect(preview(page).getByText("Employment History")).toBeVisible();

    await selectLedger(page);

    for (const heading of SECTIONS) {
      await expect(preview(page).getByText(heading, { exact: true })).toBeVisible();
    }
    await expect(preview(page).getByText("Employment History")).toBeHidden();
  });

  test("leaves out a contact detail that was never filled in", async ({ page }) => {
    await selectLedger(page);

    await expect(preview(page).getByText("0123456789", { exact: true })).toBeVisible();

    // By `name`, not by label: the form's labels are styled divs rather than
    // <label> elements, so there is nothing for `getByLabel` to resolve.
    await page.locator('input[name="phone"]').fill("");

    // The detail goes entirely: kept in, an empty phone number still claimed a
    // column gap, so the row advertised a hole rather than closing it.
    await expect(preview(page).getByText("0123456789", { exact: true })).toBeHidden();
    await expect(preview(page).getByText("Taipei", { exact: true })).toBeVisible();
    await expect(preview(page).getByText("good@gmail.com", { exact: true })).toBeVisible();
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
    await selectLedger(page);

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

    /*
     * And a run is genuinely split rather than shunted: no page is left with room
     * for another whole bullet.
     *
     * The bound is measured rather than a fixed number of pixels. The label gutter
     * narrows the text column, so a bullet here wraps to more lines than the same
     * text does in Formal — about 155px against 136px — and a literal threshold
     * copied from that template fails on a break that is actually correct. What
     * matters is not how many pixels are left but whether anything could have
     * filled them.
     *
     * And what a bullet costs is its height *plus* the gap it carries above it.
     * That term is what makes this exact rather than nearly right: the worst
     * trailing gap here is 158.1px against a 155.4px bullet, so comparing against
     * the height alone reports a defect on a page where a bullet genuinely does not
     * fit once its 4.3px of spacing is counted.
     */
    const bullets = layout.blocks.filter((block) => !block.isHead);
    const tallestBullet = Math.max(...bullets.map((block) => block.bottom - block.top));
    const spacingAboveBullet = bullets.length > 1 ? bullets[1].top - bullets[0].bottom : 0;

    expect(Math.max(...layout.trailingGaps)).toBeLessThan(tallestBullet + spacingAboveBullet);
  });

  test("exports a standalone HTML document", async ({ page }) => {
    await selectLedger(page);

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

    /*
     * The layout itself: every section title sits to the *left* of its content and
     * shares a top edge with it, which is the one thing that makes this template
     * not a restyled Formal. Checked on every section so a single stray
     * `grid-column` cannot pass.
     */
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll("section")].map((section) => {
        const title = section.querySelector("h2")!.getBoundingClientRect();
        const body = section.lastElementChild!.getBoundingClientRect();

        return {
          name: section.querySelector("h2")!.textContent,
          titleRight: title.right,
          bodyLeft: body.left,
          titleTop: title.top,
          bodyTop: body.top,
        };
      }),
    );

    expect(rows).toHaveLength(SECTIONS.length);
    for (const row of rows) {
      expect(row.titleRight).toBeLessThanOrEqual(row.bodyLeft);
      // Same row, not stacked: the two tops are within a line of each other.
      expect(Math.abs(row.titleTop - row.bodyTop)).toBeLessThan(20);
    }

    // The gutter is narrow — the content column takes the greater share.
    const columns = await page.evaluate(() => {
      const section = document.querySelector("section")!;
      return {
        title: section.querySelector("h2")!.getBoundingClientRect().width,
        body: section.lastElementChild!.getBoundingClientRect().width,
      };
    });
    expect(columns.body).toBeGreaterThan(columns.title * 2);

    // A role's dates are pushed out to the right margin, level with its title.
    const headline = await page.evaluate(() => {
      const row = document.querySelector(".entry .headline")!;
      const title = row.querySelector(".title")!.getBoundingClientRect();
      const date = row.querySelector(".date")!.getBoundingClientRect();
      return {
        titleRight: title.right,
        dateLeft: date.left,
        dateRight: date.right,
        rowRight: row.getBoundingClientRect().right,
      };
    });
    expect(headline.dateLeft).toBeGreaterThanOrEqual(headline.titleRight);
    expect(Math.abs(headline.dateRight - headline.rowRight)).toBeLessThan(2);

    // Skills run in two columns.
    const skillColumns = await page.evaluate(() => {
      const items = [...document.querySelectorAll(".skills li")];
      return new Set(items.map((item) => Math.round(item.getBoundingClientRect().left))).size;
    });
    expect(skillColumns).toBe(2);
  });

  test("collapses the gutter on a narrow screen", async ({ page }) => {
    await selectLedger(page);

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await downloadHtml(page);
    const download = await downloadPromise;

    const path = test.info().outputPath("resume-narrow.html");
    await download.saveAs(path);

    await page.setViewportSize({ width: 420, height: 900 });
    await page.goto(pathToFileURL(path).href);

    /* A 22% label column on a phone leaves too little for the text beside it, so
       the row stacks instead — the title above its content rather than beside it. */
    const row = await page.evaluate(() => {
      const section = document.querySelector("section")!;
      const title = section.querySelector("h2")!.getBoundingClientRect();
      const body = section.lastElementChild!.getBoundingClientRect();
      return { titleBottom: title.bottom, bodyTop: body.top };
    });
    expect(row.bodyTop).toBeGreaterThanOrEqual(row.titleBottom);
  });

  test("downloads a valid single-page PDF", async ({ page }) => {
    await selectLedger(page);

    await expect(downloadMenu(page)).toBeEnabled();

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await downloadPdf(page);
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("resume.pdf");

    const pdf = readPdfFacts((await download.path())!);

    expect(pdf.header).toBe("%PDF-1.3");
    expect(pdf.hasEof).toBe(true);
    expect(pdf.pages).toBe(1);

    // The name is serif; everything else is sans, so all three registered faces
    // are embedded.
    for (const family of ["NotoSans-Regular", "NotoSans-Bold", "NotoSerif-Bold"]) {
      expect(pdf.embeddedFonts.some((f) => f.endsWith(family))).toBe(true);
    }

    // Github / Medium / Threads stay clickable in the Links section, and the
    // project's url is clickable where it sits in the date column.
    expect(pdf.linkAnnotations).toBe(4);
    expect(pdf.linkTargets).toContain("https://github.com/open-resume");
  });
});
