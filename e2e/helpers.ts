import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
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
 * translator — report from a popover behind their own icon button, which sits
 * right of Download in the header and in the mobile preview dialog's toolbar.
 *
 * The rows spent a release inline in the overflow menu, so this was once just
 * `openOverflowMenu`. They have their own trigger again: a status nobody can find
 * behind a `…` is not advertising the capability. The panel is a Popover and not
 * a menu — it holds a progress bar and a real button, and the click that starts
 * the download must not close it — so it answers to `role="dialog"`, not
 * `role="menu"`.
 *
 * Matched on the button role rather than the text: the panel's own heading reads
 * "On-device AI" too, so a bare text locator matches the trigger and the label it
 * opens.
 */
export const onDeviceAiTrigger = (page: Page): Locator =>
  page.getByRole("button", { name: "On-device AI" });

/**
 * The trigger stays out of the DOM until at least one capability has stopped
 * probing, so this waits for it rather than clicking cold.
 */
export const openOnDeviceAiPanel = async (page: Page) => {
  await onDeviceAiTrigger(page).click();
  await expect(onDeviceAiPanel(page)).toBeVisible();
};

/** The popover the trigger opens — Radix gives its content `role="dialog"`. */
export const onDeviceAiPanel = (page: Page): Locator => page.getByRole("dialog");

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

/** A4's height in points, the unit PDF coordinates are expressed in. */
export const A4_HEIGHT_PT = 841.89;

export interface PdfPageText {
  /** How many glyph runs the page draws. */
  runs: number;
  /** Distance from the top of the page down to the highest text on it. */
  topGap: number;
  /** Distance from the lowest text on the page down to the bottom of it. */
  bottomGap: number;
}

/**
 * Where the text actually sits on each page, in points from the page edges.
 *
 * Unlike `readPdfFacts` this has to decompress the content streams, because
 * position is only knowable from the drawing operators inside them. @react-pdf
 * resets the text matrix for every run and carries the real offset in the
 * graphics matrix instead, so the y of a run is only correct once the nested
 * `cm` transforms are composed — which means tracking the `q`/`Q` stack rather
 * than reading `Tm` on its own.
 *
 * What it is for: a page break must not leave text jammed against the trim, and
 * that is invisible to any check that only counts pages.
 */
export function readPdfPageText(path: string): PdfPageText[] {
  const raw = readFileSync(path).toString("latin1");

  const contentStreams: string[] = [];
  for (const match of raw.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) continue;

    const bytes = Buffer.from(raw.slice(start, end), "latin1");
    let text: string;
    try {
      text = inflateSync(bytes).toString("latin1");
    } catch {
      text = bytes.toString("latin1");
    }

    // A page's content stream is the one that both selects a font and draws with it.
    if (text.includes("Tf") && text.includes("BT")) contentStreams.push(text);
  }

  type Matrix = [number, number, number, number, number, number];
  const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

  const compose = (inner: Matrix, outer: Matrix): Matrix => [
    inner[0] * outer[0] + inner[1] * outer[2],
    inner[0] * outer[1] + inner[1] * outer[3],
    inner[2] * outer[0] + inner[3] * outer[2],
    inner[2] * outer[1] + inner[3] * outer[3],
    inner[4] * outer[0] + inner[5] * outer[2] + outer[4],
    inner[4] * outer[1] + inner[5] * outer[3] + outer[5],
  ];

  const NUM = String.raw`-?[\d.]+`;
  const operators = new RegExp(
    String.raw`(${NUM})\s+(${NUM})\s+(${NUM})\s+(${NUM})\s+(${NUM})\s+(${NUM})\s+(cm|Tm)` +
      String.raw`|\b(q)\b|\b(Q)\b|\b(BT)\b|(TJ|Tj)`,
    "g",
  );

  return contentStreams.map((stream) => {
    let ctm: Matrix = IDENTITY;
    let textMatrix: Matrix = IDENTITY;
    const stack: Matrix[] = [];
    const ys: number[] = [];

    for (const op of stream.matchAll(operators)) {
      if (op[7]) {
        const matrix = op.slice(1, 7).map(Number) as Matrix;
        if (op[7] === "cm") ctm = compose(matrix, ctm);
        else textMatrix = matrix;
      } else if (op[8]) {
        stack.push(ctm);
      } else if (op[9]) {
        ctm = stack.pop() ?? ctm;
      } else if (op[10]) {
        textMatrix = IDENTITY;
      } else if (op[11]) {
        ys.push(compose(textMatrix, ctm)[5]);
      }
    }

    return {
      runs: ys.length,
      topGap: ys.length ? Math.min(...ys) : 0,
      bottomGap: ys.length ? A4_HEIGHT_PT - Math.max(...ys) : 0,
    };
  });
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
