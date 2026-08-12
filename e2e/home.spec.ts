import { expect, test } from "@playwright/test";
import { collectConsoleErrors, landingSheet, openOverflowMenu } from "./helpers";

test.describe("home page", () => {
  test("renders the hero and links to the editor", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "A resume builder that never uploads your resume.",
    );

    /**
     * Asserted by destination rather than by label. There are four ways to the
     * editor now — the nav's "Create resume", the hero and closing band's "Create
     * your resume", and the gallery's "Open the editor" — and the thing that must
     * hold is that every one of them arrives, not that they are worded alike.
     */
    const toEditor = page.locator('a[href="/resume-editor"]');
    await expect(toEditor.first()).toBeVisible();
    expect(await toEditor.count()).toBeGreaterThanOrEqual(3);

    expect(errors).toEqual([]);
  });

  /**
   * The argument the page makes about privacy has to survive contact with the
   * facts. Analytics and the webfont are both real, so the disclosure that names
   * them is not decoration — losing it silently is a regression.
   */
  test("states where the resume is kept, and discloses what is not local", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Stored in this browser")).toBeVisible();
    await expect(page.getByText(/page views are counted with Vercel Analytics/i)).toBeVisible();
  });

  /**
   * The hero's copy is server-rendered — the reveal is a CSS animation over
   * content that is already in the HTML, precisely so that a visitor whose JS is
   * slow or broken still reads the pitch.
   */
  test("the pitch is in the server HTML", async ({ request }) => {
    const html = await (await request.get("/")).text();

    expect(html).toContain("never uploads");
    expect(html).toContain("Create your resume");
  });

  test("the gallery drives the hero's sheet, and the tint drives it too", async ({ page }) => {
    await page.goto("/");

    const sheet = landingSheet(page);
    await expect(sheet.getByText("Iris Halloran")).toBeVisible();

    // Classic is the default, so its card is the one already previewing.
    const classic = page.getByRole("button", { name: "Classic" });
    await expect(classic).toContainText("Previewing");

    const timeline = page.getByRole("button", { name: "Timeline" });
    await timeline.click();
    await expect(timeline).toContainText("Previewing");
    await expect(classic).not.toContainText("Previewing");

    // Every template renders the same resume, so the name survives the switch.
    await expect(sheet.getByText("Iris Halloran")).toBeVisible();

    // The tint is the hero's own control and applies to whatever is showing.
    await page.getByRole("button", { name: "Tint Ochre" }).click();
    await expect(sheet.locator('[style*="rgb(138, 90, 18)"]').first()).toBeVisible();
  });

  /**
   * The swatch is a preview of a printed page, not a theme picker: it tints the
   * sheet and stops there. The page's own accent is fixed, and it is easy to
   * re-link the two by accident, because the sheet keeps working either way.
   */
  test("picking a colour tints the sheet and leaves the page alone", async ({ page }) => {
    await page.goto("/");

    const accent = () =>
      page
        .locator("[data-landing]")
        .evaluate((element) => getComputedStyle(element).getPropertyValue("--accent").trim());

    const before = await accent();
    // The solid pulled out of the signature ramp. Resolved from the shared
    // `--c-accent` HSL triple rather than written as a literal here — the editor's
    // `--brand` reads the same token, so the two surfaces cannot drift apart.
    expect(before).toBe("hsl(166 84% 27%)");

    await page.getByRole("button", { name: "Tint Indigo" }).click();

    // The sheet took the colour…
    await expect(landingSheet(page).locator('[style*="rgb(42, 58, 143)"]').first()).toBeVisible();
    // …and the page did not.
    expect(await accent()).toBe(before);
  });

  /**
   * next/image is served through the optimizer, which is backed by sharp. pnpm 10
   * skips dependency build scripts by default, so this fails if sharp is not in
   * pnpm.onlyBuiltDependencies.
   */
  test("next/image optimizes the GitHub logo", async ({ page }) => {
    await page.goto("/resume-editor");

    // The link moved into the header's overflow menu, so it is not in the DOM
    // until that opens.
    await openOverflowMenu(page);

    const logo = page.locator('img[src*="github-mark"]').first();
    await expect(logo).toBeVisible();

    // currentSrc is only populated once the browser has actually decoded it.
    await expect
      .poll(() => logo.evaluate((el: HTMLImageElement) => el.naturalWidth), {
        timeout: 10_000,
        message: "optimized image never loaded",
      })
      .toBeGreaterThan(0);

    const currentSrc = await logo.evaluate((el: HTMLImageElement) => el.currentSrc);
    expect(currentSrc).toContain("/_next/image");
  });
});
