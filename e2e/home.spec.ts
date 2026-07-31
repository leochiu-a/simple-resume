import { expect, test } from "@playwright/test";
import { collectConsoleErrors, landingSheet } from "./helpers";

test.describe("home page", () => {
  test("renders the hero and links to the editor", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Your resume never leaves your browser",
    );

    // Two of them: one in the nav, one in the hero. Both must reach the editor.
    const ctas = page.getByRole("link", { name: "Create resume" });
    await expect(ctas.first()).toBeVisible();
    for (const cta of await ctas.all()) {
      await expect(cta).toHaveAttribute("href", "/resume-editor");
    }

    expect(errors).toEqual([]);
  });

  /**
   * The argument the page makes about privacy has to survive contact with the
   * facts. Analytics and the webfont are both real, so the disclosure that names
   * them is not decoration — losing it silently is a regression.
   */
  test("states where the resume is kept, and discloses what is not local", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("This browser only")).toBeVisible();
    await expect(page.getByText(/page views are counted with Vercel Analytics/)).toBeVisible();
  });

  /**
   * The hero's copy is server-rendered — the reveal is a CSS animation over
   * content that is already in the HTML, precisely so that a visitor whose JS is
   * slow or broken still reads the pitch.
   */
  test("the pitch is in the server HTML", async ({ request }) => {
    const html = await (await request.get("/")).text();

    expect(html).toContain("never leaves");
    expect(html).toContain("Create resume");
  });

  test("the sheet renders the selected template, and both controls drive it", async ({ page }) => {
    await page.goto("/");

    const sheet = landingSheet(page);
    await expect(sheet.getByText("Iris Halloran")).toBeVisible();

    const caption = page.locator("figcaption");
    await expect(caption).toContainText("Classic, Pine");

    await page.getByRole("button", { name: "Timeline", exact: true }).click();
    await expect(caption).toContainText("Timeline");
    // Every template renders the same resume, so the name survives the switch.
    await expect(sheet.getByText("Iris Halloran")).toBeVisible();

    await page.getByRole("button", { name: "Tint Ochre" }).click();
    await expect(caption).toContainText("Timeline, Ochre");
  });

  /**
   * The colour picked for the sheet is also the page's accent, published as
   * `--ink`. That link is the one thing about the hero that is easy to break
   * without noticing, since the sheet keeps working either way.
   */
  test("picking a colour retints the page, not just the sheet", async ({ page }) => {
    await page.goto("/");

    const ink = () =>
      page
        .locator("[data-landing]")
        .evaluate((element) => getComputedStyle(element).getPropertyValue("--ink").trim());

    expect(await ink()).toBe("#094C42");

    await page.getByRole("button", { name: "Tint Indigo" }).click();
    expect(await ink()).toBe("#2A3A8F");
  });

  /**
   * next/image is served through the optimizer, which is backed by sharp. pnpm 10
   * skips dependency build scripts by default, so this fails if sharp is not in
   * pnpm.onlyBuiltDependencies.
   */
  test("next/image optimizes the GitHub logo", async ({ page }) => {
    await page.goto("/resume-editor");

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
