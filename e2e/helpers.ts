import { readFileSync } from "node:fs";
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * The nav carries two controls: appearance (template and colour) and download
 * (PDF and HTML). Both are dropdowns, so reaching what is inside them is an
 * action rather than a locator.
 */
export const appearanceMenu = (page: Page): Locator =>
  page.getByRole("button", { name: "Change template" });

export const downloadMenu = (page: Page): Locator =>
  page.getByRole("button", { name: "Download", exact: true });

export const openAppearanceMenu = (page: Page) => appearanceMenu(page).click();

/** Selects a template by its label in the appearance menu. */
export const selectTemplate = async (page: Page, label: string) => {
  await openAppearanceMenu(page);
  await page.getByRole("menuitem").filter({ hasText: label }).click();
  await expect(appearanceMenu(page)).toContainText(label);
};

/** The presets live in the menu; this opens the full picker behind them. */
export const openColorPicker = async (page: Page) => {
  await openAppearanceMenu(page);
  await page.getByRole("menuitem", { name: "Custom colour…" }).click();
};

export const downloadPdf = async (page: Page) => {
  await downloadMenu(page).click();
  await page.getByRole("menuitem", { name: "Download PDF" }).click();
};

export const downloadHtml = async (page: Page) => {
  await downloadMenu(page).click();
  await page.getByRole("menuitem", { name: "Download HTML" }).click();
};

export const themeToggle = (page: Page): Locator =>
  page.getByRole("button", { name: "Toggle theme" });

/**
 * The nav's chip button. Both browser-built-in capabilities — the WebMCP agent
 * and the on-device translator — report from the panel behind it, so anything
 * that used to read a status off the nav has to open this first.
 */
export const onDeviceAiButton = (page: Page): Locator =>
  page.getByRole("button", { name: "On-device AI" });

export const openOnDeviceAiPanel = (page: Page) => onDeviceAiButton(page).click();

/** The editor stores every language of the resume under one key. */
export const DOC_STORAGE_KEY = "resume-doc";

export const languageButton = (page: Page, label: string): Locator =>
  page.getByRole("button", { name: new RegExp(`^${label}`) });

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
    return { overflow: style.overflow, pointerEvents: style.pointerEvents };
  });
  expect(computed.overflow).not.toBe("hidden");
  expect(computed.pointerEvents).toBe("auto");
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
