import { expect, test, type Page } from "@playwright/test";
import {
  collectConsoleErrors,
  DOC_STORAGE_KEY,
  languageButton,
  onDeviceAiButton,
  openOnDeviceAiPanel,
  preview,
} from "./helpers";

/**
 * The Translator API is Chrome 138+ / Edge 148+ and desktop only, so these tests
 * install a stand-in that follows the spec
 * (https://webmachinelearning.github.io/translation-api/) — `availability()`,
 * `create()` with the `downloadprogress` monitor whose `loaded` runs 0 to 1, and
 * `translate()`.
 *
 * Every case is stubbed rather than left to the real browser, because
 * Playwright's bundled Chromium is a trap: it *does* expose `window.Translator`,
 * but with no model service behind it, so `availability()` never settles. That
 * is a case in its own right below, not the default.
 */
interface StubOptions {
  availability?: "available" | "downloadable" | "downloading" | "unavailable";
  /** How many progress events `create()` emits before it resolves. */
  steps?: number;
  failCreate?: boolean;
  /** Never settles — a Chromium with the API but no model service behind it. */
  hangAvailability?: boolean;
}

const installTranslatorStub = async (page: Page, options: StubOptions = {}) => {
  await page.addInitScript((opts: StubOptions) => {
    const {
      availability = "downloadable",
      steps = 4,
      failCreate = false,
      hangAvailability = false,
    } = opts;

    const translator = {
      availability: () =>
        hangAvailability ? new Promise(() => {}) : Promise.resolve(availability),
      create: (createOptions: {
        sourceLanguage: string;
        targetLanguage: string;
        monitor?: (monitor: {
          addEventListener: (type: string, listener: (event: unknown) => void) => void;
        }) => void;
      }) => {
        const listeners: ((event: unknown) => void)[] = [];
        createOptions.monitor?.({
          addEventListener: (_type, listener) => listeners.push(listener),
        });

        return new Promise((resolve, reject) => {
          let sent = 0;
          const tick = () => {
            sent += 1;
            listeners.forEach((listener) => listener({ loaded: sent / steps, total: 1 }));

            if (sent < steps) {
              setTimeout(tick, 40);

              return;
            }

            if (failCreate) {
              reject(new DOMException("nope", "NetworkError"));

              return;
            }

            resolve({
              // Deliberately not a real translation: the tests care that each
              // field went through the translator and came back changed, and a
              // marker makes "which fields moved" readable in an assertion.
              translate: (input: string) =>
                Promise.resolve(`[${createOptions.targetLanguage}] ${input}`),
              destroy: () => {},
            });
          };

          setTimeout(tick, 20);
        });
      },
    };

    Object.defineProperty(window, "Translator", { configurable: true, get: () => translator });
  }, options);
};

const readDoc = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) as string),
    DOC_STORAGE_KEY,
  ) as Promise<{
    primaryLang: string;
    activeLang: string;
    locales: Record<string, { profile: string; name: string; wantedJob: string }>;
    translation: Record<string, unknown>;
  }>;

