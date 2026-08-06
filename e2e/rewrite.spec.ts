import { expect, test, type Page } from "@playwright/test";
import { collectConsoleErrors, preview } from "./helpers";

/**
 * The Prompt API is Chrome 138+ and desktop only, so these tests install a
 * stand-in that follows the spec
 * (https://webmachinelearning.github.io/prompt-api/) — `availability()`,
 * `create()` with the `downloadprogress` monitor, `clone()`, and a
 * `promptStreaming()` that returns a ReadableStream of chunks.
 *
 * Stubbed rather than left to the real browser for the reason the translator
 * tests document: Playwright's Chromium has no model service behind these APIs.
 */
interface StubOptions {
  availability?: "available" | "downloadable" | "downloading" | "unavailable";
  /** Chunks the stream emits, joined to form the reply. */
  chunks?: string[];
  /** How many progress events `create()` emits before it resolves. */
  steps?: number;
  failPrompt?: boolean;
  hangAvailability?: boolean;
}

const installLanguageModelStub = async (page: Page, options: StubOptions = {}) => {
  await page.addInitScript((opts: StubOptions) => {
    const {
      availability = "available",
      chunks = ["Rewritten ", "by ", "the model."],
      steps = 4,
      failPrompt = false,
      hangAvailability = false,
    } = opts;

    // Recorded so a test can assert what the model was actually asked, which is
    // where the separator handling and the per-section instructions show up.
    const prompts: string[] = [];
    (window as unknown as { __prompts: string[] }).__prompts = prompts;

    const makeSession = () => ({
      clone: () => Promise.resolve(makeSession()),
      promptStreaming: (input: string) => {
        prompts.push(input);

        return new ReadableStream<string>({
          start(controller) {
            if (failPrompt) {
              controller.error(new DOMException("nope", "UnknownError"));

              return;
            }

            let sent = 0;
            const tick = () => {
              controller.enqueue(chunks[sent]);
              sent += 1;

              if (sent < chunks.length) {
                setTimeout(tick, 20);

                return;
              }

              controller.close();
            };

            setTimeout(tick, 10);
          },
        });
      },
      destroy: () => {},
    });

    class LanguageModelStub {
      static availability() {
        return hangAvailability ? new Promise(() => {}) : Promise.resolve(availability);
      }

      static create(createOptions?: {
        monitor?: (monitor: {
          addEventListener: (type: string, listener: (event: unknown) => void) => void;
        }) => void;
      }) {
        const listeners: ((event: unknown) => void)[] = [];
        createOptions?.monitor?.({
          addEventListener: (_type, listener) => listeners.push(listener),
        });

        return new Promise((resolve) => {
          let sent = 0;
          const tick = () => {
            sent += 1;
            listeners.forEach((listener) => listener({ loaded: sent / steps, total: 1 }));

            if (sent < steps) {
              setTimeout(tick, 20);

              return;
            }

            resolve(makeSession());
          };

          setTimeout(tick, 10);
        });
      }
    }

    Object.defineProperty(window, "LanguageModel", {
      configurable: true,
      get: () => LanguageModelStub,
    });
  }, options);
};

const improveButton = (page: Page, index = 0) =>
  page.getByRole("button", { name: /suggestions$/ }).nth(index);

const panel = (page: Page) => page.getByRole("dialog");

const readPrompts = (page: Page) =>
  page.evaluate(() => (window as unknown as { __prompts: string[] }).__prompts);

