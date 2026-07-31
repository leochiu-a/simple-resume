import { expect, test } from "@playwright/test";
import { collectConsoleErrors, preview } from "./helpers";

test.describe("resume editor", () => {
  // The collector must be attached before navigating, or errors raised during
  // the initial load are missed.
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors = collectConsoleErrors(page);
    await page.goto("/resume-editor");
  });

  test("renders the form and the preview side by side", async ({ page }) => {
    await expect(page.getByText("Information")).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Senior Frontend Engineer/i })).toBeVisible();

    // The preview lives in an iframe and must contain the seeded resume content.
    await expect(preview(page).getByText("My Name")).toBeVisible();
    await expect(preview(page).getByText("Employment History")).toBeVisible();
    await expect(preview(page).getByText("Education")).toBeVisible();

    expect(errors).toEqual([]);
  });

  /**
   * The form has no submit path — no action, no handler — and eleven of the icon
   * buttons inside it default to `type="submit"`. Submitting would serialise every
   * field into the query string, putting the name, phone and profile in the URL,
   * where it reaches the server in the request line and stays in history. That is
   * the opposite of what this app promises, so the form refuses to submit at all.
   *
   * Asserted by submitting it directly rather than by clicking a button: a real
   * click never reaches the default action, because react-hook-form has re-rendered
   * the button away by the time the browser would act on it. `requestSubmit` is
   * what the guard is actually guarding against, and without it this navigates.
   */
  test("the form refuses to submit, so the resume cannot reach the URL", async ({ page }) => {
    await page.locator("#resume-form").evaluate((form: HTMLFormElement) => form.requestSubmit());

    await expect(page).toHaveURL("/resume-editor");
    expect(errors).toEqual([]);
  });

  test("deleting an entry removes it from the form", async ({ page }) => {
    const socialInputs = page.locator('input[name^="socialLinks"]');
    await expect(socialInputs).toHaveCount(6);

    await page
      .getByRole("heading", { name: "Website & Social links" })
      .locator("..")
      .getByRole("button")
      .nth(1)
      .click();

    await expect(socialInputs).toHaveCount(4);
    expect(errors).toEqual([]);
  });

  test("typing in a form field updates the preview", async ({ page }) => {
    await page.getByRole("textbox").nth(1).fill("Ada Lovelace");

    await expect(preview(page).getByText("Ada Lovelace")).toBeVisible();
    expect(errors).toEqual([]);
  });

  /**
   * The bullet list is a contentEditable div whose onInput reads
   * `e.currentTarget.children`. @types/react 19.2 types that event as
   * InputEvent<HTMLDivElement>, which is why the handler had to be retyped —
   * this asserts the handler still collects every bullet and propagates it.
   */
  test("editing the bullet list propagates each bullet to the preview", async ({ page }) => {
    const bullets = page.locator("div[contenteditable]").first();
    await expect(bullets).toBeVisible();

    await bullets.click();
    await bullets.press("End");
    await bullets.press("Enter");
    await bullets.pressSequentially("Shipped the thing");

    await expect(preview(page).getByText("Shipped the thing")).toBeVisible();
    // The pre-existing bullet must survive: the handler joins all children.
    await expect(preview(page).getByText("A,B,C,D")).toBeVisible();
  });
});
