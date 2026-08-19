import { expect, test, type Page } from "@playwright/test";

/**
 * The one thing analytics must never do here.
 *
 * A share link carries the whole resume in its fragment, and that is only
 * private because browsers do not put a fragment on the wire. The analytics
 * script is not the browser — it is JavaScript in the page, where
 * `location.href` includes the fragment and is exactly what a pageview reports.
 * Without the `beforeSend` in `components/analytics`, opening a shared resume
 * would post that resume to an analytics endpoint.
 *
 * Nothing about that is visible: no error, no failing assertion anywhere else,
 * and the leak only exists on a deployment where the script actually loads. So
 * it is asserted directly, on the function the page registers.
 *
 * The script itself never loads off Vercel, which is why this reaches for the
 * queue the stub fills rather than watching the network. `window.va` pushes
 * `["beforeSend", fn]` into `window.vaq` until the real script drains it — so
 * the function under test is the one the deployed script would be handed.
 */
const beforeSend = async (page: Page, url: string) =>
  page.evaluate((candidate) => {
    const queue = (window as unknown as { vaq?: [string, unknown?][] }).vaq ?? [];
    const entry = queue.find(([name]) => name === "beforeSend");
    if (!entry) return { registered: false, cancelled: false, url: null };

    const sanitize = entry[1] as (event: { type: string; url: string }) => { url: string } | null;
    const sent = sanitize({ type: "pageview", url: candidate });

    return { registered: true, cancelled: sent === null, url: sent?.url ?? null };
  }, url);

test.describe("analytics", () => {
  test("never reports the fragment a shared resume travels in", async ({ page }) => {
    await page.goto("/r#r=eyJ2IjoxfQ-a-payload-standing-in-for-somebodys-resume");

    const sent = await beforeSend(page, page.url());

    expect(sent.registered).toBe(true);
    expect(sent.url).not.toContain("#");
    expect(sent.url).not.toContain("payload");
    expect(new URL(sent.url!).pathname).toBe("/r");
  });

  test("never reports a query string either", async ({ page }) => {
    await page.goto("/resume-editor");

    const sent = await beforeSend(
      page,
      "https://example.com/resume-editor?template=modern&tint=abc",
    );

    expect(sent.url).toBe("https://example.com/resume-editor");
  });

  /* Fails closed. `beforeSend` runs inside the analytics script, and what that
     script does with a thrown exception is its business, not this repo's — so a
     URL that cannot be parsed is cancelled rather than left to it. */
  test("cancels the event rather than passing a URL it could not parse", async ({ page }) => {
    await page.goto("/resume-editor");

    const sent = await beforeSend(page, "not-a-url#r=a-payload-standing-in-for-a-resume");

    expect(sent.registered).toBe(true);
    expect(sent.cancelled).toBe(true);
    expect(sent.url).toBeNull();
  });
});
