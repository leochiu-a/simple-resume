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
  openColorPicker,
  preview,
  readPdfFacts,
  selectTemplate,
} from "./helpers";
import { LONG_DESCRIPTIONS, seedResume } from "./seeds";

/**
 * The editor ships two templates and renders whichever is selected to all three
 * outputs — the preview, the PDF and the standalone HTML. These tests drive the
 * picker and then check each output, so a template that only half-works cannot
 * pass.
 */

/**
 * The picker is the appearance panel that floats over the preview now, not a
 * dropdown in the header, and its entries are buttons rather than menu items —
 * a thumbnail grid is not a menu. `appearanceMenu` and `selectTemplate` in
 * ./helpers carry both facts; this file used to keep its own copy of them.
 *
 * Each card's accessible name is "<label> — <description>", so a template is
 * addressed by that prefix, and the current one is the card marked pressed.
 */
const templateCard = (page: Page, label: string) =>
  page.getByRole("button", { name: new RegExp(`^${label} —`) });

test.describe("template picker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  // Kept in the order they appear in the registry's TEMPLATES. Adding a template
  // means adding it here too — the assertion below is exact so a new one cannot
  // slip in unnoticed.
  const EXPECTED_TEMPLATES = [
    "Classic",
    "Modern",
    "Formal",
    "Timeline",
    "Ledger",
    "Banner",
    "Compact",
    "Dated",
  ];

  test("starts on Classic and offers every registered template", async ({ page }) => {
    await openAppearanceMenu(page);

    // Classic is the default, and the panel says so by marking its card pressed.
    await expect(templateCard(page, "Classic")).toHaveAttribute("aria-pressed", "true");

    // Exact, so a new template cannot slip in unnoticed. The cards are the
    // buttons whose name carries the "<label> — <description>" separator, which
    // the colour swatches beside them do not.
    await expect(page.getByRole("button", { name: /^\w+ — / })).toHaveText(
      EXPECTED_TEMPLATES.map((label) => new RegExp(label)),
    );
  });

  /**
   * The mark is on every template whose PDF still yields its job title, dates,
   * skills and URLs to a text extractor — see `atsSafe` in the registry for what
   * disqualifies one. Asserted as the exact set rather than per card, so a
   * template that quietly loses the parse cannot keep the badge and a new one
   * cannot be waved through with it.
   */
  test("marks the templates that survive a text extractor", async ({ page }) => {
    await openAppearanceMenu(page);

    const marked = page.getByRole("button", { name: /ATS/ });
    await expect(marked).toHaveCount(EXPECTED_TEMPLATES.length - 1);
    await expect(templateCard(page, "Classic")).not.toHaveAccessibleName(/ATS/);
  });

  test("shows each template as a thumbnail of your own resume", async ({ page }) => {
    await openAppearanceMenu(page);

    for (const label of EXPECTED_TEMPLATES) {
      // Each card renders the real template in its own sheet frame, so the picker
      // cannot show a layout the editor does not produce.
      const thumbnail = templateCard(page, label).frameLocator("iframe");

      await expect(thumbnail.locator("page")).toBeVisible();
      await expect(thumbnail.getByText("Senior Engineer")).toBeVisible();
    }
  });

  /**
   * The grid adds columns instead of stretching a fixed two of them.
   *
   * With `grid-cols-2` the cards were A4-proportioned boxes sharing whatever width
   * the pane had, so on a wide monitor two of them grew enormous and the panel read
   * as loose. `auto-fill` with a minimum card width fixes the card and varies the
   * column count instead — which is only observable by measuring, so it is pinned
   * here rather than left to the eye.
   */
  test("lays the template cards out in more columns as the pane widens", async ({ page }) => {
    const columnCount = async () => {
      await openAppearanceMenu(page);

      return page.evaluate(() => {
        const cards = [...document.querySelectorAll("[aria-pressed][title]")];
        // One column per distinct left edge.
        return new Set(cards.map((card) => Math.round(card.getBoundingClientRect().left))).size;
      });
    };

    const wide = await columnCount();

    await page.setViewportSize({ width: 1024, height: 900 });
    const narrow = await columnCount();

    expect(wide).toBeGreaterThan(narrow);

    // And a card never gets so narrow that the sheet inside it is unreadable, nor
    // so wide that the grid should have added another column.
    const cardWidth = await page.evaluate(
      () => document.querySelector("[aria-pressed][title]")!.getBoundingClientRect().width,
    );
    expect(cardWidth).toBeGreaterThan(180);
    expect(cardWidth).toBeLessThan(420);

    // The panel is centred in the pane rather than hugging its left edge, which is
    // what made the empty space beside it read as slack.
    const centring = await page.evaluate(() => {
      const panel = document
        .querySelector("[aria-pressed][title]")!
        .closest("div.grid")!.parentElement!;
      const box = panel.getBoundingClientRect();
      const parent = panel.parentElement!.getBoundingClientRect();

      return {
        leftGap: box.left - parent.left,
        rightGap: parent.right - box.right,
      };
    });
    expect(Math.abs(centring.leftGap - centring.rightGap)).toBeLessThan(2);
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

  /**
   * The sidebar's tint is an absolutely positioned layer rather than the column's
   * own background, so that it can run past the page padding to the trim. In the
   * preview those styles are applied as CSS, where a positioned box paints over
   * its static siblings whatever the document order — so the tint covered the
   * whole sidebar and its contents disappeared behind a blank panel.
   *
   * `toBeVisible` does not catch this: it asks about CSS and geometry, not paint,
   * and the text stayed laid out exactly where it was while being drawn under an
   * opaque box. Hit-testing the sidebar's own ink is what tells the two apart.
   */
  test("keeps the Modern sidebar's contents in front of its tint", async ({ page }) => {
    await selectTemplate(page, "Modern");

    const name = preview(page).getByText("My Name", { exact: true });
    await expect(name).toBeVisible();

    const topmostIsTheText = await page
      .frameLocator('iframe[title="Resume preview"]')
      .locator("body")
      .evaluate((body) => {
        const target = [...body.querySelectorAll("text")].find(
          (el) => el.textContent?.trim() === "My Name",
        );
        if (!target) return false;

        const { left, top, width, height } = target.getBoundingClientRect();
        const hit = body.ownerDocument.elementFromPoint(left + width / 2, top + height / 2);

        return hit === target || target.contains(hit);
      });

    expect(topmostIsTheText).toBe(true);
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

  /**
   * The same rule the Formal template is held to, for the same reason: a job used
   * to be one unbreakable block, so an entry too tall for what was left of a page
   * jumped to the next one and left a hole behind it. Classic already wrapped each
   * bullet in its own `AvoidBreak`, but the outer block was resolved first and
   * moved the lot, so those never got to matter.
   */
  test("breaks a long Classic role between its bullets, not before its headline", async ({
    page,
  }) => {
    /* `seedResume` installs an init script, so it only takes effect on the next
       navigation — and the describe's `beforeEach` has already loaded the editor by
       the time this runs. The reload is what puts the seeded resume on screen. */
    await seedResume(page, LONG_DESCRIPTIONS);
    await page.reload();

    const layout = await entryBlockLayout(page, /Staff Frontend Engineer/);

    expect(Math.max(...layout.blocks.map((b) => b.page))).toBeGreaterThan(0);

    const heads = layout.blocks.filter((b) => b.isHead);
    expect(heads).toHaveLength(3);

    // The headline block carries the first bullet with it: the title and company
    // are one run, the dates a second, the bullet's disc and text a third and
    // fourth.
    for (const head of heads) {
      expect(head.runsInside).toBeGreaterThanOrEqual(4);
    }

    // A run spans pages rather than moving whole, and the space before the break
    // is used rather than abandoned.
    const spanning = heads.filter((head) =>
      layout.blocks.some((b) => !b.isHead && b.page > head.page && b.top > head.top),
    );
    expect(spanning.length).toBeGreaterThan(0);
    expect(Math.min(...layout.trailingGaps)).toBeLessThan(120);
  });

  test("remembers the template and its colour across a reload", async ({ page }) => {
    const sidebarColor = () =>
      preview(page)
        .locator('[style*="background-color"]')
        .nth(1)
        .evaluate((el) => getComputedStyle(el).backgroundColor);

    await selectTemplate(page, "Modern");

    // A colour the template does not default to, so the assertion cannot pass on
    // the default being restored rather than the choice.
    await openAppearanceMenu(page);
    await page.getByRole("button", { name: "Navy" }).click();
    await expect.poll(sidebarColor).toBe("rgb(46, 74, 107)");
    await closeAppearance(page);

    await page.reload();

    // The sheet is the thing that has to come back right; the panel starts closed
    // after a reload, so it is reopened to read which card is marked pressed.
    await expect.poll(sidebarColor).toBe("rgb(46, 74, 107)");

    await openAppearanceMenu(page);
    await expect(templateCard(page, "Modern")).toHaveAttribute("aria-pressed", "true");
  });

  test("falls back to the default when the stored template no longer exists", async ({ page }) => {
    // A template can be dropped from the registry between releases. The stored
    // colour was chosen for it, so honouring the colour while falling back on the
    // template would leave a sheet tinted for something nobody can select.
    await page.evaluate(() =>
      window.localStorage.setItem(
        "resume-appearance",
        JSON.stringify({ templateId: "brutalist", backgroundColor: "#ff00ff" }),
      ),
    );
    await page.reload();

    await openAppearanceMenu(page);
    await expect(templateCard(page, "Classic")).toHaveAttribute("aria-pressed", "true");
    await closeAppearance(page);

    await expect
      .poll(() =>
        preview(page)
          .locator('[style*="background-color"]')
          .nth(1)
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      )
      .toBe("rgb(9, 76, 66)");

    // Picking a colour must not carry the rejected id back into storage: the sheet
    // is showing Classic, so that is what the next write has to say it is.
    await openAppearanceMenu(page);
    await page.getByRole("button", { name: "Navy" }).click();

    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("resume-appearance")))
      .toBe(JSON.stringify({ templateId: "classic", backgroundColor: "#2e4a6b" }));
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
    await expect(page.getByRole("link", { name: "Github", exact: true })).toHaveAttribute(
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
    // Github / Medium / Threads stay clickable in the sidebar, plus the project link.
    expect(pdf.linkAnnotations).toBe(4);
  });

  test("leaves the colour picker working after a template change", async ({ page }) => {
    await selectTemplate(page, "Modern");

    await openColorPicker(page);
    await expect(page.locator(".w-color-sketch")).toBeVisible();
  });
});
