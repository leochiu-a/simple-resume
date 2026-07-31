import { expect, test, type Page } from "@playwright/test";

import { preview } from "./helpers";

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
  visibility: {
    profile: true,
    socialLinks: true,
    skills: true,
    educations: true,
    employmentHistory: true,
  },
};

const sheets = (page: Page) => preview(page).locator("[data-resume-page]");

const selectTemplate = async (page: Page, label: string) => {
  await page.getByRole("button", { name: "Change template" }).click();
  await page.getByRole("menuitem").filter({ hasText: label }).click();
  await expect(page.getByRole("button", { name: "Change template" })).toContainText(label);
};

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

test.describe("preview pagination", () => {
  test("a resume that fits stays a single sheet", async ({ page }) => {
    await page.goto("/resume-editor");

    await expect(sheets(page)).toHaveCount(1);
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

      // More than one sheet, and they are numbered from 1.
      await expect.poll(() => sheets(page).count()).toBeGreaterThan(1);
      const count = await sheets(page).count();
      for (let i = 1; i <= count; i += 1) {
        await expect(preview(page).locator(`[data-resume-page="${i}"]`)).toHaveCount(1);
      }

      // The guarantee: nothing unbreakable may start on one page and end on the
      // next. A block taller than a page is exempt — the PDF has to split those
      // too.
      //
      // The slack matters. Browsers round layout to 1/64px, so a block pushed to
      // a page boundary lands a hundredth of a pixel either side of it — a block
      // at 1122.656 starts page 2, whose boundary is 1122.667, and reading that
      // as a straddle would fail on arithmetic rather than on layout.
      const SUBPIXEL_SLACK_PX = 1;
      const straddling = (await blockBoxes(page)).filter((box) => {
        if (box.height > A4_HEIGHT_PX) return false;
        const startPage = Math.floor((box.top + SUBPIXEL_SLACK_PX) / A4_HEIGHT_PX);
        const endPage = Math.floor((box.top + box.height - SUBPIXEL_SLACK_PX) / A4_HEIGHT_PX);
        return endPage > startPage;
      });

      expect(straddling).toEqual([]);
    });
  }

  test("sheets are added and removed as the resume grows and shrinks", async ({ page }) => {
    await page.addInitScript(
      `localStorage.setItem("resume", ${JSON.stringify(JSON.stringify(LONG_RESUME))})`,
    );
    await page.goto("/resume-editor");

    await expect.poll(() => sheets(page).count()).toBeGreaterThan(1);

    // Hiding the bulk of the content has to collapse the sheet count back down,
    // which is what proves the count is measured rather than latched.
    await page.getByRole("heading", { name: "Employment History" }).getByRole("button").click();

    await expect.poll(() => sheets(page).count()).toBe(1);
  });
});
