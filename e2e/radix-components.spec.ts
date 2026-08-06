import { expect, test } from "@playwright/test";
import { expectBodyUnlocked, openColorPicker, preview, themeToggle } from "./helpers";

/**
 * The Radix UI packages were updated as part of the React 19 upgrade, so each
 * overlay primitive the app uses is exercised here — opening it, and confirming
 * it tears its <body> side effects down again.
 */
test.describe("Radix overlays", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("theme dropdown opens and switches the theme", async ({ page }) => {
    await themeToggle(page).click();

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem")).toHaveText(["Light", "Dark", "System"]);

    await menu.getByRole("menuitem", { name: "Light" }).click();

    await expect(page.locator("html")).toHaveClass(/light/);
    await expect(menu).toBeHidden();
    await expectBodyUnlocked(page);
  });

  test("month picker popover opens and closes on Escape", async ({ page }) => {
    // Scoped to the form: the nav's on-device AI popover is a dialog trigger too,
    // and it comes first in the document.
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

    // The picker is dismissed by its own full-screen click-catcher overlay.
    // It carries no z-index, so the sticky nav (z-10) still sits on top of it —
    // the click has to land below the nav for the overlay to receive it.
    await page.locator("div.fixed.inset-0").click({ position: { x: 200, y: 500 } });

    await expect(page.locator(".w-color-sketch")).toBeHidden();
    await expectBodyUnlocked(page);

    // The overlay must be gone too, otherwise the page stays unclickable.
    await expect(page.locator("div.fixed.inset-0")).toHaveCount(0);
    await openColorPicker(page);
    await expect(page.locator(".w-color-sketch")).toBeVisible();
  });
});
