import { readFileSync } from "node:fs";
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Appearance (template and colour) is no longer a dropdown in the header. A
 * palette button floats over the preview, and clicking it swaps the editing
 * column beside it for the appearance panel — a mode, not a popover. The panel's
 * ✕ is the way back.
 *
 * Its contents are ordinary buttons rather than `menuitem`s: a grid of template
 * thumbnails and a row of colour swatches, neither of which a menu's roving
 * tabindex handles well.
 */
export const appearanceMenu = (page: Page): Locator =>
  page.getByRole("button", { name: "Template and colour" });

export const closeAppearance = (page: Page) =>
  page.getByRole("button", { name: "Close appearance" }).click();

/** The desk the sheet lies on — the hover target that reveals the palette button. */
export const previewPane = (page: Page): Locator => page.locator("[data-preview-pane]");

export const downloadMenu = (page: Page): Locator =>
  page.getByRole("button", { name: "Download", exact: true });

/**
 * Hover the preview first, then click.
 *
 * The palette button is `opacity-0 pointer-events-none` until the pointer is over
 * the preview pane, so clicking it cold never becomes actionable and Playwright
 * waits out the full timeout. Hovering the pane is what a real user does on the
 * way to the button, and it is what makes the button clickable.
 *
 * Below the desktop breakpoint there is no preview pane — the controls live in
 * the mobile dialog's toolbar, where the button is always solid — so the hover is
 * skipped rather than waited for.
 */
export const openAppearanceMenu = async (page: Page) => {
  const pane = previewPane(page);
  if (await pane.isVisible()) {
    // Top-left of the pane rather than its middle: the middle is the sheet, and
    // the sheet is an iframe. `group-hover` still fires either way, but aiming at
    // the desk keeps this independent of how large the sheet happens to be.
    await pane.hover({ position: { x: 4, y: 4 } });
  }

  await appearanceMenu(page).click();
};

/**
 * Selects a template, then leaves the panel.
 *
 * Closing again matters: the panel replaces the form in the editing column, so a
 * test that picks a template and then asserts on a field would find it hidden.
 * Every caller wants the same thing — change the template, carry on — so the
 * round trip belongs here rather than in each of them.
 */
export const selectTemplate = async (page: Page, label: string) => {
  await openAppearanceMenu(page);
  // The accessible name is "<label> — <description>", so match on the prefix.
  const card = page.getByRole("button", { name: new RegExp(`^${label} —`) });
  await card.click();
  // The panel stays open on select; the chosen page is the one marked pressed.
  await expect(card).toHaveAttribute("aria-pressed", "true");
  await closeAppearance(page);
};

/** The presets live in the panel; this opens the full picker under them. */
export const openColorPicker = async (page: Page) => {
  await openAppearanceMenu(page);
  await page.getByRole("button", { name: "Custom…" }).click();
};

export const downloadPdf = async (page: Page) => {
  await downloadMenu(page).click();
  await page.getByRole("menuitem", { name: "Download PDF" }).click();
};

export const downloadHtml = async (page: Page) => {
  await downloadMenu(page).click();
  await page.getByRole("menuitem", { name: "Download HTML" }).click();
};

/** Unlike the two downloads, this item keeps the menu open to confirm the copy. */
export const copyMarkdown = async (page: Page) => {
  await downloadMenu(page).click();
  await page.getByRole("menuitem", { name: "Copy as Markdown" }).click();
};

/**
 * The editor's overflow menu — everything that is neither the wordmark, the
 * language tabs, nor the download button. Theme, the on-device AI row and the
 * GitHub link all live behind it now, so reaching any of them starts here.
 */
export const overflowMenu = (page: Page): Locator => page.getByRole("button", { name: "More" });

export const openOverflowMenu = (page: Page) => overflowMenu(page).click();

/** Theme is three menu items behind the overflow menu rather than its own button. */
export const setTheme = async (page: Page, mode: "Light" | "Dark" | "System") => {
  await openOverflowMenu(page);
  await page.getByRole("menuitem", { name: mode, exact: true }).click();
};

/**
 * Both browser-built-in capabilities — the WebMCP agent and the on-device
 * translator — report from inside the overflow menu, so anything that reads one
 * of their statuses only has to open that.
 *
 * There used to be a second click here, onto a row that opened a nested popover.
 * The rows are rendered inline now, so opening the menu is the whole gesture.
 */
