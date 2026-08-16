import { expect, test, type Page } from "@playwright/test";

import { DOC_STORAGE_KEY, preview, selectTemplate } from "./helpers";

/**
 * The order the sections are laid out in is the user's, and it is set by pressing the
 * grip on a section heading: the running order floats over that spot as a compact
 * list, and the same press carries into it. The list stays until Esc or a click
 * outside — whatever that first press did.
 *
 * Nothing behind it moves in the meantime: closing is what applies the arrangement,
 * to the form and the sheet together. So these tests drive real pointer gestures,
 * dismiss, and then check that all three outputs agree — the form, the preview, and
 * what is written to storage.
 *
 * The two-column templates are the interesting case. Classic keeps skills and links
 * in its sidebar, so their position has nothing to say there; the heading admits
 * that with a "Sidebar" tag, and Formal — one column — does not.
 */

/** Reordering is pointer-only, so the grips are not focusable and have no name. */
const handles = (page: Page) => page.locator("#resume-form [data-drag-handle]");

/** Every section heading in the form, top to bottom, Information included. */
const formHeadings = (page: Page) => page.locator("#resume-form h2");

const popover = (page: Page) => page.locator("[data-section-order-popover]");

/** The popover's rows, in the order it is currently showing them. */
const popoverRows = (page: Page) => popover(page).locator("li");

/** The sheet's own headings, in the order the template drew them. */
const sheetOrder = async (page: Page, titles: string[]) => {
  const text = (await preview(page).locator("[data-resume-page]").first().textContent()) ?? "";

  return [...titles]
    .filter((title) => text.toLowerCase().includes(title.toLowerCase()))
    .sort(
      (a, b) =>
        text.toLowerCase().indexOf(a.toLowerCase()) - text.toLowerCase().indexOf(b.toLowerCase()),
    );
};

const storedOrder = (page: Page) =>
  page.evaluate((key) => {
    const doc = JSON.parse(localStorage.getItem(key) ?? "{}");

    return doc.locales?.[doc.activeLang]?.sectionOrder as string[];
  }, DOC_STORAGE_KEY);

/**
 * Presses the grip of the section currently at `position` (0-based, Information
 * excluded) and drags it, without releasing.
 *
 * Moved in stages with a beat between them, and never in one jump. The popover only
 * takes the gesture over on the first `pointermove`, and Motion swaps rows on
 * animation frames — a single burst of synthetic moves can be consumed inside one
 * frame, which looks exactly like a drag that reordered nothing.
 */
const grab = async (page: Page, position: number, dy: number) => {
  const target = handles(page).nth(position);
  // Sections are full height in the form, so the lower grips start below the fold —
  // and `page.mouse` aims at viewport coordinates, which off-screen ones are not.
  await target.scrollIntoViewIfNeeded();

  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect(popover(page)).toBeVisible();

  await page.mouse.move(x, y + dy / 2, { steps: 10 });
  await page.waitForTimeout(150);
  await page.mouse.move(x, y + dy, { steps: 10 });
  await page.waitForTimeout(200);

  return {
    /* Releasing does not close the popover — the list stays until it is dismissed,
       whatever the press did. `dismiss` below is how a test gets out. */
    drop: async () => {
      await page.mouse.up();
      await expect(popover(page)).toContainText("Drag to reorder");
    },
  };
};

const dismiss = async (page: Page) => {
  await page.keyboard.press("Escape");
  await expect(popover(page)).toHaveCount(0);
};

