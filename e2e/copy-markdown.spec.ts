import { expect, test, type Locator, type Page } from "@playwright/test";

import { copyMarkdown, downloadMenu } from "./helpers";

/**
 * The Markdown export never touches disk — it goes straight to the clipboard —
 * so these tests read it back out of the clipboard, which is the only place it
 * ever exists.
 */
const readClipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

const exportMarkdown = async (page: Page) => {
  await copyMarkdown(page);

  return readClipboard(page);
};

test.describe("Copy as Markdown", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/resume-editor");
  });

  test("copies the resume as structured Markdown", async ({ page }) => {
    const markdown = await exportMarkdown(page);

    expect(markdown).toContain("# My Name");
    expect(markdown).toContain("Senior job");
    expect(markdown).toContain("Taipei · 0123456789 · good@gmail.com");
    expect(markdown).toContain("[Github](https://github.com)");
    expect(markdown).toContain("## Profile");
    expect(markdown).toContain("## Skills\n\nTypeScript, React, Next.js, GraphQL, Redux");
    expect(markdown).toContain("## Employment History");
    expect(markdown).toContain("### Senior Engineer — Google");
    expect(markdown).toContain("Jan 2018 — Jan 2020");
    // Bullets are one string in storage, split on SPLIT_TEXT into a list here.
    expect(markdown).toContain("- A,B,C,D");
    expect(markdown).toContain("## Education");
    expect(markdown).toContain("### University of California");
    expect(markdown).toContain("Bachelor, Computer Science");
  });

  test("picks up edits and leaves hidden sections out", async ({ page }) => {
    await page.locator('input[name="name"]').fill("Ada Lovelace");
    // The eye next to a section heading is what hides it from the preview and
    // every export. Named rather than positional: the heading also carries the
    // rewrite trigger, so "the button in this heading" is now ambiguous.
    await page
      .getByRole("heading", { name: "Profile" })
      .getByRole("button", { name: "Hide section" })
      .click();

    const markdown = await exportMarkdown(page);

    expect(markdown).toContain("# Ada Lovelace");
    expect(markdown).not.toContain("## Profile");
    // Only the hidden one goes; the rest of the document is untouched.
    expect(markdown).toContain("## Skills");
  });

  /**
   * "Copy as Markdown" becomes "✓ Copied", and the two labels share one grid
   * cell so the item cannot resize under the pointer that just used it.
   *
   * Measured with `offsetWidth` rather than `boundingBox()`: the menu opens with
   * a scale animation, and a bounding box read mid-flight reports the scaled size.
   */
  const layoutSize = (item: Locator) =>
    item.evaluate((element: HTMLElement) => [element.offsetWidth, element.offsetHeight]);

  test("confirms the copy without moving the menu", async ({ page }) => {
    await downloadMenu(page).click();
    const item = page.getByRole("menuitem", { name: "Copy as Markdown" });
    const before = await layoutSize(item);

    await item.click();

    await expect(item).toHaveAttribute("data-copied", "true");
    await expect(item.getByText("Copied")).toBeVisible();
    expect(await layoutSize(item)).toEqual(before);
  });
});