test.describe("Rewrite popover", () => {
  test("shows its writing advice without touching the model", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await installLanguageModelStub(page);
    await page.goto("/resume-editor");

    await improveButton(page).click();

    await expect(panel(page)).toBeVisible();
    await expect(page.getByText("Writing a profile")).toBeVisible();
    await expect(page.getByText(/a recruiter reads this in about ten seconds/)).toBeVisible();

    // The advice is written down, not generated: opening the panel must not
    // have prompted anything.
    expect(await readPrompts(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("keeps the advice useful when the browser has no model", async ({ page }) => {
    await installLanguageModelStub(page, { availability: "unavailable" });
    await page.goto("/resume-editor");

    await improveButton(page).click();

    await expect(page.getByText(/a recruiter reads this in about ten seconds/)).toBeVisible();
    await expect(page.getByText(/On-device rewriting needs Chrome 138\+/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Polish the wording" })).toBeDisabled();
  });

  test("previews a rewrite and leaves the field alone until it is accepted", async ({ page }) => {
    await installLanguageModelStub(page, { chunks: ["A tighter ", "profile."] });
    await page.goto("/resume-editor");

    const profile = page.locator('textarea[name="profile"]');
    const original = await profile.inputValue();

    await improveButton(page).click();
    await page.getByRole("button", { name: "Polish the wording" }).click();

    await expect(page.getByText("Suggested rewrite")).toBeVisible();
    await expect(panel(page).getByText("A tighter profile.")).toBeVisible();

    // The whole point of the preview step: nothing has been written yet.
    expect(await profile.inputValue()).toBe(original);
    await expect(preview(page).getByText("A tighter profile.")).toBeHidden();

    await page.getByRole("button", { name: "Use this" }).click();

    await expect(panel(page)).toBeHidden();
    expect(await profile.inputValue()).toBe("A tighter profile.");
    await expect(preview(page).getByText("A tighter profile.")).toBeVisible();
  });

  test("discarding a rewrite changes nothing", async ({ page }) => {
    await installLanguageModelStub(page, { chunks: ["Discard ", "me."] });
    await page.goto("/resume-editor");

    const profile = page.locator('textarea[name="profile"]');
    const original = await profile.inputValue();

    await improveButton(page).click();
    await page.getByRole("button", { name: "Polish the wording" }).click();
    await expect(panel(page).getByText("Discard me.")).toBeVisible();

    await page.getByRole("button", { name: "Discard" }).click();

    // Back to the actions, with the field untouched.
    await expect(page.getByRole("button", { name: "Polish the wording" })).toBeVisible();
    expect(await profile.inputValue()).toBe(original);
  });

  test("surfaces a failed rewrite and keeps the original", async ({ page }) => {
    await installLanguageModelStub(page, { failPrompt: true });
    await page.goto("/resume-editor");

    const profile = page.locator('textarea[name="profile"]');
    const original = await profile.inputValue();

    await improveButton(page).click();
    await page.getByRole("button", { name: "Polish the wording" }).click();

    await expect(page.getByText(/could not be finished|nope/)).toBeVisible();
    expect(await profile.inputValue()).toBe(original);
    // The actions come back so the failure can be retried.
    await expect(page.getByRole("button", { name: "Polish the wording" })).toBeEnabled();
  });

  /**
   * The seeded job description is `A,B,C,D`. There is nothing there for a model
   * to work with, and the actions say so before they are pressed rather than
   * failing afterwards.
   */
  test("will not rewrite a field with nothing in it yet", async ({ page }) => {
    await installLanguageModelStub(page);
    await page.goto("/resume-editor");

    await page
      .getByRole("button", { name: /suggestions$/ })
      .last()
      .click();

    await expect(page.getByText(/Write a first draft here/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Polish the wording" })).toBeDisabled();
    // The advice is the useful half in this state, and it is still there.
    await expect(page.getByText(/One bullet per achievement/)).toBeVisible();
    expect(await readPrompts(page)).toEqual([]);
  });

  test("shows the download once, then goes straight to rewriting", async ({ page }) => {
    await installLanguageModelStub(page, { availability: "downloadable", steps: 6 });
    await page.goto("/resume-editor");

    await improveButton(page).click();
    await expect(page.getByText(/The model is downloaded the first time/)).toBeVisible();

    await page.getByRole("button", { name: "Polish the wording" }).click();

    /*
      Deliberately not asserting the progress bar on the way past.

      The stubbed download resolves in about sixty milliseconds, so catching it
      mid-flight is a race the test would lose intermittently — the same trap the
      translator specs document. What matters is that a browser which had to
      fetch the model still ends up at a rewrite, and arriving here proves the
      download ran and the prompt followed it without a second click.
    */
    await expect(page.getByText("Suggested rewrite")).toBeVisible();
    expect(await readPrompts(page)).toHaveLength(1);
  });
});

test.describe("Rewriting a job description", () => {
  /**
   * The seeded description is `A,B,C,D` — far too short to rewrite, and it is
   * the field's own contentEditable rather than an input, so it is typed into
   * rather than filled. Every test here needs a real draft to work from.
   */
  const writeDescription = async (page: Page, lines: string[]) => {
    const field = page.locator('[contenteditable="true"]').last();
    await field.click();
    await page.keyboard.press("ControlOrMeta+a");
    for (const [index, line] of lines.entries()) {
      if (index > 0) await page.keyboard.press("Enter");
      await page.keyboard.type(line);
    }
  };

  test.beforeEach(async ({ page }) => {
    await installLanguageModelStub(page, {
      chunks: ["- Built the thing\n", "- Led the other thing"],
    });
    await page.goto("/resume-editor");
    await writeDescription(page, [
      "Worked on the search team",
      "Helped with the migration project",
    ]);
  });

  test("sends bullets as a list and never leaks the separator", async ({ page }) => {
    // The last trigger on the page is the one in employment history.
    const triggers = page.getByRole("button", { name: /suggestions$/ });
    await triggers.last().click();

    await expect(page.getByText("Writing a role description")).toBeVisible();
    await page.getByRole("button", { name: "Start with strong verbs" }).click();

    await expect(page.getByText("Suggested rewrite")).toBeVisible();

    const [prompt] = await readPrompts(page);
    // The stored `|` separator is a storage detail; the model sees a real list.
    expect(prompt).not.toContain("|");
    expect(prompt).toContain("- ");
    expect(prompt).toContain("bullet list");
  });

  test("applies the rewrite back into the description field", async ({ page }) => {
    await page
      .getByRole("button", { name: /suggestions$/ })
      .last()
      .click();
    await page.getByRole("button", { name: "Polish the wording" }).click();
    await expect(page.getByText("Suggested rewrite")).toBeVisible();

    await page.getByRole("button", { name: "Use this" }).click();

    // Both bullets reach the sheet as separate lines, with no `|` anywhere.
    await expect(preview(page).getByText("Built the thing")).toBeVisible();
    await expect(preview(page).getByText("Led the other thing")).toBeVisible();
    await expect(preview(page).getByText(/\|/)).toBeHidden();
  });
});
