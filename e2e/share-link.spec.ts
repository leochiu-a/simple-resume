import { expect, test, type Page } from "@playwright/test";

import { collectConsoleErrors, copyShareLink } from "./helpers";

/**
 * The share link is the one export that has to survive a round trip through
 * something outside the app — a chat window, an inbox — and come back as a
 * readable resume. So these tests always go the whole way: copy the link out of
 * the editor, navigate to it as a stranger would, and assert on what the shared
 * page actually renders.
 *
 * The payload lives in the fragment, which is exactly what makes the round trip
 * worth testing: nothing on the server can compensate for a link that arrives
 * truncated, because the server never sees this part of the URL.
 */

const readClipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

/**
 * The sheet on the shared page — a sandboxed iframe holding the exported HTML.
 * There is only ever one iframe on this page, and its title is built from the
 * resume's own name, so matching the element rather than its title keeps this
 * usable for the payload whose name is deliberately hostile markup.
 */
const sharedSheet = (page: Page) => page.frameLocator("iframe");

/**
 * Copies the link and waits for the item to confirm it before reading the
 * clipboard.
 *
 * The write is async — the URL is compressed through a CompressionStream first —
 * so reading the clipboard straight after the click is a race that only shows up
 * under load. The item's own tick is the signal that the write finished, which is
 * the same thing a user waits for.
 */
const getShareLink = async (page: Page) => {
  await copyShareLink(page);
  await expect(page.getByRole("menuitem", { name: "Copy share link" })).toHaveAttribute(
    "data-copied",
    "true",
  );

  return readClipboard(page);
};

test.describe("Share link", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/resume-editor");
  });

  test("round-trips the resume through a URL and renders it", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const link = await getShareLink(page);

    // The resume must be in the fragment, not the query: a query string is sent
    // to the server and written to its logs, which is the one thing this feature
    // must never do.
    const url = new URL(link);
    expect(url.pathname).toBe("/r");
    expect(url.search).toBe("");
    expect(url.hash).toMatch(/^#r=[\w-]+$/);

    await page.goto(link);

    const sheet = sharedSheet(page);
    await expect(sheet.getByRole("heading", { name: "My Name" })).toBeVisible();
    await expect(sheet.getByText("Senior job")).toBeVisible();
    await expect(sheet.getByText("good@gmail.com")).toBeVisible();
    await expect(sheet.getByText("TypeScript")).toBeVisible();
    await expect(sheet.getByText("Senior Engineer")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("keeps the URL short enough to paste anywhere", async ({ page }) => {
    const link = await getShareLink(page);

    /*
      The real ceiling is not the browser (Chrome allows megabytes) but the chat
      clients in between: Slack starts splitting a URL over roughly 4000
      characters, which produces a link that looks clickable and is not.

      Compression is what buys the headroom — the default resume is ~4.5 KB of
      JSON — so this guards the encoding, not the resume. If someone swaps
      `deflate-raw` for plain base64, base64 alone would clear this budget for a
      long resume and this is what would say so.
    */
    expect(link.length).toBeLessThan(4000);
  });

  test("sends nothing to the server: the payload never leaves the browser", async ({ page }) => {
    const link = await getShareLink(page);
    const payload = new URL(link).hash.slice(1);

    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));

    await page.goto(link);
    await expect(sharedSheet(page).getByRole("heading", { name: "My Name" })).toBeVisible();

    // Every request the page made, including the document itself, must be free of
    // the resume. Browsers strip the fragment before sending — this asserts that
    // nothing in the app puts it back.
    expect(requests.length).toBeGreaterThan(0);
    for (const url of requests) expect(url).not.toContain(payload);
  });

  test("renders the template and colour the link was made with", async ({ page }) => {
    // Encoded directly rather than driven through the appearance panel: what is
    // under test is that the options survive the URL, not how they are picked.
    await page.goto("/r#r=placeholder");
    const link = await page.evaluate(async () => {
      const envelope = {
        v: 1,
        resume: {
          name: "Ada Lovelace",
          wantedJob: "Analyst",
          city: "London",
          phone: "",
          email: "ada@example.com",
          profile: "First programmer.",
          socialLinks: [],
          skills: [{ name: "Mathematics" }],
          educations: [],
          employmentHistory: [],
          projects: [],
          visibility: {
            profile: true,
            socialLinks: true,
            skills: true,
            educations: true,
            employmentHistory: true,
            projects: true,
          },
        },
        templateId: "formal",
        backgroundColor: "#7B1FA2",
      };

      const stream = new Blob([JSON.stringify(envelope)])
        .stream()
        .pipeThrough(new CompressionStream("deflate-raw"));
      const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      return `${location.origin}/r#r=${encoded}`;
    });

    await page.goto(link);

    const sheet = sharedSheet(page);
    await expect(sheet.getByRole("heading", { name: "Ada Lovelace" })).toBeVisible();
    // Formal tints the name rather than a sidebar, so the colour is observable there.
    await expect(sheet.getByRole("heading", { name: "Ada Lovelace" })).toHaveCSS(
      "color",
      "rgb(123, 31, 162)",
    );
  });

  test("explains itself instead of breaking on a link that lost its payload", async ({ page }) => {
    // What a chat client that wrapped the URL actually delivers.
    const link = await getShareLink(page);
    const truncated = link.slice(0, link.length - 250);

    await page.goto(truncated);
    await expect(page.getByText(/could not be read/i)).toBeVisible();

    // And the case where the fragment was dropped altogether.
    await page.goto("/r");
    await expect(page.getByText(/no resume in it/i)).toBeVisible();
  });

  test("does not let a hand-written payload run script", async ({ page }) => {
    await page.goto("/r#r=placeholder");
    const link = await page.evaluate(async () => {
      const attack = '<img src=x onerror="window.top.__pwned = true">';
      const envelope = {
        v: 1,
        resume: {
          name: attack,
          wantedJob: attack,
          city: "",
          phone: "",
          email: "",
          // javascript: URLs must be dropped by the builder's own sanitiser.
          profile: attack,
          socialLinks: [{ name: attack, url: "javascript:window.top.__pwned = true" }],
          skills: [],
          educations: [],
          employmentHistory: [],
          projects: [],
          visibility: {
            profile: true,
            socialLinks: true,
            skills: true,
            educations: true,
            employmentHistory: true,
            projects: true,
          },
        },
        templateId: "classic",
        backgroundColor: "#094C42",
      };

      const stream = new Blob([JSON.stringify(envelope)])
        .stream()
        .pipeThrough(new CompressionStream("deflate-raw"));
      const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      return `${location.origin}/r#r=${encoded}`;
    });

    await page.goto(link);

    /*
      The attack string arrives as the heading's *text*, which is the proof it was
      escaped rather than parsed: had it been parsed, the `<img>` would be an
      element and the heading would read empty. The payload appears in several
      fields, so this asserts on the one whose role pins it down.
    */
    const heading = sharedSheet(page).getByRole("heading", { level: 1 });
    await expect(heading).toHaveText('<img src=x onerror="window.top.__pwned = true">');
    await expect(sharedSheet(page).locator("img")).toHaveCount(0);
    expect(await page.evaluate(() => "__pwned" in window)).toBe(false);

    // The iframe carries no allow-scripts, so even a bypass of the escaping has
    // nowhere to execute.
    await expect(page.locator("iframe")).toHaveAttribute("sandbox", "");
  });
});
