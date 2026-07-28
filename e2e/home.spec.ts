import { expect, test } from "@playwright/test";
import { collectConsoleErrors, sparkles } from "./helpers";

test.describe("home page", () => {
  test("renders the hero and links to the editor", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");

    // SparklesText renders a <strong>, not a heading element.
    await expect(page.locator("main strong")).toHaveText("Simple Resume");
    await expect(page.getByText("A online tool to create a resume")).toBeVisible();

    const cta = page.getByRole("link", { name: "Create Resume" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/resume-editor");

    expect(errors).toEqual([]);
  });

  /**
   * The server must render zero sparkles so the client's first render matches.
   * This is the invariant that makes the removed `isMounted` gate unnecessary:
   * sparkles are generated in an effect, which never runs during SSR.
   */
  test("server renders no sparkles, so hydration cannot mismatch", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();

    expect(html).toContain("Simple Resume");
    expect(html).not.toMatch(/--sparkles-first-color[^>]*>\s*<span[^>]*>\s*<svg/);
    // The sparkle SVGs carry this class combination and must be absent server-side.
    expect(html).not.toContain('class="pointer-events-none absolute z-20"');
  });

  test("sparkles appear after hydration and keep animating", async ({ page }) => {
    await page.goto("/");

    await expect(sparkles(page).first()).toBeVisible();
    await expect(sparkles(page)).toHaveCount(10);

    // Positions are regenerated on an interval; the rendered set must change.
    const snapshot = () =>
      sparkles(page).evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute("style")).join("|")
      );

    const first = await snapshot();
    await expect
      .poll(snapshot, { timeout: 5_000, message: "sparkle positions never changed" })
      .not.toBe(first);
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
