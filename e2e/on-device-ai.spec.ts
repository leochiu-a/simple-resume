import { expect, test, type Page } from "@playwright/test";
import {
  addLanguageButton,
  collectConsoleErrors,
  DOC_STORAGE_KEY,
  languageButton,
  onDeviceAiPanel,
  openOnDeviceAiPanel,
  preview,
  soleLanguageButton,
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
  /**
   * Hold the download open once its progress has run, until the test calls
   * `finishDownload`.
   *
   * A stubbed download takes a few hundred milliseconds, and a test that wants to
   * assert on the busy state has to get an assertion in before it ends —
   * a race it loses under a loaded machine, where a round trip to the page costs
   * more than the whole download. Holding it open removes the clock from the
   * test entirely: the download is busy until the test says otherwise.
   */
  hold?: boolean;
}

/** Releases a `hold`ing download, which then resolves as it otherwise would. */
const finishDownload = (page: Page) =>
  page.evaluate(() => (window as unknown as { finishDownload: () => void }).finishDownload());

const installTranslatorStub = async (page: Page, options: StubOptions = {}) => {
  await page.addInitScript((opts: StubOptions) => {
    const {
      availability = "downloadable",
      steps = 4,
      failCreate = false,
      hangAvailability = false,
      hold = false,
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

        // Resolved by the test through `window.finishDownload`; already resolved
        // when nothing is holding the download, so the tick below settles as soon
        // as it has sent its last progress event.
        let release = () => {};
        const held = hold ? new Promise<void>((resolve) => (release = resolve)) : Promise.resolve();
        (window as unknown as { finishDownload: () => void }).finishDownload = () => release();

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

            void held.then(() =>
              resolve({
                // Deliberately not a real translation: the tests care that each
                // field went through the translator and came back changed, and a
                // marker makes "which fields moved" readable in an assertion.
                translate: (input: string) =>
                  Promise.resolve(`[${createOptions.targetLanguage}] ${input}`),
                destroy: () => {},
              }),
            );
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
   *
   * The trigger is reachable throughout: it hides only while *both* capabilities
   * are still probing, and the WebMCP probe settles on its own here.
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
    // Held open: the busy state below is asserted across several round trips to
    // the page, and a download that ends on its own clock would sometimes be over
    // before the first of them lands.
    await installTranslatorStub(page, { availability: "downloadable", steps: 6, hold: true });
    await page.goto("/resume-editor");

    await openOnDeviceAiPanel(page);
    await expect(page.getByText("the model downloads once")).toBeVisible();

    // This click is the user activation the real API requires. It must not close
    // the panel it was pressed in — the rows are deliberately not menu items, and
    // the panel is a Popover rather than a DropdownMenu, precisely so that this
    // click survives.
    await page.getByRole("button", { name: "Enable" }).click();
    await expect(onDeviceAiPanel(page)).toBeVisible();
    await expect(page.getByRole("progressbar")).toBeVisible();
    // Busy while the panel is still up — the deterministic half of the check.
    // Whether it is still downloading *after* closing is a race (see below), so
    // the guarantee is pinned here and at `ready`, not in between.
    await expect(page.getByText("Downloading", { exact: true })).toBeVisible();

    // Closing the panel must not cancel anything: the download lives in a module
    // store, not in the component that started it.
    await page.keyboard.press("Escape");
    await expect(onDeviceAiPanel(page)).toBeHidden();
    // The progress bar lives in the panel, so it goes with it.
    await expect(page.getByRole("progressbar")).toBeHidden();

    /*
      Let it finish with the panel still shut, then reopen and confirm it ran to
      completion while nothing was on screen holding it.

      Deliberately not asserting a mid-flight state on the way past: the rows are
      only in the DOM while the panel is open, and the thing being guarded is not
      "is it busy right now" but "did closing the panel cancel it". Arriving at
      `ready` having only ever released it from outside proves that.
    */
    await finishDownload(page);

    await openOnDeviceAiPanel(page);
    await expect(page.getByText("ready to translate")).toBeVisible();
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
    await addLanguageButton(page, "中文").click();
    await expect(page.getByRole("heading", { name: "No 中文 version yet" })).toBeVisible();

    await page.getByRole("button", { name: "Translate from English" }).click();

    // The profile is translatable; the name is not, so it is copied verbatim.
    await expect(preview(page).getByText(/^\[zh-Hant\] Lorem Ipsum/)).toBeVisible();
    await expect(preview(page).getByText("My Name")).toBeVisible();

    const doc = await readDoc(page);

    expect(doc.primaryLang).toBe("en");
    expect(doc.locales["zh-Hant"].profile).toMatch(/^\[zh-Hant\] /);
    expect(doc.locales.en.name).toBe("My Name");
    // The whole point: the original is untouched by any of this.
    expect(doc.locales.en.profile).not.toMatch(/^\[zh-Hant\] /);
  });

  test("an edit to the translation never reaches the original", async ({ page }) => {
    await addLanguageButton(page, "中文").click();
    await page.getByRole("button", { name: "Translate from English" }).click();
    await expect(preview(page).getByText(/^\[zh-Hant\] Lorem Ipsum/)).toBeVisible();

    const name = page.getByRole("textbox").nth(1);
    await name.fill("Ada Lovelace");
    await expect(preview(page).getByText("Ada Lovelace")).toBeVisible();

    await languageButton(page, "English").click();

    await expect(preview(page).getByText("My Name")).toBeVisible();
    await expect(preview(page).getByText("Ada Lovelace")).toBeHidden();

    const doc = await readDoc(page);

    expect(doc.locales["zh-Hant"].name).toBe("Ada Lovelace");
    expect(doc.locales.en.name).toBe("My Name");
  });

  test("changing the original marks the translation stale without overwriting it", async ({
    page,
  }) => {
    await addLanguageButton(page, "中文").click();
    await page.getByRole("button", { name: "Translate from English" }).click();
    await expect(preview(page).getByText(/^\[zh-Hant\] Lorem Ipsum/)).toBeVisible();

    await languageButton(page, "English").click();
    // The first field is the job title, which is translatable — unlike the
    // e-mail and phone below it, which are copied through untouched.
    await page.getByRole("textbox").nth(0).fill("Principal Engineer");

    await languageButton(page, "中文").click();

    await expect(page.getByText(/field has changed in the English original/)).toBeVisible();
    // Still the old translation until the update is asked for.
    await expect(preview(page).getByText("[zh-Hant] Senior job")).toBeVisible();

    await page.getByRole("button", { name: "Update translation" }).click();

    await expect(preview(page).getByText("[zh-Hant] Principal Engineer")).toBeVisible();
    await expect(page.getByText(/changed in the English original/)).toBeHidden();
  });

  test("re-translating replaces a hand-edited field the update would have kept", async ({
    page,
  }) => {
    await addLanguageButton(page, "中文").click();
    await page.getByRole("button", { name: "Translate from English" }).click();
    await expect(preview(page).getByText("[zh-Hant] Senior job")).toBeVisible();

    // Rewrite the wanted job here. "Update translation" exists to protect this;
    // re-translating is the way to say you want it gone.
    await page.getByRole("textbox").nth(0).fill("Staff Engineer");
    await expect(preview(page).getByText("Staff Engineer")).toBeVisible();

    await page.getByRole("button", { name: "Re-translate from English" }).click();
    await expect(page.getByText(/1 field you rewrote will be replaced/)).toBeVisible();
    await page.getByRole("button", { name: "Re-translate", exact: true }).click();

    // Back to the machine's wording, from the untouched English original.
    await expect(preview(page).getByText("[zh-Hant] Senior job")).toBeVisible();
    await expect(preview(page).getByText("Staff Engineer")).toBeHidden();

    const doc = await readDoc(page);

    expect(doc.locales["zh-Hant"].wantedJob).toBe("[zh-Hant] Senior job");
    expect(doc.locales.en.wantedJob).toBe("Senior job");
  });

  test("re-translating can be backed out of, and changes nothing when it is", async ({ page }) => {
    await addLanguageButton(page, "中文").click();
    await page.getByRole("button", { name: "Translate from English" }).click();
    await expect(preview(page).getByText("[zh-Hant] Senior job")).toBeVisible();

    await page.getByRole("textbox").nth(0).fill("Staff Engineer");
    await expect(preview(page).getByText("Staff Engineer")).toBeVisible();

    await page.getByRole("button", { name: "Re-translate from English" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(preview(page).getByText("Staff Engineer")).toBeVisible();
    // Polled, not read once: the edit reaches storage through a 300ms debounce,
    // and cancelling — unlike a translation — never flushes it.
    await expect
      .poll(async () => (await readDoc(page)).locales["zh-Hant"].wantedJob)
      .toBe("Staff Engineer");
  });

  /**
   * The second language is something you ask for. These three cases are the
   * whole of that promise: it is not there until you ask, asking can be undone,
   * and having asked can be undone too.
   */
  test("offers the second language rather than pretending it is already there", async ({
    page,
  }) => {
    await expect(soleLanguageButton(page, "English")).toBeVisible();
    // Neither language is a tab while there is only one. A tab for English would
    // say that version exists and is merely elsewhere, which is what sent
    // single-language users into an empty document.
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(addLanguageButton(page, "中文")).toBeVisible();
  });

  test("says what the one language is, and can be told it is wrong", async ({ page }) => {
    // A new document is labelled `en`, which is what the sample resume is written
    // in — but nobody asked the person who cleared it and typed 中文, so the label
    // has to be correctable.
    await soleLanguageButton(page, "English").click();
    await page.getByRole("menuitemradio", { name: "中文" }).click();

    await expect(soleLanguageButton(page, "中文")).toBeVisible();
    // The offer flips with it: the language you do not have is the one on offer.
    await expect(addLanguageButton(page, "English")).toBeVisible();

    const doc = await readDoc(page);

    expect(doc.primaryLang).toBe("zh-Hant");
    expect(doc.activeLang).toBe("zh-Hant");
    // A move, not a copy — there is one resume and this renamed it.
    expect(Object.keys(doc.locales)).toEqual(["zh-Hant"]);
    expect(doc.locales["zh-Hant"].name).toBe("My Name");
  });

  test("relabelling then translating goes the other way round", async ({ page }) => {
    await soleLanguageButton(page, "English").click();
    await page.getByRole("menuitemradio", { name: "中文" }).click();

    await addLanguageButton(page, "English").click();
    await page.getByRole("button", { name: "Translate from 中文" }).click();
    await expect(preview(page).getByText(/^\[en\] Lorem Ipsum/)).toBeVisible();

    const doc = await readDoc(page);

    // The relabelled locale is the source of truth, so the translation runs into
    // English — the opposite of what a default document does.
    expect(doc.primaryLang).toBe("zh-Hant");
    expect(doc.locales.en.profile).toMatch(/^\[en\] /);
    expect(doc.locales["zh-Hant"].profile).not.toMatch(/^\[en\] /);
  });

  test("an empty second language can be backed out of", async ({ page }) => {
    await addLanguageButton(page, "中文").click();
    await expect(page.getByRole("heading", { name: "No 中文 version yet" })).toBeVisible();

    await page.getByRole("button", { name: "Never mind, stay in English only" }).click();

    await expect(addLanguageButton(page, "中文")).toBeVisible();
    // Back in the original with its content intact, not in an empty form.
    await expect(preview(page).getByText("My Name")).toBeVisible();
  });

  test("removing the translation leaves the original untouched", async ({ page }) => {
    await addLanguageButton(page, "中文").click();
    await page.getByRole("button", { name: "Translate from English" }).click();
    await expect(preview(page).getByText(/^\[zh-Hant\] Lorem Ipsum/)).toBeVisible();

    await page.getByRole("button", { name: "Remove 中文 version" }).click();
    await page.getByRole("button", { name: "Remove version" }).click();

    await expect(addLanguageButton(page, "中文")).toBeVisible();
    await expect(preview(page).getByText("My Name")).toBeVisible();

    const doc = await readDoc(page);

    expect(Object.keys(doc.locales)).toEqual(["en"]);
    // The provenance goes with it: left behind, a later 中文 version would read
    // as a translation of text it has never seen.
    expect(doc.translation["zh-Hant"]).toBeUndefined();
    expect(doc.locales.en.profile).not.toMatch(/^\[zh-Hant\] /);
  });
});
