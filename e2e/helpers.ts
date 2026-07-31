import { readFileSync } from "node:fs";
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * The palette button that toggles the background-colour picker has no
 * accessible name (it renders only an icon), so it is located structurally: it
 * is the only `div.relative > button` on the page, sitting next to Download.
 */
export const paletteButton = (page: Page): Locator => page.locator("div.relative > button");

export const downloadPdfButton = (page: Page): Locator =>
  page.getByRole("button", { name: "Download PDF", exact: true });

export const downloadHtmlButton = (page: Page): Locator =>
  page.getByRole("button", { name: "Download HTML", exact: true });

export const themeToggle = (page: Page): Locator =>
  page.getByRole("button", { name: "Toggle theme" });

/** The resume preview is rendered inside an iframe via react-frame-component. */
export const preview = (page: Page) => page.frameLocator("iframe");

/** Sparkle SVGs injected by SparklesText, siblings of the <strong> heading. */
export const sparkles = (page: Page): Locator =>
  page.locator("span.relative.inline-block:has(strong) > svg");

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
