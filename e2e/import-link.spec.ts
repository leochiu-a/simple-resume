import { expect, test, type Page } from "@playwright/test";

import { collectConsoleErrors, copyShareLink, openImportDialog, preview } from "./helpers";

/**
 * Importing is the other half of the share link: the resume travels inside the
 * URL, so reading one back is decoding rather than fetching.
 *
 * These tests drive the real round trip — copy a link out of the editor, change
 * the resume, then import the link and check the editor is showing what the link
 * carried. Anything less would test the decoder, which the share-link spec already
 * covers; what is worth testing here is that the imported resume actually reaches
 * the form, the preview and storage.
 */

const readClipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

/**
 * The resume's own name field. Addressed by its form name rather than its label:
 * "Name" also matches the social-link and project name inputs, and the point of
 * these tests is which resume is loaded, not which field is labelled what.
 */
const nameField = (page: Page) => page.locator('input[name="name"]');

const getShareLink = async (page: Page) => {
  await copyShareLink(page);
  await expect(page.getByRole("menuitem", { name: "Copy share link" })).toHaveAttribute(
    "data-copied",
    "true",
  );
  // The menu stays open to confirm the copy; close it before driving anything else.
  await page.keyboard.press("Escape");

  return readClipboard(page);
};

test.describe("Import from a share link", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/resume-editor");
  });

  test("brings back the resume a link was made from", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const link = await getShareLink(page);

    // Change the resume, so a successful import is visible as a change back rather
    // than as the absence of one.
    await nameField(page).fill("Someone Else");
    await expect(preview(page).getByText("Someone Else")).toBeVisible();

    const dialog = await openImportDialog(page);
    await dialog.getByLabel("Share link").fill(link);

    // The dialog previews what it found, which is what makes the confirmation
    // meaningful — the URL itself is unreadable.
    await expect(dialog.getByText(/Found/)).toContainText("My Name");

    await dialog.getByRole("button", { name: "Replace my resume" }).click();

    // The form, the preview and storage must all agree afterwards.
    await expect(nameField(page)).toHaveValue("My Name");
    await expect(preview(page).getByText("My Name")).toBeVisible();
    await expect(preview(page).getByText("Someone Else")).toBeHidden();

    const stored = await page.evaluate(() => {
      const raw = window.localStorage.getItem("resume-doc");

      if (!raw) return null;
      // Through the primary rather than a hard-coded key: this test is about the
      // import landing, not about which language a fresh document is labelled.
      const doc = JSON.parse(raw);

      return doc.locales[doc.primaryLang].name;
    });
    expect(stored).toBe("My Name");

    expect(errors).toEqual([]);
  });

  test("accepts a link however it arrived", async ({ page }) => {
    const link = await getShareLink(page);
    const hashOnly = `#${new URL(link).hash.slice(1)}`;

    for (const variant of [
      `  ${link}  `, // copied with surrounding whitespace
      `<${link}>`, // wrapped by a mail client
      hashOnly, // only the tail was grabbed
    ]) {
      const dialog = await openImportDialog(page);
      await dialog.getByLabel("Share link").fill(variant);
      // Each of these describes the same resume, so each must be recognised rather
      // than made the user's problem.
      await expect(dialog.getByText(/Found/)).toContainText("My Name");
      await dialog.getByRole("button", { name: "Cancel" }).click();
    }
  });

  test("refuses to import something that is not a share link", async ({ page }) => {
    const dialog = await openImportDialog(page);
    const confirm = dialog.getByRole("button", { name: "Replace my resume" });

    // Nothing typed yet: there is nothing to import, so the button must not offer.
    await expect(confirm).toBeDisabled();

    await dialog.getByLabel("Share link").fill("https://example.com/not-a-share-link");
    await expect(dialog.getByText(/does not look like a share link/i)).toBeVisible();
    await expect(confirm).toBeDisabled();
  });

  test("does not overwrite the resume until it is confirmed", async ({ page }) => {
    const link = await getShareLink(page);
    await nameField(page).fill("Keep Me");

    const dialog = await openImportDialog(page);
    await dialog.getByLabel("Share link").fill(link);
    await expect(dialog.getByText(/Found/)).toContainText("My Name");

    // Cancelling is the whole point of the dialog: importing replaces work.
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(nameField(page)).toHaveValue("Keep Me");

    // And the box does not reopen holding the previous link, or a preview of a
    // resume the user decided not to import.
    const reopened = await openImportDialog(page);
    await expect(reopened.getByLabel("Share link")).toHaveValue("");
    await expect(reopened.getByRole("button", { name: "Replace my resume" })).toBeDisabled();
  });
});
