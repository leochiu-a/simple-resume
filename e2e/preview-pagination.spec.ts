import { expect, test, type Page } from "@playwright/test";

import { preview, selectTemplate } from "./helpers";

/**
 * The preview lays the resume out as one sheet per page. What makes that useful
 * rather than merely decorative is where the breaks land: a job or an education
 * entry is moved whole onto the next page instead of being sliced through, the
 * same rule @react-pdf follows when it paginates the PDF.
 *
 * These tests assert that guarantee directly — no `data-avoid-break` block may
 * cross a page boundary — rather than eyeballing the result.
 */

const A4_HEIGHT_PX = (842 * 4) / 3;

/**
 * Browsers round layout to 1/64px, so a block pushed to a page boundary settles a
 * hundredth of a pixel either side of it. Without this slack the checks below
 * would fail on arithmetic rather than on layout.
 */
const SUBPIXEL_SLACK_PX = 1;

/** Long enough to need a second sheet in every template. */
const LONG_RESUME = {
  name: "Ada Lovelace",
  wantedJob: "Frontend Engineer",
  email: "ada@example.com",
  phone: "0975812267",
  city: "Taipei",
  profile:
    "Frontend engineer with 5+ years building and architecting production web applications. Led technical planning across teams, introduced TypeScript and CI/CD, and cut bundle size by 40%.",
  socialLinks: [
    { name: "Medium", url: "https://medium.com" },
    { name: "GitHub", url: "https://github.com" },
  ],
  skills: ["TypeScript", "React", "Next.js", "Vue", "GraphQL", "AWS"].map((name) => ({ name })),
  educations: [
    {
      school: "Providence University",
      degree: "Bachelor",
      major: "Computer Science",
      timeline: { from: "2014-09-01", to: "2018-07-01" },
    },
    {
      school: "National Central University",
      degree: "Master",
      major: "Computer Science",
      timeline: { from: "2018-08-01", to: "2020-08-01" },
    },
  ],
  // Sized to overflow one page in every template, including the two-column ones
  // whose wider content area fits considerably more than the single-column ones.
  employmentHistory: [1, 2, 3, 4, 5].map((n) => ({
    company: `Company ${n}`,
    jobTitle: "Frontend Engineer",
    timeline: { from: "2020-10-01", to: "2024-11-01" },
    description: Array.from(
      { length: 8 },
      (_, i) =>
        `Achievement ${i + 1} at company ${n}, written long enough that the line has to wrap onto a second line in every one of the four templates.`,
    ).join("|"),
  })),
  projects: [],
  visibility: {
    profile: true,
    socialLinks: true,
    skills: true,
    educations: true,
    employmentHistory: true,
    projects: true,
  },
};

/** Bulk carried by one very long paragraph, so a break must land inside it. */
const PARAGRAPH_RESUME = {
  ...LONG_RESUME,
  profile: Array.from(
    { length: 40 },
    (_, i) =>
      `Sentence ${i + 1} of a single unbroken paragraph, long enough that the summary alone runs past the bottom of the first page.`,
  ).join(" "),
  employmentHistory: LONG_RESUME.employmentHistory.slice(0, 1),
};

/** The pager only exists once there is more than one page to move between. */
const pager = (page: Page) => page.getByRole("navigation", { name: "Resume pages" });

const pageButtons = (page: Page) => pager(page).getByRole("button", { name: /^Page \d+$/ });

/** Which page the single sheet is currently showing, 1-based. */
const shownPage = async (page: Page) =>
  Number(
    await preview(page).locator("[data-resume-page]").first().getAttribute("data-resume-page"),
  );

/* `selectTemplate` comes from ./helpers now — see the note in
   formal-template.spec.ts for why the local copies were removed. */

/**
 * Every unbreakable block's offset within the sheet, paired with its height, so
 * the test can check which page each one starts and ends on.
 */
const blockBoxes = (page: Page) =>
  preview(page)
    .locator('[data-resume-page="1"] > div')
    .first()
    .evaluate((content) => {
      const top = content.getBoundingClientRect().top;
      return Array.from(content.querySelectorAll("[data-avoid-break]")).map((block) => {
        const rect = block.getBoundingClientRect();
        return { top: rect.top - top, height: rect.height, text: block.textContent?.slice(0, 40) };
      });
    });

/**
 * Every line of text in the sheet, as a top/bottom pair measured from the sheet's
 * top. A range over an element's contents yields one client rect per line box,
 * which is the only way to see where the browser wrapped.
 */
const textLines = (page: Page) =>
  preview(page)
    .locator("[data-resume-page] > div")
    .first()
    .evaluate((content) => {
      const sheetTop = content.getBoundingClientRect().top;
      const leaves = Array.from(content.querySelectorAll("text")).filter(
        (el) => !el.querySelector("text"),
      );

      return leaves.flatMap((el) => {
        const range = el.ownerDocument.createRange();
        range.selectNodeContents(el);
        return Array.from(range.getClientRects()).map((rect) => ({
          top: rect.top - sheetTop,
          bottom: rect.bottom - sheetTop,
          text: el.textContent?.slice(0, 40),
        }));
      });
    });

