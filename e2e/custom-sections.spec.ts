import { expect, test, type Page } from "@playwright/test";

import { copyMarkdown, DOC_STORAGE_KEY, preview, selectTemplate } from "./helpers";

/**
 * A section the user names themselves — Certifications, Awards, Languages.
 *
 * The product ships six sections and people keep needing a seventh, so the
 * seventh is theirs. What is checked here is the whole of what one is: it can be
 * added, named, filled, hidden, reordered and deleted, it survives a reload, and
 * it reaches the Markdown export under its own heading.
 */

const addSection = (page: Page) => page.getByRole("button", { name: "Add a section" }).click();

/**
 * Names the section through the heading itself, which is where it is edited —
 * there is no separate field for it. Enter is what says "done" and puts the
 * heading back to text, so the assertions below can read it as a heading.
 */
const nameSection = async (page: Page, title: string) => {
  await page.getByLabel("Section heading").fill(title);
  await page.keyboard.press("Enter");
};

/**
 * The bullet field is a `contenteditable` whose lines are its child `div`s, so a
 * line break is `insertParagraph` rather than a typed `\n` — see
 * `LabeledBulletTextAreaField`. Filling it the way the browser does keeps the
 * separator the form stores between lines out of the test.
 */
const fillLines = async (page: Page, lines: string[]) => {
  // The custom section is the last one in the form, so its field is the last one.
  const field = page.locator("div[contenteditable]").last();

  await field.click();
  for (const [index, line] of lines.entries()) {
    if (index > 0) await page.keyboard.press("Enter");
    await page.keyboard.type(line);
  }
  // The write is debounced, and blurring is also what a user does next.
  await page.locator("body").click({ position: { x: 2, y: 2 } });
};

/**
 * Waits for the form's debounced write to reach storage.
 *
 * Every edit is saved 300ms after it stops, so a reload issued the moment after
 * typing races the save — and the failure looks exactly like a section that was
 * never persisted, which is the thing these tests are here to tell apart.
 */
const storedSections = (page: Page) =>
  page.evaluate((key) => {
    const doc = JSON.parse(localStorage.getItem(key) ?? "{}");

    return (doc.locales?.[doc.activeLang]?.customSections ?? []) as {
      title: string;
      description: string;
    }[];
  }, DOC_STORAGE_KEY);

const waitForStoredTitle = (page: Page, title: string) =>
  expect
    .poll(async () => (await storedSections(page)).map((section) => section.title))
    .toContain(title);

/** The lines are written after the heading, so they are what a reload has to wait for. */
const waitForStoredLine = (page: Page, line: string) =>
  expect
    .poll(async () => (await storedSections(page)).map((section) => section.description).join("\n"))
    .toContain(line);

const section = (page: Page, title: string) => page.getByRole("heading", { name: title });

/** The whole section block a heading belongs to — its fields and its Delete. */
const sectionBlock = (page: Page, title: string) =>
  page.locator("#resume-form section").filter({ has: section(page, title) });

