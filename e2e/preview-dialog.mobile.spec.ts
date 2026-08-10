import { expect, test, type Page } from "@playwright/test";
import { expectBodyUnlocked, readPdfFacts } from "./helpers";

/**
 * Regression guard for the bug this branch fixed.
 *
 * Under React 19, the react-remove-scroll 2.6.0 that shipped with Radix 1.1.2
 * never ran its cleanup, so closing this dialog left `data-scroll-locked="1"`
 * and `pointer-events: none` on <body>. The page was then impossible to scroll
 * or click, with no error in the console. Updating Radix pulled in
 * react-remove-scroll 2.7.2 and restored the React 18 behaviour.
 *
 * The narrow viewport matters: the dialog only exists in the mobile layout.
 */

/**
 * The preview dialog specifically, not "whatever has role=dialog".
 *
 * The appearance panel is a Radix popover, and a Radix popover is also
 * `role="dialog"` — inside this dialog on mobile, so a bare `getByRole("dialog")`
 * matches two things and `toBeHidden()` fails against whichever is still open.
 * Anchored on the title text, which only the preview dialog has.
 */
const previewDialog = (page: Page) => page.getByRole("dialog", { name: "Resume preview" });

test.describe("mobile preview dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("opens, and fully releases the scroll lock on close", async ({ page }) => {
    const open = page.getByRole("button", { name: "Preview & Download" });
    await expect(open).toBeVisible();

    await open.click();

    const dialog = previewDialog(page);
    await expect(dialog).toBeVisible();
    // While open, locking the body is the correct behaviour.
    await expect(page.locator("body")).toHaveAttribute("data-scroll-locked", "1");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await expectBodyUnlocked(page);
  });

  test("page still scrolls after the dialog has been closed", async ({ page }) => {
    await page.getByRole("button", { name: "Preview & Download" }).click();
    await expect(previewDialog(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(previewDialog(page)).toBeHidden();

    /*
      The editing column is what scrolls now, not the window.

      The editor shell is a fixed-height flex column so the form and the preview
      can own their scrolling independently, which means `window.scrollY` stays 0
      no matter how much you scroll — it is not the scroller any more. What this
      test is actually guarding is unchanged though: that closing the dialog
      releases react-remove-scroll's lock and scrolling works again. So it asks
      the element that really scrolls.
    */
    const column = page.locator("[data-editor-column]");
    await column.evaluate((el) => el.scrollTo(0, 0));
    await page.mouse.move(250, 400);
    await page.mouse.wheel(0, 600);

    await expect
      .poll(() => column.evaluate((el) => el.scrollTop), {
        timeout: 5_000,
        message: "the editing column did not scroll after the dialog closed",
      })
      .toBeGreaterThan(0);
  });

  test("page is still clickable after the dialog has been closed", async ({ page }) => {
    await page.getByRole("button", { name: "Preview & Download" }).click();
    await expect(previewDialog(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(previewDialog(page)).toBeHidden();

    // A real click has to reach the form, not a pointer-events: none overlay.
    const city = page.getByRole("textbox").nth(4);
    await city.click();
    await city.fill("Kaohsiung");
    await expect(city).toHaveValue("Kaohsiung");
  });

  test("downloads the PDF from inside the dialog", async ({ page }) => {
    await page.getByRole("button", { name: "Preview & Download" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    // The dialog header carries the same Export dropdown the nav does.
    await dialog.getByRole("button", { name: "Export", exact: true }).click();
    await page.getByRole("menuitem", { name: "Download PDF" }).click();
    const download = await downloadPromise;

    const pdf = readPdfFacts((await download.path())!);
    expect(pdf.header).toBe("%PDF-1.3");
    expect(pdf.pages).toBe(1);
    expect(pdf.embeddedFonts).toHaveLength(3);
  });
});