export const openOnDeviceAiPanel = (page: Page) => openOverflowMenu(page);

/** The editor stores every language of the resume under one key. */
export const DOC_STORAGE_KEY = "resume-doc";

/** The language tabs are a segmented control in the header's centre slot. */
export const languageButton = (page: Page, label: string): Locator =>
  page.getByRole("tab", { name: new RegExp(`^${label}`) });

/**
 * The resume preview is rendered inside an iframe via react-frame-component. The
 * template picker's thumbnails are iframes too, so the sheet is addressed by its
 * title — `frameLocator` is strict, and an open picker would otherwise match five.
 */
export const preview = (page: Page) => page.frameLocator('iframe[title="Resume preview"]');

/** The landing page's hero sheet, which is a third iframe-hosted sheet — the same
 *  rendering as the editor's preview, addressed by its own title. */
export const landingSheet = (page: Page) => page.frameLocator('iframe[title="Template preview"]');

export interface PdfFacts {
  bytes: number;
  header: string;
  hasEof: boolean;
  pages: number;
  embeddedFonts: string[];
  linkAnnotations: number;
}

/**
 * Parses the structural facts we care about straight out of the PDF bytes.
 * Content streams are Flate-compressed, so this deliberately only inspects
 * things that live uncompressed in the object dictionaries.
 */
export function readPdfFacts(path: string): PdfFacts {
  const buf = readFileSync(path);
  const raw = buf.toString("latin1");

  const fonts = [
    ...new Set([...raw.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+\-,]+)/g)].map((m) => m[1])),
  ];

  return {
    bytes: buf.byteLength,
    header: raw.slice(0, 8),
    hasEof: raw.trimEnd().endsWith("%%EOF"),
    pages: (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length,
    embeddedFonts: fonts,
    linkAnnotations: (raw.match(/\/Type\s*\/Annot/g) ?? []).length,
  };
}

/**
 * Radix's scroll-lock and focus-guard side effects are applied to <body>.
 * Asserting they are fully removed is the regression guard for the React 19
 * upgrade: react-remove-scroll 2.6.0 left `data-scroll-locked` and
 * `pointer-events: none` behind after an overlay closed, freezing the page.
 */
export async function expectBodyUnlocked(page: Page) {
  const body = page.locator("body");
  await expect(body).not.toHaveAttribute("data-scroll-locked", /.*/);

  const computed = await page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return {
      pointerEvents: style.pointerEvents,
      // react-remove-scroll compensates for the scrollbar it hides by padding the
      // body. Left behind, that padding is as visible as the freeze itself — and
      // unlike `overflow` it is never something this app sets deliberately.
      paddingRight: style.paddingRight,
    };
  });

  /*
    Deliberately no longer asserting `overflow !== "hidden"`.

    That was a proxy for "react-remove-scroll has cleaned up", and it stopped
    being one: the editor now locks <html> and <body> to the viewport itself so
    the two columns can own their scrolling, so `hidden` is the app's own correct
    resting state there rather than a leftover. Asserting against it would have
    forced the page to keep a scrollbar it is designed not to have.

    What actually distinguishes "locked" from "not locked" is unchanged and still
    checked: the `data-scroll-locked` attribute Radix stamps on, the
    `pointer-events: none` that froze the page in the React 19 bug, and the
    scrollbar-compensation padding.
  */
  expect(computed.pointerEvents).toBe("auto");
  expect(computed.paddingRight).toBe("0px");
}

/**
 * Vercel Web Analytics fetches /_vercel/insights/script.js, which only exists
 * when served by Vercel. Outside it that 404s, so it is environment noise rather
 * than an application error. Nothing else is ignored.
 */
const IGNORED_CONSOLE_ERRORS = [/_vercel\/insights/, /404 \(Not Found\)/];

/**
 * Collects console errors so runtime failures cannot pass silently. Returns the
 * live array — assert on it at the end of the test.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  const record = (text: string) => {
    if (!IGNORED_CONSOLE_ERRORS.some((pattern) => pattern.test(text))) {
      errors.push(text);
    }
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") record(msg.text());
  });
  page.on("pageerror", (err) => record(String(err)));
  page.on("response", (res) => {
    const url = res.url();
    if (res.status() >= 400 && !IGNORED_CONSOLE_ERRORS.some((p) => p.test(url))) {
      record(`${res.status()} ${url}`);
    }
  });

  return errors;
}
