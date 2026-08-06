/**
 * Silences the React dev warnings that rendering @react-pdf primitives to the DOM
 * produces.
 *
 * A template is a tree of @react-pdf components, and on screen those reconcile
 * into real DOM as `<DOCUMENT>`, `<PAGE>`, `<VIEW>`, `<TEXT>`, `<LINK>`. React
 * sees uppercase tags that are neither components nor known HTML elements and
 * logs two dev-only warnings per element — "is using incorrect casing" and "is
 * unrecognized in this browser". One mount of the preview plus the picker's
 * thumbnails is 300+ console errors, which buries anything real.
 *
 * Nothing here is fixable at the call site: the tags are *meant* to be unknown
 * elements. `SHEET_DOCUMENT` gives `document` and `page` their layout by tag name
 * precisely because the browser has no opinion about them, and the PDF build
 * needs the same tree. The warning describes the design, so the only move left is
 * to stop printing it.
 *
 * Why here and not inside the sheet's iframe, which is where these elements land:
 * React DOM runs in *this* page and only writes nodes into the iframe, so the
 * warning is emitted by the parent's `console` and an iframe-scoped patch never
 * sees it. That was verified the wrong way round once already — the stack on a
 * captured warning runs through the page's own react-dom chunk.
 *
 * Kept narrow deliberately:
 *   - only the two exact dev-warning prefixes, matched on a string first
 *     argument, so every other `console.error` passes through untouched;
 *   - only in development, since React ships neither warning in production;
 *   - installed once, at module scope, before any template mounts.
 */
const IGNORED_PREFIXES = [
  "<%s /> is using incorrect casing",
  "The tag <%s> is unrecognized in this browser",
];

declare global {
  interface Window {
    __pdfTagWarningsSilenced?: boolean;
  }
}

if (
  process.env.NODE_ENV !== "production" &&
  typeof window !== "undefined" &&
  !window.__pdfTagWarningsSilenced
) {
  window.__pdfTagWarningsSilenced = true;

  /* eslint-disable no-console -- reassigning console.error is the entire purpose
     of this module; there is no other hook for a warning React logs directly. */
  const original = console.error;

  console.error = (...args: unknown[]) => {
    const [format] = args;

    if (typeof format === "string" && IGNORED_PREFIXES.some((p) => format.startsWith(p))) {
      return;
    }

    original(...args);
  };
  /* eslint-enable no-console */
}

export {};
