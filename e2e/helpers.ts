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

/**
 * The share menu. Named `downloadMenu` still because most of its callers are about
 * the two downloads; the trigger itself says "Share", since the menu covers every
 * direction a resume moves — two files, two clipboard copies, and the import.
 */
export const downloadMenu = (page: Page): Locator =>
  page.getByRole("button", { name: "Share", exact: true });

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

/** Same confirm-in-place behaviour as the Markdown item. */
export const copyShareLink = async (page: Page) => {
  await downloadMenu(page).click();
  await page.getByRole("menuitem", { name: "Copy share link" }).click();
};

/** Importing shares the Share menu with the exports, under a separator. */
export const openImportDialog = async (page: Page) => {
  await downloadMenu(page).click();
  await page.getByRole("menuitem", { name: "Import from link…" }).click();

  return page.getByRole("dialog");
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
 * right of Share in the header and in the mobile preview dialog's toolbar.
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
 * The offer to start a second language, which is a dashed `＋` slot beside the
 * tabs rather than one of them — a document with one language has one tab.
 *
 * Named in English (`Add English version`) because that is the button's
 * accessible name: the visible label is the language in its own script, which
 * beside a tab of the same name says nothing about what pressing it does.
 */
export const addLanguageButton = (page: Page, name: string): Locator =>
  page.getByRole("button", { name: `Add ${name} version` });

/**
 * The lone chip a single-language document has instead of tabs, which says what
 * language it is written in and is the only way to correct that.
 *
 * Named in English for the same reason as `addLanguageButton`: the visible label
 * is the language in its own script, and the accessible name is the sentence.
 */
export const soleLanguageButton = (page: Page, name: string): Locator =>
  page.getByRole("button", { name: `Written in ${name}` });

/**
 * The resume preview is rendered inside an iframe via react-frame-component. The
 * template picker's thumbnails are iframes too, so the sheet is addressed by its
 * title — `frameLocator` is strict, and an open picker would otherwise match five.
 */
export const preview = (page: Page) => page.frameLocator('iframe[title="Resume preview"]');

/**
 * The landing page's hero sheet, which is a third iframe-hosted sheet — the same
 * rendering as the editor's preview, addressed by its own title.
 *
 * `.first()` is required, not defensive: the template gallery renders all five
 * templates live, so this title now matches six frames and `frameLocator` is strict.
 * The hero's sheet is first in the DOM, which is what makes the index meaningful
 * rather than arbitrary.
 */
export const landingSheet = (page: Page) =>
  page.frameLocator('iframe[title="Template preview"]').first();

/** One gallery card's sheet, by the template's position in `TEMPLATES`. Offset by one
 *  to step over the hero's copy. */
export const gallerySheet = (page: Page, index: number) =>
  page.frameLocator('iframe[title="Template preview"]').nth(index + 1);

export interface PdfFacts {
  bytes: number;
  header: string;
  hasEof: boolean;
  pages: number;
  embeddedFonts: string[];
  linkAnnotations: number;
  /** Where those annotations point, in document order — a count alone cannot tell
   *  a missing link from one that landed on the wrong url. */
  linkTargets: string[];
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
    linkTargets: [...raw.matchAll(/\/URI\s*\(([^)]*)\)/g)].map((m) => m[1]),
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

/**
 * Where each unbreakable block on the sheet sits, and how much room is left at the
 * foot of every page.
 *
 * Used to check how a template breaks a long entry. Held together as one block, an
 * entry that does not fit in what is left of a page moves onto the next one whole
 * and leaves a hole most of a page tall behind it; split into a run of blocks, it
 * spills down the page and breaks between two bullets instead. The gap at the foot
 * of a page is what tells those two apart.
 *
 * `headPattern` picks out the block that opens a run — the one carrying the
 * headline — so the caller can assert the headline is bound to what follows it.
 *
 * Two things are waited for before anything is measured, and both were flakes
 * first.
 *
 * The pager, because it is the preview's own signal that it has finished
 * paginating. Read before that, the sheet is still one long page: every block
 * reports page 0, no page has another after it, and `trailingGaps` comes back
 * empty — which surfaces at the call site as `Math.min(...) === Infinity` rather
 * than as "measured too early".
 *
 * The iframe's fonts, because until they load the sheet is laid out in a fallback
 * face whose metrics are not Noto's. Lines wrap in different places, blocks come
 * out a different height, and the same seed paginates differently from run to run
 * — the same cause as a preview screenshot that comes out unexpectedly serif.
 * This was a 1-in-4 flake here and is the likeliest explanation for the
 * occasional unrelated failure elsewhere in the layout suites.
 */
export const entryBlockLayout = async (page: Page, headPattern: RegExp) => {
  const A4_PX = (842 * 4) / 3;

  await expect(page.getByRole("navigation", { name: "Resume pages" })).toBeVisible();
  await preview(page)
    .locator("page")
    .first()
    .evaluate((sheet) => (sheet.ownerDocument as Document).fonts.ready);

  return preview(page)
    .locator("[data-resume-page] > div")
    .first()
    .evaluate(
      (content, { pageHeight, source }) => {
        const sheet = content.ownerDocument.querySelector<HTMLElement>("page")!;
        const bottomMargin = Number.parseFloat(getComputedStyle(sheet).paddingBottom) || 0;
        const sheetTop = content.getBoundingClientRect().top;
        const isHeadBlock = new RegExp(source);

        const blocks = [...content.querySelectorAll<HTMLElement>("[data-avoid-break]")].map(
          (el) => {
            const { top, height } = el.getBoundingClientRect();
            const offset = top - sheetTop;

            return {
              isHead: isHeadBlock.test(el.textContent ?? ""),
              /** Text runs inside, which is how a binding to the first bullet shows up. */
              runsInside: el.querySelectorAll("text").length,
              top: offset,
              bottom: offset + height,
              page: Math.floor(offset / pageHeight),
            };
          },
        );

        /*
         * How much room is left below the last block that *starts* on each page.
         *
         * Only pages that something else follows are measured. The last page of the
         * sheet is left out because its gap is just where the resume happens to
         * end — it says nothing about how a break was chosen — and it would
         * otherwise be the smallest or largest number here for no reason.
         *
         * A block can also reach past its page's limit, which is the entry too tall
         * for any page: the paginator lets that split rather than loop forever.
         * Those give a negative gap, so they are dropped too; the question this
         * answers is whether a page that *could* have been filled was.
         */
        const pages = [...new Set(blocks.map((b) => b.page))].sort((a, b) => a - b);
        const lastPage = Math.max(...pages);

        return {
          blocks,
          trailingGaps: pages
            .filter((index) => index !== lastPage)
            .map((index) => {
              const last = Math.max(...blocks.filter((b) => b.page === index).map((b) => b.bottom));
              return (index + 1) * pageHeight - bottomMargin - last;
            })
            .filter((gap) => gap >= 0),
        };
      },
      { pageHeight: A4_PX, source: headPattern.source },
    );
};