test.describe("preview pagination", () => {
  test("a resume that fits one page offers no pager", async ({ page }) => {
    await page.goto("/resume-editor");

    await expect(preview(page).locator("[data-resume-page]")).toHaveCount(1);
    await expect(pager(page)).toHaveCount(0);
  });

  for (const label of ["Classic", "Modern", "Formal", "Timeline"]) {
    test(`${label} splits a long resume across sheets without slicing an entry`, async ({
      page,
    }) => {
      await page.addInitScript(
        `localStorage.setItem("resume", ${JSON.stringify(JSON.stringify(LONG_RESUME))})`,
      );
      await page.goto("/resume-editor");
      await selectTemplate(page, label);

      // The pager appears, offering one button per page, starting on page 1.
      await expect(pager(page)).toBeVisible();
      await expect.poll(() => pageButtons(page).count()).toBeGreaterThan(1);
      expect(await shownPage(page)).toBe(1);

      // The guarantee: nothing unbreakable may start on one page and end on the
      // next. A block taller than a page is exempt — the PDF has to split those
      // too.
      //
      // The slack matters. Browsers round layout to 1/64px, so a block pushed to
      // a page boundary lands a hundredth of a pixel either side of it — a block
      // at 1122.656 starts page 2, whose boundary is 1122.667, and reading that
      // as a straddle would fail on arithmetic rather than on layout.
      const straddling = (await blockBoxes(page)).filter((box) => {
        if (box.height > A4_HEIGHT_PX) return false;
        const startPage = Math.floor((box.top + SUBPIXEL_SLACK_PX) / A4_HEIGHT_PX);
        const endPage = Math.floor((box.top + box.height - SUBPIXEL_SLACK_PX) / A4_HEIGHT_PX);
        return endPage > startPage;
      });

      expect(straddling).toEqual([]);
    });

    test(`${label} breaks a long paragraph between lines, never through one`, async ({ page }) => {
      await page.addInitScript(
        `localStorage.setItem("resume", ${JSON.stringify(JSON.stringify(PARAGRAPH_RESUME))})`,
      );
      await page.goto("/resume-editor");
      await selectTemplate(page, label);
      await expect(pager(page)).toBeVisible();

      // A paragraph is allowed to span a boundary — the PDF splits it too — but the
      // boundary has to fall in the gap between two lines, not across a line box.
      const sliced = (await textLines(page)).filter((line) => {
        const boundary = (Math.floor(line.top / A4_HEIGHT_PX) + 1) * A4_HEIGHT_PX;
        return (
          line.top < boundary - SUBPIXEL_SLACK_PX && line.bottom > boundary + SUBPIXEL_SLACK_PX
        );
      });

      expect(sliced).toEqual([]);
    });
  }

  test("every page is one click away, and the current one is marked", async ({ page }) => {
    await page.addInitScript(
      `localStorage.setItem("resume", ${JSON.stringify(JSON.stringify(LONG_RESUME))})`,
    );
    await page.goto("/resume-editor");
    await expect(pager(page)).toBeVisible();

    // The pager is numbers only — no prev/next arrows to step through.
    await expect(pager(page).getByRole("button")).toHaveCount(await pageButtons(page).count());

    const last = await pageButtons(page).count();
    expect(last).toBeGreaterThan(1);

    for (const target of [2, last, 1]) {
      await pager(page)
        .getByRole("button", { name: `Page ${target}` })
        .click();

      expect(await shownPage(page)).toBe(target);
      await expect(pager(page).getByRole("button", { name: `Page ${target}` })).toHaveAttribute(
        "aria-current",
        "page",
      );
      // Exactly one button claims to be the current page.
      await expect(pager(page).locator('[aria-current="page"]')).toHaveCount(1);
    }
  });

  test("the pager disappears when the resume shrinks back to one page", async ({ page }) => {
    await page.addInitScript(
      `localStorage.setItem("resume", ${JSON.stringify(JSON.stringify(LONG_RESUME))})`,
    );
    await page.goto("/resume-editor");

    await expect(pager(page)).toBeVisible();
    await pager(page).getByRole("button", { name: "Page 2" }).click();
    expect(await shownPage(page)).toBe(2);

    // Hiding the bulk of the content has to collapse the page count, which proves
    // it is measured rather than latched — and the view has to fall back to a page
    // that still exists rather than showing an empty sheet.
    await page.getByRole("heading", { name: "Employment History" }).getByRole("button").click();

    await expect(pager(page)).toHaveCount(0);
    expect(await shownPage(page)).toBe(1);
  });
});
