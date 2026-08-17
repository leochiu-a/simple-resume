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
 * The Compact template fits more on the page than any other: one dense column, the
 * job title sharing a line with its company, the section rule sharing a line with
 * its heading, and the skills run together rather than listed. These tests drive
 * the picker to it and then check all three outputs — the preview, the standalone
 * HTML and the PDF — so a template that only half-works cannot pass.
 */

const selectCompact = (page: Page) => selectTemplate(page, "Compact");

/** Every section the template renders, in the order it renders them. */
const SECTIONS = ["Summary", "Experience", "Projects", "Education", "Skills", "Links"];

/** How far down the sheet the last run of text reaches, in preview pixels. */
const contentHeight = (page: Page) =>
  preview(page)
    .locator("[data-resume-page] > div")
    .first()
    .evaluate((content) => {
      const top = content.getBoundingClientRect().top;
      const runs = [...content.querySelectorAll("text")].filter((el) => !el.querySelector("text"));

      return Math.max(...runs.map((el) => el.getBoundingClientRect().bottom - top));
    });

test.describe("Compact template", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("is offered by the picker", async ({ page }) => {
    await openAppearanceMenu(page);
    await expect(page.getByRole("button", { name: /^Compact — / })).toBeVisible();
  });

  test("switches the preview to the dense single column", async ({ page }) => {
    // Classic names the section "Employment History"; Compact calls it Experience
    // and adds Summary, so the section names identify the template.
    await expect(preview(page).getByText("Employment History")).toBeVisible();

    await selectCompact(page);

    for (const heading of SECTIONS) {
      await expect(preview(page).getByText(heading, { exact: true })).toBeVisible();
    }
    await expect(preview(page).getByText("Employment History")).toBeHidden();
  });

  /**
   * The claim in the name, measured rather than asserted in a comment.
   *
   * Formal is the template to compare against because it is the other single
   * column one — the difference is density alone, not a sidebar's worth of
   * reclaimed width. The same resume has to come out meaningfully shorter here or
   * this template has no reason to exist.
   */
  test("fits the same resume into less of the page than Formal", async ({ page }) => {
    await selectTemplate(page, "Formal");
    const formal = await contentHeight(page);

    await selectCompact(page);
    const compact = await contentHeight(page);

    expect(compact).toBeLessThan(formal * 0.8);
  });

  /**
   * The section rule runs from the end of the heading out to the right margin,
   * sharing its line — which is what makes this not Modern's
   * heading-over-a-hairline at a smaller size, and is a line saved per section.
   */
  test("runs each section's rule along the heading's own line", async ({ page }) => {
    await selectCompact(page);

    const headings = await preview(page)
      .locator("page")
      .first()
      .evaluate((sheet) => {
        const titles = ["Summary", "Experience", "Projects", "Education", "Skills", "Links"];

        return titles.map((title) => {
          const run = [...sheet.querySelectorAll<HTMLElement>("text")].find(
            (el) => el.textContent?.trim() === title,
          )!;
          // The rule is the heading row's second child — a view with no text in it.
          const rule = run.parentElement!.querySelector<HTMLElement>("view")!;

          const runBox = run.getBoundingClientRect();
          const ruleBox = rule.getBoundingClientRect();
          const sheetBox = sheet.getBoundingClientRect();
          const padding = Number.parseFloat(getComputedStyle(sheet).paddingRight);

          return {
            title,
            startsAfterTitle: ruleBox.left >= runBox.right,
            // Vertically centred on the heading rather than sitting under it.
            sharesTheLine: Math.abs(
              (ruleBox.top + ruleBox.bottom) / 2 - (runBox.top + runBox.bottom) / 2,
            ),
            reachesMargin: Math.abs(sheetBox.right - padding - ruleBox.right),
            width: ruleBox.width,
          };
        });
      });

    expect(headings).toHaveLength(SECTIONS.length);
    for (const heading of headings) {
      expect(heading.startsAfterTitle).toBe(true);
      expect(heading.sharesTheLine).toBeLessThan(6);
      expect(heading.reachesMargin).toBeLessThan(1);
      expect(heading.width).toBeGreaterThan(50);
    }
  });

  /** Six skills as one wrapping run, not two bulleted columns. */
  test("runs the skills together on one line", async ({ page }) => {
    await selectCompact(page);

    const skills = preview(page).getByText(/TypeScript.+React.+Redux/);
    await expect(skills).toBeVisible();

    // One run holding all of them, rather than one run each.
    const lines = await preview(page)
      .locator("page")
      .first()
      .evaluate(
        (sheet) =>
          [...sheet.querySelectorAll<HTMLElement>("text")].filter((el) =>
            (el.textContent?.trim() ?? "").startsWith("TypeScript"),
          ).length,
      );
    expect(lines).toBe(1);
  });

  test("leaves out a contact detail that was never filled in", async ({ page }) => {
    await selectCompact(page);

    await expect(preview(page).getByText("0123456789", { exact: true })).toBeVisible();

    // By `name`, not by label: the form's labels are styled divs rather than
    // <label> elements, so there is nothing for `getByLabel` to resolve.
    await page.locator('input[name="phone"]').fill("");

    // The detail goes entirely: kept in, an empty phone number still claimed its
    // separator dot, so the line advertised a hole rather than closing it.
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
    await selectCompact(page);

    const layout = await entryBlockLayout(page, /Staff Frontend Engineer/);

    // The seed is three long roles, so it has to spill.
    expect(Math.max(...layout.blocks.map((b) => b.page))).toBeGreaterThan(0);

    const heads = layout.blocks.filter((b) => b.isHead);
    expect(heads).toHaveLength(3);

    /* Each headline shares its unbreakable block with the first bullet, which is
       what makes it impossible to strand: the block moves as one, so wherever the
       headline goes that bullet goes too. The headline is a run wrapping the bold
       title, the date is another, and the bullet's disc and text are two more. */
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
     * The bound is measured rather than a fixed number of pixels, for the reason
     * spelled out in `ledger-template.spec.ts`: how tall a bullet is depends on how
     * wide the template's text column is, so a literal threshold copied between
     * templates reports a defect on a break that is actually correct. What a bullet
     * costs is its height plus the gap it carries above it.
     */
    const bullets = layout.blocks.filter((block) => !block.isHead);
    const tallestBullet = Math.max(...bullets.map((block) => block.bottom - block.top));
    const spacingAboveBullet = bullets.length > 1 ? bullets[1].top - bullets[0].bottom : 0;

    expect(Math.max(...layout.trailingGaps)).toBeLessThan(tallestBullet + spacingAboveBullet);
  });

  test("exports a standalone HTML document", async ({ page }) => {
    await selectCompact(page);

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

    // The heading's trailing rule is a pseudo-element here rather than a box, so
    // it is measured by what it does to the heading: the h2 spans the full column
    // while its text does not.
    const heading = await page.evaluate(() => {
      const h2 = document.querySelector("h2")!;
      const body = document.querySelector(".body")!;

      return {
        headingWidth: h2.getBoundingClientRect().width,
        columnWidth: body.getBoundingClientRect().width,
        rule: getComputedStyle(h2, "::after").backgroundColor,
      };
    });
    expect(Math.abs(heading.headingWidth - heading.columnWidth)).toBeLessThan(1);
    expect(heading.rule).toBe("rgb(46, 64, 74)");

    // A role's dates are pushed out to the right margin, level with its title.
    const headline = await page.evaluate(() => {
      const row = document.querySelector(".entry .top-row")!;
      const title = row.querySelector(".headline")!.getBoundingClientRect();
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

    // The job title and its company share the headline, which is the line this
    // template saves against every other one.
    await expect(page.locator(".entry .headline").first()).toHaveText("Senior Engineer, Google");

    // Skills and links each run together on one line rather than being a list.
    await expect(page.locator(".inline-list").first()).toContainText("TypeScript");
    await expect(page.locator(".inline-list").first()).toContainText("Redux");
    expect(
      await page
        .locator(".inline-list")
        .first()
        .evaluate((el) => el.tagName),
    ).toBe("P");
  });

  test("downloads a valid single-page PDF", async ({ page }) => {
    await selectCompact(page);

    await expect(downloadMenu(page)).toBeEnabled();

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await downloadPdf(page);
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("resume.pdf");

    const pdf = readPdfFacts((await download.path())!);

    expect(pdf.header).toBe("%PDF-1.3");
    expect(pdf.hasEof).toBe(true);
    expect(pdf.pages).toBe(1);

    /* Sans only. The one serif face available is bold display type and there is no
       display text on this sheet to spend it on, so the PDF carries two faces
       rather than three — a smaller file, and the check that no heading quietly
       reached for the serif. */
    for (const family of ["NotoSans-Regular", "NotoSans-Bold"]) {
      expect(pdf.embeddedFonts.some((f) => f.endsWith(family))).toBe(true);
    }
    expect(pdf.embeddedFonts.some((f) => f.endsWith("NotoSerif-Bold"))).toBe(false);

    // Github / Medium / Threads stay clickable on the Links line, and the
    // project's url is clickable where it sits in the date column.
    expect(pdf.linkAnnotations).toBe(4);
    expect(pdf.linkTargets).toContain("https://github.com/open-resume");
  });
});
