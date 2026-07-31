import { expect, test } from "@playwright/test";
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
test.describe("mobile preview dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("opens, and fully releases the scroll lock on close", async ({ page }) => {
    const open = page.getByRole("button", { name: "Preview & Download" });
    await expect(open).toBeVisible();

    await open.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // While open, locking the body is the correct behaviour.
    await expect(page.locator("body")).toHaveAttribute("data-scroll-locked", "1");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await expectBodyUnlocked(page);
  });

  test("page still scrolls after the dialog has been closed", async ({ page }) => {
    await page.getByRole("button", { name: "Preview & Download" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(250, 400);
    await page.mouse.wheel(0, 600);

    await expect
      .poll(() => page.evaluate(() => window.scrollY), {
        timeout: 5_000,
        message: "page did not scroll after the dialog closed",
      })
      .toBeGreaterThan(0);
  });

  test("page is still clickable after the dialog has been closed", async ({ page }) => {
    await page.getByRole("button", { name: "Preview & Download" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

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
    // The dialog header carries the same Download dropdown the nav does.
    await dialog.getByRole("button", { name: "Download", exact: true }).click();
    await page.getByRole("menuitem", { name: "Download PDF" }).click();
    const download = await downloadPromise;

    const pdf = readPdfFacts((await download.path())!);
    expect(pdf.header).toBe("%PDF-1.3");
    expect(pdf.pages).toBe(1);
    expect(pdf.embeddedFonts).toHaveLength(3);
  });
});
