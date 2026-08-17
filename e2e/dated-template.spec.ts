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
 * The Dated template hangs each job's and each degree's years in a narrow left
 * margin, with the entry beside them. These tests drive the picker to it and then
 * check all three outputs — the preview, the standalone HTML and the PDF — so a
 * template that only half-works cannot pass.
 */

const selectDated = (page: Page) => selectTemplate(page, "Dated");

/** Every section the template renders, in the order it renders them. */
const SECTIONS = ["Summary", "Experience", "Projects", "Education", "Skills", "Links"];

/** A4 at the preview's 4/3 scale, the same figure `entryBlockLayout` paginates by. */
const A4_PX = (842 * 4) / 3;

/** The sheet's own bottom margin in preview pixels, read rather than hardcoded. */
const bottomMargin = (page: Page) =>
  preview(page)
    .locator("page")
    .first()
    .evaluate((sheet) => Number.parseFloat(getComputedStyle(sheet).paddingBottom));

test.describe("Dated template", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("is offered by the picker", async ({ page }) => {
    await openAppearanceMenu(page);
    await expect(page.getByRole("button", { name: /^Dated — / })).toBeVisible();
  });

  test("switches the preview to the date-margin layout", async ({ page }) => {
    // Classic names the section "Employment History"; Dated calls it Experience
    // and adds Summary, so the section names identify the template.
    await expect(preview(page).getByText("Employment History")).toBeVisible();

    await selectDated(page);

    for (const heading of SECTIONS) {
      await expect(preview(page).getByText(heading, { exact: true })).toBeVisible();
    }
    await expect(preview(page).getByText("Employment History")).toBeHidden();
  });

  /**
   * The layout itself, and the one thing that separates it from Ledger: what sits
   * in the gutter is the *entry's date*, level with the entry, not the section's
   * title.
   *
   * Both the job's dates and the degree's are checked, because they are two
   * different components that have to agree on one column.
   */
  test("hangs each entry's dates in the left margin, level with the entry", async ({ page }) => {
    await selectDated(page);

    const rows = await preview(page)
      .locator("page")
      .first()
      .evaluate((sheet) => {
        const dates = [...sheet.querySelectorAll<HTMLElement>("text")].filter((el) =>
          /^(JANUARY|MAY|NOVEMBER|\w+ \d{4}) /i.test(el.textContent?.trim() ?? ""),
        );

        return dates.map((date) => {
          const row = date.parentElement!;
          const entry = row.querySelector<HTMLElement>("view")!;

          const dateBox = date.getBoundingClientRect();
          const entryBox = entry.getBoundingClientRect();

          return {
            text: date.textContent?.trim(),
            leftOfEntry: dateBox.right <= entryBox.left,
            // Level with what it labels, not stacked above it.
            sameLine: Math.abs(dateBox.top - entryBox.top),
            right: Math.round(dateBox.right),
            // Narrower than the entry beside it: a margin, not a second column.
            narrower: dateBox.width < entryBox.width,
          };
        });
      });

    // Two jobs' worth plus two degrees' in the default resume.
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows) {
      expect(row.leftOfEntry).toBe(true);
      expect(row.sameLine).toBeLessThan(6);
      expect(row.narrower).toBe(true);
    }

    /* And every date ends on the same edge. Set flush right for exactly this: it
       is what makes the column scannable, and ranged left the ragged ends would
       each sit a different distance from the entry they label. */
    expect(new Set(rows.map((row) => row.right)).size).toBe(1);
  });

  /**
   * The Links section is a column of bullets, and its rows must each take their own
   * line.
   *
   * This is here because the first cut of the template got it wrong in a way
   * nothing else caught. The continuation bullets in Experience are the second cell
   * of a row and need `flex: 1` to claim the rest of it; the same style on the
   * links made those siblings divide the column's height between them, and all
   * three rendered on top of one another. Every other assertion still passed —
   * the text was present, visible, and correctly ordered in the DOM.
   */
  test("gives each link its own line", async ({ page }) => {
    await selectDated(page);

    const rows = await preview(page)
      .locator("page")
      .first()
      .evaluate((sheet) =>
        ["Github", "Medium", "Threads"].map((label) => {
          const run = [...sheet.querySelectorAll<HTMLElement>("text")].find(
            (el) => el.textContent?.trim() === label,
          )!;
          const { top, bottom } = run.getBoundingClientRect();

          return { label, top, bottom };
        }),
      );

    const ordered = [...rows].sort((a, b) => a.top - b.top);
    for (let index = 1; index < ordered.length; index += 1) {
      expect(ordered[index].top).toBeGreaterThanOrEqual(ordered[index - 1].bottom);
    }
  });

  /**
   * Every section's content starts on the same edge, dated or not.
   *
   * This is the defect the layout shipped with and the PDF render did not make
   * obvious: the four sections without dates ran the full measure, so Experience
   * sat indented behind its date column while Projects, Skills and Links snapped
   * back out to the page margin. At the size the editor shows the sheet it reads
   * as broken alignment rather than as a deliberate change of measure.
   *
   * Measured as the leftmost run in each section body that is *not* a date. The
   * dates are excluded because they are the one thing that is meant to sit further
   * left than everything else — including them would just measure the gutter and
   * find it in the same place on every dated section, which is a different claim.
   */
  test("starts every section's content on one edge", async ({ page }) => {
    await selectDated(page);

    const edges = await preview(page)
      .locator("page")
      .first()
      .evaluate((sheet, titles) => {
        const runs = [...sheet.querySelectorAll<HTMLElement>("text")];
        const isDate = (text: string) => /^\w+ \d{4} —/.test(text);

        return titles.map((title) => {
          const heading = runs.find((el) => el.textContent?.trim() === title)!;
          const body = [...heading.parentElement!.querySelectorAll<HTMLElement>("text")].filter(
            (el) => {
              const text = el.textContent?.trim() ?? "";
              return el !== heading && text !== "" && !isDate(text);
            },
          );

          return {
            title,
            left: Math.round(Math.min(...body.map((el) => el.getBoundingClientRect().left))),
            headingLeft: Math.round(heading.getBoundingClientRect().left),
          };
        });
      }, SECTIONS);

    expect(edges).toHaveLength(SECTIONS.length);
    expect(new Set(edges.map((row) => row.left)).size).toBe(1);
    // And that edge is inside the headings, which stay out at the page margin.
    expect(new Set(edges.map((row) => row.headingLeft)).size).toBe(1);
    expect(edges[0].left).toBeGreaterThan(edges[0].headingLeft);
  });

  /**
   * The skills sit in two columns on screen as well as in the PDF.
   *
   * They did not at first. Each item is half the width with a little padding, and
   * yoga counts that padding inside the 50% while the browser counts it outside —
   * so in the preview every item came out wider than half and only one fitted per
   * row. Nothing failed: the PDF was right, the HTML export was right, and the
   * sheet on screen quietly showed a layout no output actually produced.
   */
  test("lays the skills out in two columns on screen", async ({ page }) => {
    await selectDated(page);

    const columns = await preview(page)
      .locator("page")
      .first()
      .evaluate((sheet) => {
        const names = ["TypeScript", "React", "Next.js", "GraphQL", "Redux"];
        const runs = [...sheet.querySelectorAll<HTMLElement>("text")].filter((el) =>
          names.includes(el.textContent?.trim() ?? ""),
        );

        return new Set(runs.map((el) => Math.round(el.getBoundingClientRect().left))).size;
      });

    expect(columns).toBe(2);
  });

  /**
   * A date range occupies exactly one line of the margin.
   *
   * It did not at first. The gutter was 22% and the full "JANUARY 2018 — JANUARY
   * 2020" measures 28.4% of the text column, so every range wrapped to two lines
   * with the em-dash left dangling at the end of the first. Widening the gutter
   * to fit it would have made the page worse, not better — the same column is
   * empty beside the four sections that have no dates. The string was shortened
   * instead; see `format-date.ts` for the measurements.
   *
   * Counted with a Range rather than by comparing heights, so this says "one line
   * box" exactly rather than "not much taller than one line".
   */
  test("keeps each date range on a single line", async ({ page }) => {
    await selectDated(page);

    const lines = await preview(page)
      .locator("page")
      .first()
      .evaluate((sheet) => {
        const range = sheet.ownerDocument.createRange();

        return [...sheet.querySelectorAll<HTMLElement>("text")]
          .filter((el) => /^\w+ \d{4} —/.test(el.textContent?.trim() ?? ""))
          .map((el) => {
            range.selectNodeContents(el);
            return { text: el.textContent?.trim(), lines: range.getClientRects().length };
          });
      });

    expect(lines.length).toBeGreaterThanOrEqual(3);
    for (const date of lines) {
      expect(date.lines).toBe(1);
    }
  });

  /**
   * Every section opens the same distance below its own heading.
   *
   * Projects did not. Its entries sit in `splitEntryList`, which pulls the list up
   * by one paragraph of spacing on the understanding that whatever opens a run
   * puts it back — and Projects borrowed `entry`, which carries no top margin
   * because the lists that use it space their children with `rowGap`. Nothing
   * cancelled the negative, so the whole section rode up into the rule beneath its
   * own title while every other section sat clear of it.
   *
   * Measured heading-bottom to first-content-top, which is the gap the eye reads.
   */
  test("opens every section the same distance below its heading", async ({ page }) => {
    await selectDated(page);

    const gaps = await preview(page)
      .locator("page")
      .first()
      .evaluate((sheet, titles) => {
        const runs = [...sheet.querySelectorAll<HTMLElement>("text")];

        return titles.map((title) => {
          const heading = runs.find((el) => el.textContent?.trim() === title)!;
          const body = [...heading.parentElement!.querySelectorAll<HTMLElement>("text")].filter(
            (el) => el !== heading && (el.textContent?.trim() ?? "") !== "",
          );
          const top = Math.min(...body.map((el) => el.getBoundingClientRect().top));

          return { title, gap: Math.round(top - heading.getBoundingClientRect().bottom) };
        });
      }, SECTIONS);

    expect(gaps).toHaveLength(SECTIONS.length);
    // Every section clear of its rule, and all by the same amount.
    for (const section of gaps) {
      expect(section.gap).toBeGreaterThan(0);
    }
    expect(Math.max(...gaps.map((s) => s.gap)) - Math.min(...gaps.map((s) => s.gap))).toBeLessThan(
      4,
    );
  });

  test("leaves out a contact detail that was never filled in", async ({ page }) => {
    await selectDated(page);

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
    await selectDated(page);

    const layout = await entryBlockLayout(page, /Staff Frontend Engineer/);
    const margin = await bottomMargin(page);

    // The seed is three long roles, so it has to spill.
    expect(Math.max(...layout.blocks.map((b) => b.page))).toBeGreaterThan(0);

    const heads = layout.blocks.filter((b) => b.isHead);
    expect(heads).toHaveLength(3);

    /* Each headline shares its unbreakable block with the date, the company line
       and the first bullet, which is what makes it impossible to strand: the block
       moves as one, so wherever the headline goes that bullet goes too. */
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
     * for the block that followed it.
     *
     * The other templates' specs bound this by the tallest *bullet*, which is the
     * looser statement and does not hold here. This template's headline block is
     * 201px against a 152px bullet — the date, the title, the company and the first
     * bullet, bound together so the headline cannot be stranded — so a page that
     * breaks before a headline correctly leaves more room behind than any bullet
     * needs. Measuring against the block that actually follows says what is meant
     * without having to know which kind it is.
     */
    const pages = [...new Set(layout.blocks.map((block) => block.page))].sort((a, b) => a - b);
    const lastPage = Math.max(...pages);

    const roomLeft = pages
      .filter((index) => index !== lastPage)
      .map((index) => {
        const filled = Math.max(
          ...layout.blocks.filter((block) => block.page === index).map((block) => block.bottom),
        );
        const [next] = layout.blocks
          .filter((block) => block.page > index)
          .sort((a, b) => a.top - b.top);

        return { gap: (index + 1) * A4_PX - margin - filled, needed: next.bottom - next.top };
      })
      /* A block can reach past its own page's limit — the entry too tall for any
         page, which the paginator splits rather than looping forever. That gives a
         negative gap, and the question here is only whether a page that *could*
         have been filled was. The helper's own `trailingGaps` drops these too; they
         are recomputed here rather than read from it because it returns the gaps
         already flattened, with nothing left to pair each one to its follower. */
      .filter(({ gap }) => gap >= 0);

    expect(roomLeft.length).toBeGreaterThan(0);
    for (const { gap, needed } of roomLeft) {
      expect(gap).toBeLessThan(needed);
    }
  });

  /**
   * Each bullet after the first is its own block so the page can break between
   * them, and each therefore has to carry the empty gutter itself. Without it a
   * bullet is a row starting at the page margin, so the moment a role's bullets
   * outrun its headline they slide left underneath the dates.
   */
  test("keeps a role's later bullets clear of the date margin", async ({ page }) => {
    await seedResume(page, LONG_DESCRIPTIONS);
    await page.goto("/resume-editor");
    await selectDated(page);

    const lefts = await preview(page)
      .locator("[data-resume-page] > div")
      .first()
      .evaluate((content) => {
        /* Only the Experience bullets. Skills and Links are bulleted too and run
           the full measure by design, so they legitimately start at the page's own
           margin — scoped by the seed's own text rather than by position, so this
           cannot start passing because a section moved. */
        const bullets = [...content.querySelectorAll<HTMLElement>("text")].filter(
          (el) =>
            el.textContent?.trim() === "•" && /Lorem/.test(el.parentElement?.textContent ?? ""),
        );
        const dates = [...content.querySelectorAll<HTMLElement>("text")].filter((el) =>
          /^\w+ \d{4} —/.test(el.textContent?.trim() ?? ""),
        );

        return {
          bulletLefts: [
            ...new Set(bullets.map((el) => Math.round(el.getBoundingClientRect().left))),
          ],
          entryColumnLeft: Math.round(
            Math.max(...dates.map((el) => el.getBoundingClientRect().right)),
          ),
        };
      });

    // Every bullet in the section starts at one x, and it is right of the dates.
    expect(lefts.bulletLefts).toHaveLength(1);
    expect(lefts.bulletLefts[0]).toBeGreaterThan(lefts.entryColumnLeft);
  });

  test("exports a standalone HTML document", async ({ page }) => {
    await selectDated(page);

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

    // Every dated row puts its date left of the entry, level with it, and every
    // date ends on the same edge.
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll(".dated:not(.dateless)")].map((row) => {
        const date = row.querySelector(".date")!.getBoundingClientRect();
        const entry = row.querySelector(".entry")!.getBoundingClientRect();

        return {
          leftOfEntry: date.right <= entry.left,
          sameLine: Math.abs(date.top - entry.top),
          right: Math.round(date.right),
          narrower: date.width < entry.width,
        };
      }),
    );

    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows) {
      expect(row.leftOfEntry).toBe(true);
      expect(row.sameLine).toBeLessThan(6);
      expect(row.narrower).toBe(true);
    }
    expect(new Set(rows.map((row) => row.right)).size).toBe(1);

    /*
     * Every section's content starts on one edge, whether it has dates or not.
     *
     * The dateless sections ran the full measure at first, and the result was a
     * page with two left edges — Experience indented behind its date column,
     * Projects snapping back out to the margin. It reads as broken alignment
     * rather than as a change of measure, so they keep the column and leave the
     * gutter empty.
     */
    const bodyEdges = await page.evaluate(() =>
      [...document.querySelectorAll("section")].map((section) => ({
        name: section.querySelector("h2")!.textContent,
        // The grid's second cell, which is where every section's content sits.
        left: Math.round(
          section.querySelector(".dated > *:nth-child(2)")!.getBoundingClientRect().left,
        ),
        headingLeft: Math.round(section.querySelector("h2")!.getBoundingClientRect().left),
      })),
    );

    expect(bodyEdges).toHaveLength(SECTIONS.length);
    expect(new Set(bodyEdges.map((row) => row.left)).size).toBe(1);
    // And that edge is inside the heading's, which stays out at the margin.
    expect(bodyEdges[0].left).toBeGreaterThan(bodyEdges[0].headingLeft);

    // Skills run in two columns.
    const skillColumns = await page.evaluate(() => {
      const items = [...document.querySelectorAll(".skills li")];
      return new Set(items.map((item) => Math.round(item.getBoundingClientRect().left))).size;
    });
    expect(skillColumns).toBe(2);
  });

  test("stacks the date above its entry on a narrow screen", async ({ page }) => {
    await selectDated(page);

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await downloadHtml(page);
    const download = await downloadPromise;

    const path = test.info().outputPath("resume-narrow.html");
    await download.saveAs(path);

    await page.setViewportSize({ width: 420, height: 900 });
    await page.goto(pathToFileURL(path).href);

    /* A 22% date column on a phone leaves too little for the entry beside it, so
       the row stacks instead — and the date ranges left, since there is no column
       edge left for it to be flush against. */
    const row = await page.evaluate(() => {
      const dated = document.querySelector(".dated:not(.dateless)")!;
      const date = dated.querySelector(".date")!;
      const entry = dated.querySelector(".entry")!.getBoundingClientRect();

      return {
        dateBottom: date.getBoundingClientRect().bottom,
        entryTop: entry.top,
        align: getComputedStyle(date).textAlign,
      };
    });
    expect(row.entryTop).toBeGreaterThanOrEqual(row.dateBottom);
    expect(row.align).toBe("left");
  });

  test("downloads a valid single-page PDF", async ({ page }) => {
    await selectDated(page);

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

    // Github / Medium / Threads stay clickable in the Links section, and the
    // project's url is clickable where it rides the headline.
    expect(pdf.linkAnnotations).toBe(4);
    expect(pdf.linkTargets).toContain("https://github.com/open-resume");
  });
});