test.describe("section order", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  test("starts in the conventional order, and the form matches the sheet", async ({ page }) => {
    await expect(formHeadings(page)).toHaveText([
      /Information/,
      /Profile/,
      /Employment History/,
      /Projects/,
      /Educations/,
      /Skills/,
      /Website & Social links/,
    ]);

    // Classic draws the four main-column sections in that same order.
    expect(
      await sheetOrder(page, ["Profile", "Employment History", "Projects", "Education"]),
    ).toEqual(["Profile", "Employment History", "Projects", "Education"]);
  });

  test("pressing a grip floats the running order over the form", async ({ page }) => {
    const box = (await handles(page).nth(1).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();

    await expect(popover(page)).toBeVisible();
    // Classic's four, and only those: skills and links are in its sidebar, and a row
    // that cannot be moved has no business in a list you move rows in.
    await expect(popoverRows(page)).toHaveText([
      /Profile/,
      /Employment History/,
      /Projects/,
      /Educations/,
    ]);

    // The form behind it is untouched — no folding, no reflow.
    await expect(page.getByRole("textbox").nth(5)).toBeVisible();

    // Releasing leaves it open; the test below covers what that is for, so this one
    // just gets out of the way.
    await page.mouse.up();
    await dismiss(page);
  });

  test("dragging in the popover moves the section, and dismissal applies it", async ({ page }) => {
    const drag = await grab(page, 1, -60);

    // The swap shows in the popover before the drop, which is the point of showing
    // the running order rather than just the row being moved.
    await expect(popoverRows(page)).toHaveText([
      /Employment History/,
      /Profile/,
      /Projects/,
      /Educations/,
    ]);

    await drag.drop();
    await dismiss(page);

    await expect(formHeadings(page)).toHaveText([
      /Information/,
      /Employment History/,
      /Profile/,
      /Projects/,
      /Educations/,
      /Skills/,
      /Website & Social links/,
    ]);

    await expect
      .poll(() => sheetOrder(page, ["Profile", "Employment History", "Projects", "Education"]))
      .toEqual(["Employment History", "Profile", "Projects", "Education"]);
  });

  test("the list stays open after the press, and rearranges a row at a time", async ({ page }) => {
    const box = (await handles(page).nth(0).boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    // A press with no movement at all — the thing anyone does the first time they
    // meet a handle. It used to flash the popover and take it away again.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();

    await expect(popover(page)).toBeVisible();
    await expect(popover(page)).toContainText("Drag to reorder");

    // And every row now drags on its own press, so several can be moved in a row.
    const row = popoverRows(page).nth(3);
    const rowBox = (await row.boundingBox())!;
    const rowX = rowBox.x + 40;
    const rowY = rowBox.y + rowBox.height / 2;

    await page.mouse.move(rowX, rowY);
    await page.mouse.down();
    await page.mouse.move(rowX, rowY - 60, { steps: 10 });
    await page.waitForTimeout(150);
    await page.mouse.move(rowX, rowY - 110, { steps: 10 });
    await page.waitForTimeout(200);
    await page.mouse.up();

    await expect(popoverRows(page)).toHaveText([
      /Profile/,
      /Educations/,
      /Employment History/,
      /Projects/,
    ]);
    await expect(popover(page)).toBeVisible();

    // Applied on the way out, in one go.
    await dismiss(page);
    await expect
      .poll(() => sheetOrder(page, ["Profile", "Employment History", "Projects", "Education"]))
      .toEqual(["Profile", "Education", "Employment History", "Projects"]);
  });

  test("closes on a click outside it", async ({ page }) => {
    const box = (await handles(page).nth(0).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await expect(popover(page)).toBeVisible();

    await page.mouse.click(1100, 800);
    await expect(popover(page)).toHaveCount(0);
  });

  test("stays open after a section has been dragged into place", async ({ page }) => {
    const drag = await grab(page, 1, -60);
    await drag.drop();

    // The list is still there for the next section. Closing here would mean the same
    // grip behaved two different ways depending on whether the hand happened to move.
    await expect(popover(page)).toBeVisible();
    await expect(popoverRows(page).first()).toHaveText(/Employment History/);

    await dismiss(page);
  });

  test("nothing behind the popover moves until it is dismissed", async ({ page }) => {
    const before = await sheetOrder(page, [
      "Profile",
      "Employment History",
      "Projects",
      "Education",
    ]);

    const drag = await grab(page, 1, -60);
    await drag.drop();

    // The popover has the new arrangement, so this is not a drag that failed.
    await expect(popoverRows(page).first()).toHaveText(/Employment History/);

    /*
     * The document does not, and neither half of it does. Two earlier versions wrote
     * through as you went — on every swap, then on every drop — and both were wrong
     * in the same way: this popover is positioned against the heading it was opened
     * from, so the moment that section moves, the anchor points at nothing.
     *
     * Suppressing only the form's half traded that for something worse, which is why
     * the sheet is checked here too: the form and the sheet showing two different
     * orders at once, in an editor whose whole premise is that they agree.
     */
    expect(
      await sheetOrder(page, ["Profile", "Employment History", "Projects", "Education"]),
    ).toEqual(before);

    await expect(formHeadings(page)).toHaveText([
      /Information/,
      /Profile/,
      /Employment History/,
      /Projects/,
      /Educations/,
      /Skills/,
      /Website & Social links/,
    ]);

    await dismiss(page);

    // Both at once, on the way out, with nothing floating over either of them.
    await expect(formHeadings(page)).toHaveText([
      /Information/,
      /Employment History/,
      /Profile/,
      /Projects/,
      /Educations/,
      /Skills/,
      /Website & Social links/,
    ]);
    await expect
      .poll(() => sheetOrder(page, ["Profile", "Employment History", "Projects", "Education"]))
      .toEqual(["Employment History", "Profile", "Projects", "Education"]);
  });

  test("the order outlives a reload", async ({ page }) => {
    const drag = await grab(page, 1, -60);
    await drag.drop();
    await dismiss(page);

    await expect
      .poll(() => storedOrder(page))
      .toEqual(["employmentHistory", "profile", "projects", "educations", "skills", "socialLinks"]);

    await page.reload();

    await expect(formHeadings(page)).toHaveText([
      /Information/,
      /Employment History/,
      /Profile/,
      /Projects/,
      /Educations/,
      /Skills/,
      /Website & Social links/,
    ]);
  });

  test("leaves nothing behind when the popover closes", async ({ page }) => {
    const drag = await grab(page, 1, -60);
    await drag.drop();
    await dismiss(page);

    // The scrim is not a modal and never was, so it must not have locked anything
    // on the way in — this is the freeze preview-dialog.mobile.spec guards against.
    const body = page.locator("body");
    await expect(body).not.toHaveAttribute("data-scroll-locked", /.*/);

    const computed = await page.evaluate(() => {
      const style = getComputedStyle(document.body);

      return { pointerEvents: style.pointerEvents, paddingRight: style.paddingRight };
    });

    expect(computed.pointerEvents).toBe("auto");
    expect(computed.paddingRight).toBe("0px");
  });

  test("offers no grip on a section the template draws in its sidebar", async ({ page }) => {
    // Classic is two-column: skills and links are drawn in the panel, so the running
    // order cannot place them. Their headings say so, and carry no handle.
    const sidebarTags = page.locator("#resume-form h2", { hasText: "Sidebar" });
    await expect(sidebarTags).toHaveText([/Skills/, /Website & Social links/]);
    await expect(handles(page)).toHaveCount(4);

    // Formal is one column, so nothing is pinned and every section is arrangeable.
    await selectTemplate(page, "Formal");
    await expect(sidebarTags).toHaveCount(0);
    await expect(handles(page)).toHaveCount(6);
  });

  test("a section the sidebar holds keeps its place in the stored order", async ({ page }) => {
    // Skills sits fifth. Rearranging the four Classic *can* place must not disturb
    // it, or switching to a single-column template later would find it moved.
    const drag = await grab(page, 0, 110);
    await drag.drop();
    await dismiss(page);

    await expect
      .poll(() => storedOrder(page))
      .toEqual(["employmentHistory", "projects", "profile", "educations", "skills", "socialLinks"]);
  });

  test("a single-column template lays every section out in the chosen order", async ({ page }) => {
    await selectTemplate(page, "Formal");

    // Skills is fifth, and the two-column templates cannot move it at all — on
    // Formal it is in the flow like everything else.
    const drag = await grab(page, 4, -110);

    /*
     * Asserted against what the popover was showing rather than against a predicted
     * number of places, and that is the point rather than a dodge: this is the
     * promise the design makes — the list you were looking at when you let go is the
     * one you get. Predicting travel would also be fragile here, since a grip low in
     * the viewport gets a popover clamped to fit, which moves the row away from the
     * cursor by however much it took.
     */
    const dropped = (await popoverRows(page).allInnerTexts()).map((row) => row.trim());
    await drag.drop();
    await dismiss(page);

    const SHEET_TITLE: Record<string, string> = {
      Profile: "Summary",
      "Employment History": "Experience",
      "Website & Social links": "Links",
      Educations: "Education",
    };
    const expected = dropped.map((row) => {
      const name = row.replace(/\s*Sidebar$/, "");

      return SHEET_TITLE[name] ?? name;
    });

    await expect.poll(() => sheetOrder(page, expected)).toEqual(expected);
  });
});