test.describe("custom sections", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/resume-editor");
  });

  test("adds a section, names it, and keeps it across a reload", async ({ page }) => {
    await addSection(page);

    /* A new one arrives already named and opens on its heading input, focused, with
       that default selected — so naming it is typing over it, not clearing a box. */
    const heading = page.getByLabel("Section heading");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveValue("New section");

    await nameSection(page, "Certifications");
    await expect(section(page, "Certifications")).toBeVisible();

    await fillLines(page, ["AWS Solutions Architect", "Certified Kubernetes Administrator"]);
    await waitForStoredLine(page, "Certified Kubernetes Administrator");

    await page.reload();

    await expect(section(page, "Certifications")).toBeVisible();
    await expect(page.getByText("AWS Solutions Architect")).toBeVisible();
    await expect(page.getByText("Certified Kubernetes Administrator")).toBeVisible();
  });

  test("reaches the Markdown export under its own heading", async ({ page }) => {
    await addSection(page);
    await nameSection(page, "Certifications");
    await fillLines(page, ["AWS Solutions Architect", "Certified Kubernetes Administrator"]);

    await copyMarkdown(page);
    const markdown = await page.evaluate(() => navigator.clipboard.readText());

    expect(markdown).toContain("## Certifications");
    expect(markdown).toContain("- AWS Solutions Architect");
    expect(markdown).toContain("- Certified Kubernetes Administrator");
    // It was added at the bottom, so it comes after the sections that were there.
    expect(markdown.indexOf("## Education")).toBeLessThan(markdown.indexOf("## Certifications"));
  });

  test("hiding one takes it out of the export and leaves the rest alone", async ({ page }) => {
    await addSection(page);
    await nameSection(page, "Certifications");
    await fillLines(page, ["AWS Solutions Architect"]);

    await sectionBlock(page, "Certifications")
      .getByRole("button", { name: "Hide section" })
      .click();

    await copyMarkdown(page);
    const markdown = await page.evaluate(() => navigator.clipboard.readText());

    expect(markdown).not.toContain("Certifications");
    expect(markdown).not.toContain("AWS Solutions Architect");
    expect(markdown).toContain("## Skills");
  });

  test("deleting one takes it out of the form and the order", async ({ page }) => {
    await addSection(page);
    await nameSection(page, "Certifications");

    await waitForStoredTitle(page, "Certifications");
    await sectionBlock(page, "Certifications").getByRole("button", { name: "Delete" }).click();

    await expect(section(page, "Certifications")).toBeHidden();
    await expect.poll(async () => (await storedSections(page)).length).toBe(0);

    await page.reload();
    await expect(section(page, "Certifications")).toBeHidden();
  });

  test("is named by its own heading in the reorder list", async ({ page }) => {
    await addSection(page);
    await nameSection(page, "Certifications");

    /* Reordering is pointer-only and the grips are not focusable, so the press is
       a real one — see `section-order.spec.ts`. */
    const grip = sectionBlock(page, "Certifications").locator("[data-drag-handle]");
    await grip.scrollIntoViewIfNeeded();

    const box = (await grip.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();

    const popover = page.locator("[data-section-order-popover]");

    await expect(popover).toBeVisible();
    // Named by the heading the user gave it, not by an id.
    await expect(popover.getByText("Certifications")).toBeVisible();

    await page.mouse.up();
  });

  test("appears on the sheet, and stays there through a change of template", async ({ page }) => {
    await addSection(page);
    await nameSection(page, "Certifications");
    await fillLines(page, ["AWS Solutions Architect", "Certified Kubernetes Administrator"]);

    const sheet = preview(page).locator("[data-resume-page]").first();

    await expect(sheet).toContainText("Certifications");
    await expect(sheet).toContainText("AWS Solutions Architect");

    /* Every template lays a custom section out in its flow, so switching to one
       with a sidebar must not lose it — a section the user invented has no place
       in a sidebar's design, and it is drawn in the main column instead. */
    await selectTemplate(page, "Modern");

    await expect(sheet).toContainText("Certifications");
    await expect(sheet).toContainText("Certified Kubernetes Administrator");
  });

  test("is left off the sheet until it has a heading", async ({ page }) => {
    await addSection(page);
    // The default name has to go for there to be a section with no heading at all.
    await page.getByLabel("Section heading").fill("");
    await fillLines(page, ["AWS Solutions Architect"]);

    const sheet = preview(page).locator("[data-resume-page]").first();

    await expect(sheet).not.toContainText("AWS Solutions Architect");

    await nameSection(page, "Certifications");

    await expect(sheet).toContainText("Certifications");
    await expect(sheet).toContainText("AWS Solutions Architect");
  });

  test("renames from the heading, through the pencil beside it", async ({ page }) => {
    await addSection(page);
    await nameSection(page, "Certifications");

    await sectionBlock(page, "Certifications")
      .getByRole("button", { name: "Rename section" })
      .click();

    const input = page.getByLabel("Section heading");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("Certifications");

    await input.fill("Awards");
    await page.keyboard.press("Enter");

    await expect(section(page, "Awards")).toBeVisible();
    await expect(page.getByLabel("Section heading")).toBeHidden();
  });

  test("stays on the input while there is no name to fall back to", async ({ page }) => {
    await addSection(page);

    await page.getByLabel("Section heading").fill("  ");
    await page.keyboard.press("Enter");

    await expect(page.getByLabel("Section heading")).toBeVisible();
  });
});
