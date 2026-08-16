import { expect, test, type Page } from "@playwright/test";
import { collectConsoleErrors } from "./helpers";

/**
 * The writing guide's figures animate when they are scrolled to, which is the whole
 * explanation — the page argues by showing the change rather than asserting it.
 *
 * Both things asserted here have already been wrong once. The figures first played
 * at `threshold: 0.25` against the bottom of the viewport, so each one ran while it
 * was still a quarter visible at the very bottom of the screen and finished before
 * the reader's eye arrived; it reads as "the animation is too fast" and is really
 * "the animation already happened". And they played once ever, so missing one meant
 * missing it for good.
 *
 * `data-played` is the whole mechanism — the CSS hangs off it — so it is what gets
 * asserted. Note that a hidden page gets no IntersectionObserver callbacks at all,
 * which is why this has to be a real browser test rather than a check in a pane.
 */

const guideFigure = (page: Page, index: number) => page.locator("main figure").nth(index);

test.describe("writing guide", () => {
  test("figures wait until they are properly on screen, and replay on the way back", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/how-to-write-a-resume");

    const figure = guideFigure(page, 3);

    // Nothing has played on arrival: the first figure is already below the band.
    await expect(page.locator("main figure[data-played]")).toHaveCount(0);

    await figure.scrollIntoViewIfNeeded();
    await figure.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await expect(figure).toHaveAttribute("data-played", "");

    // Scrolled well past, it is disarmed rather than left in its played state.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(figure).not.toHaveAttribute("data-played", "");

    // And coming back runs it again.
    await figure.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await expect(figure).toHaveAttribute("data-played", "");

    expect(errors).toEqual([]);
  });

  /**
   * The prose is the reason anyone can read this page at all — the figures are set
   * at reading size precisely because a rendered A4 sheet in a column was not. All
   * six edits ship in the server HTML rather than arriving with the animation.
   */
  test("every edit is in the server HTML", async ({ request }) => {
    const html = await (await request.get("/how-to-write-a-resume")).text();

    for (const id of [
      "name-the-job",
      "cut-the-objective",
      "most-recent-first",
      "verb-and-number",
      "cut-the-soup",
      "top-third",
    ]) {
      expect(html).toContain(`id="${id}"`);
    }

    // The struck line, verbatim. Deliberately not the rewritten one: that is split
    // into a span per word so the words can arrive one at a time, so it is not a
    // contiguous string in the source even though it reads as one on the page.
    expect(html).toContain("Helped to reduce infrastructure costs");
  });
});