test.describe("On-device AI panel", () => {
  test("is honest about a browser with neither capability", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await installTranslatorStub(page, { availability: "unavailable" });
    await page.goto("/resume-editor");

    await openOnDeviceAiPanel(page);

    await expect(page.getByText("Browser agent")).toBeVisible();
    await expect(page.getByText("Needs Edge 147+")).toBeVisible();
    await expect(page.getByText("Needs Chrome 138+ or Edge 148+ on desktop.")).toBeVisible();
    // Nothing to enable, so nothing offers to.
    await expect(page.getByRole("button", { name: "Enable" })).toBeHidden();
    expect(errors).toEqual([]);
  });

  /**
   * Playwright's own Chromium is this case: `window.Translator` exists but
   * `availability()` never settles. Left unguarded the row reads "Checking" for
   * the life of the page and never offers the by-hand fallback.
   */
  test("gives up on a translator that never answers", async ({ page }) => {
    await installTranslatorStub(page, { hangAvailability: true });
    await page.goto("/resume-editor");

    await openOnDeviceAiPanel(page);
    await expect(page.getByText("Checking whether the model")).toBeVisible();

    await expect(page.getByText("This browser's translator did not respond.")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Enable" })).toBeHidden();
  });

  test("offers the download, runs it, and keeps going while the panel is shut", async ({
    page,
  }) => {
    await installTranslatorStub(page, { availability: "downloadable", steps: 6 });
    await page.goto("/resume-editor");

    await openOnDeviceAiPanel(page);
    await expect(page.getByText("the model downloads once")).toBeVisible();

    // This click is the user activation the real API requires.
    await page.getByRole("button", { name: "Enable" }).click();
    await expect(page.getByRole("progressbar")).toBeVisible();

    // Closing the panel must not cancel anything: the download lives in a module
    // store, not in the component that started it.
    await page.keyboard.press("Escape");
    await expect(onDeviceAiButton(page)).toHaveAttribute("aria-busy", "true");

    await openOnDeviceAiPanel(page);
    await expect(page.getByText("ready to translate")).toBeVisible();
    await expect(onDeviceAiButton(page)).toHaveAttribute("aria-busy", "false");
  });

  test("a failed download can be retried", async ({ page }) => {
    await installTranslatorStub(page, { availability: "downloadable", steps: 2, failCreate: true });
    await page.goto("/resume-editor");

    await openOnDeviceAiPanel(page);
    await page.getByRole("button", { name: "Enable" }).click();

    await expect(page.getByText("Download failed.")).toBeVisible();
    // The rejected promise is dropped rather than cached, so this is a real
    // second attempt and not a re-await of the first failure.
    await expect(page.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  test("says nothing is measurable when another tab owns the download", async ({ page }) => {
    await installTranslatorStub(page, { availability: "downloading" });
    await page.goto("/resume-editor");

    await openOnDeviceAiPanel(page);

    await expect(page.getByText("Another tab is already downloading this model.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enable" })).toBeHidden();
  });
});

test.describe("Resume translation", () => {
  test.beforeEach(async ({ page }) => {
    await installTranslatorStub(page, { availability: "available" });
    await page.goto("/resume-editor");
  });

  test("translates the primary into the secondary and leaves the original alone", async ({
    page,
  }) => {
    await languageButton(page, "English").click();
    await expect(page.getByRole("heading", { name: "No English version yet" })).toBeVisible();

    await page.getByRole("button", { name: "Translate from 中文" }).click();

    // The profile is translatable; the name is not, so it is copied verbatim.
    await expect(preview(page).getByText(/^\[en\] Lorem Ipsum/)).toBeVisible();
    await expect(preview(page).getByText("My Name")).toBeVisible();

    const doc = await readDoc(page);

    expect(doc.primaryLang).toBe("zh-Hant");
    expect(doc.locales.en.profile).toMatch(/^\[en\] /);
    expect(doc.locales.en.name).toBe("My Name");
    // The whole point: the original is untouched by any of this.
    expect(doc.locales["zh-Hant"].profile).not.toMatch(/^\[en\] /);
  });

  test("an edit to the translation never reaches the original", async ({ page }) => {
    await languageButton(page, "English").click();
    await page.getByRole("button", { name: "Translate from 中文" }).click();
    await expect(preview(page).getByText(/^\[en\] Lorem Ipsum/)).toBeVisible();

    const name = page.getByRole("textbox").nth(1);
    await name.fill("Ada Lovelace");
    await expect(preview(page).getByText("Ada Lovelace")).toBeVisible();

    await languageButton(page, "中文").click();

    await expect(preview(page).getByText("My Name")).toBeVisible();
    await expect(preview(page).getByText("Ada Lovelace")).toBeHidden();

    const doc = await readDoc(page);

    expect(doc.locales.en.name).toBe("Ada Lovelace");
    expect(doc.locales["zh-Hant"].name).toBe("My Name");
  });

  test("changing the original marks the translation stale without overwriting it", async ({
    page,
  }) => {
    await languageButton(page, "English").click();
    await page.getByRole("button", { name: "Translate from 中文" }).click();
    await expect(preview(page).getByText(/^\[en\] Lorem Ipsum/)).toBeVisible();

    await languageButton(page, "中文").click();
    // The first field is the job title, which is translatable — unlike the
    // e-mail and phone below it, which are copied through untouched.
    await page.getByRole("textbox").nth(0).fill("Principal Engineer");

    await languageButton(page, "English").click();

    await expect(page.getByText(/field has changed in the original/)).toBeVisible();
    // Still the old translation until the update is asked for.
    await expect(preview(page).getByText("[en] Senior job")).toBeVisible();

    await page.getByRole("button", { name: "Update translation" }).click();

    await expect(preview(page).getByText("[en] Principal Engineer")).toBeVisible();
    await expect(page.getByText(/changed in the original/)).toBeHidden();
  });

  test("re-translating replaces a hand-edited field the update would have kept", async ({
    page,
  }) => {
    await languageButton(page, "English").click();
    await page.getByRole("button", { name: "Translate from 中文" }).click();
    await expect(preview(page).getByText("[en] Senior job")).toBeVisible();

    // Rewrite the wanted job here. "Update translation" exists to protect this;
    // re-translating is the way to say you want it gone.
    await page.getByRole("textbox").nth(0).fill("Staff Engineer");
    await expect(preview(page).getByText("Staff Engineer")).toBeVisible();

    await page.getByRole("button", { name: "Re-translate from 中文" }).click();
    await expect(page.getByText(/1 field you rewrote will be replaced/)).toBeVisible();
    await page.getByRole("button", { name: "Re-translate", exact: true }).click();

    // Back to the machine's wording, from the untouched Chinese original.
    await expect(preview(page).getByText("[en] Senior job")).toBeVisible();
    await expect(preview(page).getByText("Staff Engineer")).toBeHidden();

    const doc = await readDoc(page);

    expect(doc.locales.en.wantedJob).toBe("[en] Senior job");
    expect(doc.locales["zh-Hant"].wantedJob).toBe("Senior job");
  });

  test("re-translating can be backed out of, and changes nothing when it is", async ({ page }) => {
    await languageButton(page, "English").click();
    await page.getByRole("button", { name: "Translate from 中文" }).click();
    await expect(preview(page).getByText("[en] Senior job")).toBeVisible();

    await page.getByRole("textbox").nth(0).fill("Staff Engineer");
    await expect(preview(page).getByText("Staff Engineer")).toBeVisible();

    await page.getByRole("button", { name: "Re-translate from 中文" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(preview(page).getByText("Staff Engineer")).toBeVisible();
    // Polled, not read once: the edit reaches storage through a 300ms debounce,
    // and cancelling — unlike a translation — never flushes it.
    await expect
      .poll(async () => (await readDoc(page)).locales.en.wantedJob)
      .toBe("Staff Engineer");
  });
});
