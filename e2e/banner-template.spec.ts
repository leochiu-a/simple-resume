import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";

import {
  closeAppearance,
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
 * The Banner template runs the picked colour to the paper's edge in a band across
 * the top of the sheet, then lays one column of sections beneath it. These tests
 * drive the picker to it and then check all three outputs — the preview, the
 * standalone HTML and the PDF — so a template that only half-works cannot pass.
 */

const selectBanner = (page: Page) => selectTemplate(page, "Banner");

/** Every section the template renders, in the order it renders them. */
const SECTIONS = ["Summary", "Experience", "Projects", "Education", "Skills", "Links"];

/** The template's own default, the deep navy in `banner-color.ts`. */
const NAVY = "rgb(31, 58, 95)";
const PAPER = "rgb(255, 255, 255)";
const INK = "rgb(2, 6, 27)";

/**
 * The band's box against the sheet's, measured inside the preview iframe.
 *
 * The band is found by its fill rather than by a selector, because @react-pdf
 * primitives land in the preview as anonymous `<view>` elements with no class to
 * hold on to — the colour is the only thing that identifies it, and it is also
 * the thing under test.
 */
const bandBleed = (page: Page, fill: string) =>
  preview(page)
    .locator("page")
    .first()
    .evaluate((sheet, background) => {
      const band = [...sheet.querySelectorAll<HTMLElement>("view")].find(
        (el) => getComputedStyle(el).backgroundColor === background,
      );
      if (!band) return null;

      const bandBox = band.getBoundingClientRect();
      const sheetBox = sheet.getBoundingClientRect();

      return {
        left: bandBox.left - sheetBox.left,
        right: sheetBox.right - bandBox.right,
        top: bandBox.top - sheetBox.top,
        height: bandBox.height,
      };
    }, fill);

/** The colour a run of text in the band is painted, by its content. */
const bandTextColor = (page: Page, content: string) =>
  preview(page)
    .locator("page")
    .first()
    .evaluate((sheet, text) => {
      const run = [...sheet.querySelectorAll<HTMLElement>("text")].find(
        (el) => el.textContent?.trim() === text,
      );

      return run ? getComputedStyle(run).color : null;
    }, content);

test.describe("Banner template", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("is offered by the picker", async ({ page }) => {
    await openAppearanceMenu(page);
    await expect(page.getByRole("button", { name: /^Banner — / })).toBeVisible();
  });

  test("switches the preview to the single-column layout", async ({ page }) => {
    // Classic names the section "Employment History"; Banner calls it Experience
    // and adds Summary, so the section names identify the template.
    await expect(preview(page).getByText("Employment History")).toBeVisible();

    await selectBanner(page);

    for (const heading of SECTIONS) {
      await expect(preview(page).getByText(heading, { exact: true })).toBeVisible();
    }
    await expect(preview(page).getByText("Employment History")).toBeHidden();
  });

  /**
   * The one thing that makes this template not a restyled Formal: the colour
   * reaches the paper on three sides.
   *
   * It is worth a test of its own because of *how* it is done. The page keeps its
   * padding — dropping it would cost a second page its top margin, since a `View`'s
   * padding is not reapplied where it wraps — and the band cancels that padding
   * with a matching negative margin. Negative margins are the kind of thing yoga
   * and the browser can disagree about, and this is the renderer where a
   * disagreement would show.
   */
  test("bleeds its band to the edges of the sheet", async ({ page }) => {
    await selectBanner(page);

    const bleed = await bandBleed(page, NAVY);

    expect(bleed).not.toBeNull();
    expect(Math.abs(bleed!.left)).toBeLessThan(1);
    expect(Math.abs(bleed!.right)).toBeLessThan(1);
    expect(Math.abs(bleed!.top)).toBeLessThan(1);
    // And it is a band, not a hairline: tall enough to hold the name and contacts.
    expect(bleed!.height).toBeGreaterThan(100);
  });

  /**
   * The picker is shared with every other template, so the band is handed colours
   * chosen for a sidebar or a word — anything from near-black to near-white. It
   * keeps whatever it is given and flips its own text instead, which is the only
   * reason a near-white fill does not print white-on-white.
   */
  test("flips the band's text to ink on a light colour", async ({ page }) => {
    await selectBanner(page);

    await expect.poll(() => bandTextColor(page, "My Name")).toBe(PAPER);

    await openAppearanceMenu(page);
    await page.getByRole("button", { name: "Light" }).click();
    await closeAppearance(page);

    await expect.poll(() => bandTextColor(page, "My Name")).toBe(INK);
    // The fill is honoured rather than overridden — it is the text that moved.
    expect(await bandBleed(page, "rgb(242, 242, 242)")).not.toBeNull();
  });

  test("leaves out a contact detail that was never filled in", async ({ page }) => {
    await selectBanner(page);

    await expect(preview(page).getByText("0123456789", { exact: true })).toBeVisible();

    // By `name`, not by label: the form's labels are styled divs rather than
    // <label> elements, so there is nothing for `getByLabel` to resolve.
    await page.locator('input[name="phone"]').fill("");

    // The detail goes entirely: kept in, an empty phone number still claimed its
    // separator dot, so the row advertised a hole rather than closing it.
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
    await selectBanner(page);

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
    await selectBanner(page);

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

    // The band bleeds here too — the sheet's padding is cancelled the same way.
    const band = await page.evaluate(() => {
      const sheet = document.querySelector(".page")!.getBoundingClientRect();
      const box = document.querySelector(".band")!.getBoundingClientRect();

      return {
        left: box.left - sheet.left,
        right: sheet.right - box.right,
        top: box.top - sheet.top,
        background: getComputedStyle(document.querySelector(".band")!).backgroundColor,
      };
    });
    expect(Math.abs(band.left)).toBeLessThan(1);
    expect(Math.abs(band.right)).toBeLessThan(1);
    expect(Math.abs(band.top)).toBeLessThan(1);
    expect(band.background).toBe(NAVY);

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

    // Skills run in two columns.
    const skillColumns = await page.evaluate(() => {
      const items = [...document.querySelectorAll(".skills li")];
      return new Set(items.map((item) => Math.round(item.getBoundingClientRect().left))).size;
    });
    expect(skillColumns).toBe(2);
  });

  test("keeps the band edge to edge on a narrow screen", async ({ page }) => {
    await selectBanner(page);

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await downloadHtml(page);
    const download = await downloadPromise;

    const path = test.info().outputPath("resume-narrow.html");
    await download.saveAs(path);

    await page.setViewportSize({ width: 420, height: 900 });
    await page.goto(pathToFileURL(path).href);

    /* The sheet goes fluid below 700px and its padding changes with it, so the
       band's negative margin has to change too — a band still pulled out by the
       desktop 36px would hang off the side of a phone. */
    const band = await page.evaluate(() => {
      const box = document.querySelector(".band")!.getBoundingClientRect();
      const row = document.querySelector(".entry .top-row")!;
      const title = row.querySelector(".headline")!.getBoundingClientRect();
      const date = row.querySelector(".date")!.getBoundingClientRect();

      return {
        left: box.left,
        right: window.innerWidth - box.right,
        // The headline row stacks rather than squeezing the date against the title.
        stacked: date.top >= title.bottom,
      };
    });
    expect(Math.abs(band.left)).toBeLessThan(1);
    expect(Math.abs(band.right)).toBeLessThan(1);
    expect(band.stacked).toBe(true);

    // One column of skills at this width.
    const skillColumns = await page.evaluate(() => {
      const items = [...document.querySelectorAll(".skills li")];
      return new Set(items.map((item) => Math.round(item.getBoundingClientRect().left))).size;
    });
    expect(skillColumns).toBe(1);
  });

  test("downloads a valid single-page PDF", async ({ page }) => {
    await selectBanner(page);

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
