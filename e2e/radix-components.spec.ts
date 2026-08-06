import { expect, test } from "@playwright/test";
import { expectBodyUnlocked, openColorPicker, openOverflowMenu, preview } from "./helpers";

/**
 * The Radix UI packages were updated as part of the React 19 upgrade, so each
 * overlay primitive the app uses is exercised here — opening it, and confirming
 * it tears its <body> side effects down again.
 */
test.describe("Radix overlays", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("overflow menu opens and switches the theme", async ({ page }) => {
    // Theme is no longer its own button in the bar — it is three items inside the
    // overflow menu, alongside the on-device AI row and the GitHub link.
    await openOverflowMenu(page);

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Light", exact: true })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Dark", exact: true })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "System", exact: true })).toBeVisible();

    await menu.getByRole("menuitem", { name: "Light", exact: true }).click();

    await expect(page.locator("html")).toHaveClass(/light/);
    await expect(menu).toBeHidden();
    await expectBodyUnlocked(page);
  });

  test("month picker popover opens and closes on Escape", async ({ page }) => {
    // Scoped to the form: the appearance panel over the preview is a dialog
    // trigger too, and so is the on-device AI row inside the overflow menu.
    const trigger = page.locator('#resume-form button[aria-haspopup="dialog"]').first();
    await trigger.click();

    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await expect(popover).toBeVisible();
    await expect(popover.getByText("Jan", { exact: true })).toBeVisible();
    await expect(popover.getByText("Dec", { exact: true })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
    await expectBodyUnlocked(page);
  });

  test("visibility switch toggles", async ({ page }) => {
    const toggle = page.getByRole("switch").first();

    await expect(toggle).toHaveAttribute("data-state", "unchecked");
    await toggle.click();
    await expect(toggle).toHaveAttribute("data-state", "checked");
  });
});

test.describe("background colour picker", () => {
  test("changing the colour repaints the preview sidebar", async ({ page }) => {
    await page.goto("/resume-editor");

    // The sidebar is the only element in the preview with a coloured background.
    const sidebar = preview(page).locator('[style*="background-color"]').nth(1);
    await expect(sidebar).toBeVisible();

    await openColorPicker(page);

    const sketch = page.locator(".w-color-sketch");
    await expect(sketch).toBeVisible();

    const hexInput = sketch.locator("input").first();
    await expect(hexInput).toHaveValue(/^[0-9A-Fa-f]{6}$/);

    // Not `fill()`: the picker's input moves the caret to the end whenever it
    // takes focus, which lands after the select-all that `fill()` relies on and
    // makes it append instead of replace. Selecting and typing is what a person
    // does anyway.
    await hexInput.click();
    await hexInput.press("ControlOrMeta+a");
    await hexInput.pressSequentially("CC3366");
    await hexInput.press("Enter");

    await expect(sidebar).toHaveAttribute("style", /rgb\(204,\s*51,\s*102\)/);
  });

  test("picker closes again and leaves the page interactive", async ({ page }) => {
    await page.goto("/resume-editor");

    await openColorPicker(page);
    await expect(page.locator(".w-color-sketch")).toBeVisible();

    // There is no click-catcher overlay any more, and that is the point of this
    // assertion. The picker used to float over the sheet and needed a
    // `fixed inset-0` div to dismiss it — an overlay that, left behind, froze the
    // whole page. It now renders inline inside the appearance panel, so "Custom…"
    // simply toggles it off and there is no overlay to strand.
    await page.getByRole("button", { name: "Custom…" }).click();

    await expect(page.locator(".w-color-sketch")).toBeHidden();
    await expectBodyUnlocked(page);

    await expect(page.locator("div.fixed.inset-0")).toHaveCount(0);
    await openColorPicker(page);
    await expect(page.locator(".w-color-sketch")).toBeVisible();
  });
});
