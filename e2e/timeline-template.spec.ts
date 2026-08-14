import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";

import {
  downloadHtml,
  downloadMenu,
  downloadPdf,
  preview,
  readPdfFacts,
  selectTemplate,
} from "./helpers";

/**
 * The Timeline template: a banded header, dated timeline entries in a wide left
 * column, and contacts, skills and links in a narrow rail on the right.
 *
 * These tests drive the picker and then check all three outputs — the preview,
 * the standalone HTML and the PDF — so a template that only half-works cannot
 * pass.
 */

/* Shared rather than a local copy — see the note in formal-template.spec.ts. */
const selectTimeline = (page: Page) => selectTemplate(page, "Timeline");

/** The headings Timeline renders, across both of its columns. */
const HEADINGS = ["Summary", "Experience", "Projects", "Education", "Skills", "Links"];

test.describe("timeline template", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
    await selectTimeline(page);
  });

  test("switches the preview to the Timeline layout", async ({ page }) => {
    for (const heading of HEADINGS) {
      await expect(preview(page).getByText(heading, { exact: true })).toBeVisible();
    }

    // Timeline puts contacts in the rail without a heading, and does not use
    // Classic's "Employment History" — so the absence of both identifies it.
    await expect(preview(page).getByText("Details", { exact: true })).toBeHidden();
    await expect(preview(page).getByText("Employment History")).toBeHidden();

    // The picked colour is an accent here, and starts on the template's own ink.
    await expect
      .poll(() =>
        preview(page)
          .getByText("My Name")
          .evaluate((el) => getComputedStyle(el).color),
      )
      .toBe("rgb(2, 6, 27)");
  });

  test("splits the heading rule dark under the title and grey after it", async ({ page }) => {
    const rules = await preview(page)
      .getByText("Experience", { exact: true })
      .evaluate((title) => {
        // The title sits in a bordered box; the grey remainder is its sibling.
        const box = title.parentElement!;
        const rest = box.nextElementSibling!;

        return {
          titleRule: getComputedStyle(box).borderBottomColor,
          restRule: getComputedStyle(rest).borderBottomColor,
          titleWidth: box.getBoundingClientRect().width,
          restWidth: rest.getBoundingClientRect().width,
        };
      });

    expect(rules.titleRule).toBe("rgb(2, 6, 27)");
    expect(rules.restRule).toBe("rgb(230, 230, 230)");
    // The grey rule carries on across the rest of the column.
    expect(rules.restWidth).toBeGreaterThan(rules.titleWidth);
  });

  test("renders a dot per entry and a connector between them", async ({ page }) => {
    const timeline = await preview(page)
      .locator("body")
      .evaluate(() => {
        const views = [...document.querySelectorAll("VIEW")];

        const dots = views.filter((el) => {
          const { width, height } = el.getBoundingClientRect();
          const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius);

          return width > 0 && width < 12 && Math.abs(width - height) < 1 && radius > 0;
        });

        // The connector is the only thing filled with the rule grey, which keeps
        // this from matching the section rules or the column's right border.
        const connectors = views
          .filter((el) => getComputedStyle(el).backgroundColor === "rgb(230, 230, 230)")
          .map((el) => el.getBoundingClientRect());

        return {
          dots: dots.length,
          connectors: connectors.map(({ width, height }) => ({ width, height })),
        };
      });

    // One dot per employment entry (1), per project (1) and per education entry (2).
    expect(timeline.dots).toBe(4);
    // Only the first of the two educations is connected; employment and projects
    // have a single entry each, and the last entry of a list never trails a line.
    expect(timeline.connectors).toHaveLength(1);
    expect(timeline.connectors[0].height).toBeGreaterThan(10);
    expect(timeline.connectors[0].width).toBeLessThan(4);
  });

  test("exports the Timeline template as a standalone document", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await downloadHtml(page);
    const download = await downloadPromise;

    const path = test.info().outputPath("resume.html");
    await download.saveAs(path);

    const html = readFileSync(path, "utf8");
    expect(html).not.toContain("<script");

    await page.goto(pathToFileURL(path).href);

    await expect(page.getByRole("heading", { level: 1, name: "My Name" })).toBeVisible();
    for (const heading of HEADINGS) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Github", exact: true })).toHaveAttribute(
      "href",
      "https://github.com",
    );

    // The rail is the narrower of the two columns, at roughly 30% of the sheet.
    const widths = await page.evaluate(() => ({
      main: document.querySelector(".main")!.getBoundingClientRect().width,
      rail: document.querySelector(".rail")!.getBoundingClientRect().width,
    }));
    expect(widths.rail).toBeGreaterThan(0);
    expect(widths.main).toBeGreaterThan(widths.rail * 2);

    // The connector is drawn on every entry but the last of its list, and has to
    // have real height — a collapsed pseudo-element would leave the dots loose.
    const connectors = await page.evaluate(() =>
      [...document.querySelectorAll(".entry-left")]
        .map((el) => getComputedStyle(el, "::before"))
        .filter((style) => style.content !== "none")
        .map((style) => parseFloat(style.height)),
    );
    // One employment entry and one project (each last of its list, so no line),
    // and two educations (one line).
    expect(connectors).toHaveLength(1);
    expect(connectors[0]).toBeGreaterThan(0);
  });

  test("downloads a valid PDF of the Timeline template", async ({ page }) => {
    await expect(downloadMenu(page)).toBeEnabled();

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await downloadPdf(page);
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("resume.pdf");

    const pdf = readPdfFacts((await download.path())!);

    expect(pdf.header).toBe("%PDF-1.3");
    expect(pdf.hasEof).toBe(true);
    expect(pdf.pages).toBe(1);
    // Timeline is sans-only, so just the two Noto Sans weights are embedded.
    expect(pdf.embeddedFonts).toHaveLength(2);
    for (const family of ["NotoSans-Regular", "NotoSans-Bold"]) {
      expect(pdf.embeddedFonts.some((f) => f.endsWith(family))).toBe(true);
    }
    // Github / Medium / Threads stay clickable in the rail, plus the project
    // link. One annotation each — react-pdf emits one per line box of a link, so
    // a sample URL long enough to wrap in the narrow column would raise this.
    expect(pdf.linkAnnotations).toBe(4);
  });
});
