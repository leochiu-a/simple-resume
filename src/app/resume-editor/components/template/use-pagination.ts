import { useLayoutEffect, useState } from "react";

/**
 * Works out where the preview's page breaks fall.
 *
 * The preview is one continuous run of content shown through an A4-tall window,
 * so left alone a break lands wherever the sheet happens to run out — through the
 * middle of a line of text. @react-pdf does better than that in the PDF, and this
 * mirrors its two rules:
 *
 * - a block marked `wrap={false}` (see `avoid-break.tsx`) moves whole onto the
 *   next page rather than being split;
 * - everything else may split, but only between lines of text.
 *
 * Both are enforced the same way: the offending element gets a top margin that
 * pushes the break down to a place it is allowed to happen. The margins open real
 * whitespace, which is what makes it safe to show the content through a hard-edged
 * window at all. The second rule is the cheaper of the two — it costs at most one
 * line of blank space, where treating a paragraph as unbreakable would cost the
 * rest of the page.
 *
 * It approximates @react-pdf's layout engine rather than sharing it, so the page
 * count is not guaranteed identical for pathological content — a block taller than
 * a whole page still has to be split, exactly as the PDF splits it.
 */

const AVOID_BREAK = "[data-avoid-break]";

/** @react-pdf renders `Text` as this element; the preview reads it back. */
const TEXT = "text";

/** Marks an element carrying a pagination nudge, so the next pass can undo it. */
const NUDGED = "data-page-nudged";

/**
 * A page is 1122.67px tall while `scrollHeight` is a whole number, so a sheet that
 * exactly fills one page measures a fraction over it. Without this slack a
 * full-page sidebar rounds up to 1123px and conjures an empty second page. It also
 * absorbs the 1/64px that browsers round layout to.
 */
const OVERSHOOT_TOLERANCE_PX = 2;

/**
 * Where a nudge has to be applied to actually move something.
 *
 * @react-pdf's `Text` lands in the DOM as an unknown `<text>` element, which the
 * browser treats as inline — and `margin-top` does nothing to an inline box. The
 * shift is a pure downward translation, so applying it to the nearest block-level
 * ancestor moves the text by exactly the same amount. Forcing `display: block` on
 * the text itself would be simpler and wrong: it would break the templates that
 * set a bold title and a regular date on one line.
 */
const shiftTarget = (element: HTMLElement, root: HTMLElement) => {
  const view = element.ownerDocument.defaultView;
  let node: HTMLElement | null = element;

  while (view && node && node !== root) {
    if (view.getComputedStyle(node).display !== "inline") return node;
    node = node.parentElement;
  }

  return element;
};

/**
 * The top and bottom of each line of text in an element, measured from the sheet's
 * top. A range over the element's contents yields one client rect per line box,
 * which is the only way to see where the browser chose to wrap.
 */
const lineBoxes = (element: HTMLElement, sheetTop: number) => {
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);

  return Array.from(range.getClientRects()).map((rect) => ({
    top: rect.top - sheetTop,
    bottom: rect.bottom - sheetTop,
  }));
};

export const paginate = (content: HTMLElement, pageHeight: number): number => {
  // Both rules apply to a single walk in document order: an outer unbreakable
  // block is resolved before the text inside it, so the text only needs handling
  // if the block is too tall to move as one piece.
  const candidates = Array.from(
    content.querySelectorAll<HTMLElement>(`${AVOID_BREAK}, ${TEXT}`),
  ).filter(
    // Nested text would otherwise be nudged twice, once via its parent.
    (element) => element.hasAttribute("data-avoid-break") || !element.querySelector(TEXT),
  );

  // Start from a clean slate: last pass's margins would otherwise compound. A
  // nudge can land on an ancestor rather than the candidate itself, so the marker
  // is what tracks them down rather than the candidate list.
  for (const nudged of content.querySelectorAll<HTMLElement>(`[${NUDGED}]`)) {
    nudged.style.marginTop = "";
    nudged.removeAttribute(NUDGED);
  }
  content.style.minHeight = "";

  const nudge = (element: HTMLElement, by: number) => {
    element.style.marginTop = `${by}px`;
    element.setAttribute(NUDGED, "");
  };

  const sheetTop = content.getBoundingClientRect().top;

  for (const element of candidates) {
    // Reading the rect flushes layout, so each element is measured against the
    // shifts already applied above it.
    const rect = element.getBoundingClientRect();
    const top = rect.top - sheetTop;
    const boundary = (Math.floor(top / pageHeight) + 1) * pageHeight;

    // Comfortably clear of the boundary, or already ending on it.
    if (top + rect.height - boundary <= OVERSHOOT_TOLERANCE_PX) continue;

    if (element.hasAttribute("data-avoid-break")) {
      // Too tall to fit a page of its own: it has to split, as it does in the PDF.
      if (rect.height > pageHeight) continue;

      nudge(element, boundary - top);
      continue;
    }

    // Text may split, but not through a line. Find the line the boundary lands
    // inside and move it down to start the next page; if the boundary already
    // falls in the gap between two lines, there is nothing to fix.
    const straddled = lineBoxes(element, sheetTop).find(
      (line) =>
        line.top < boundary - OVERSHOOT_TOLERANCE_PX &&
        line.bottom > boundary + OVERSHOOT_TOLERANCE_PX,
    );

    if (straddled) nudge(shiftTarget(element, content), boundary - straddled.top);
  }

  const pageCount = Math.max(
    1,
    Math.ceil((content.scrollHeight - OVERSHOOT_TOLERANCE_PX) / pageHeight),
  );

  // Round the sheet up to whole pages. Without this a template's full-height
  // sidebar stops where the text ends, leaving a pale stub on the last page.
  content.style.minHeight = `${pageCount * pageHeight}px`;

  return pageCount;
};

/**
 * Returns the sheet's page count and a ref callback for the content node.
 *
 * Only the page being looked at is rendered, so there is exactly one copy of the
 * resume in the document however many pages it runs to — paging is a matter of
 * sliding that copy up behind the sheet's window.
 */
const usePagination = (pageHeight: number) => {
  const [content, setContent] = useState<HTMLElement | null>(null);
  const [pageCount, setPageCount] = useState(1);

  useLayoutEffect(() => {
    if (!content) return;

    // Re-measuring on every render would mean a setState with no dependencies —
    // an open invitation to an update loop. Watching the sheet's size instead
    // reacts to the thing that actually matters: the resume growing or shrinking.
    const observer = new ResizeObserver(() => measure());

    const measure = () => {
      // Paginating moves margins around, which would retrigger the observer, so
      // it stays detached for the duration of the pass.
      observer.disconnect();
      setPageCount(paginate(content, pageHeight));
      observer.observe(content);
    };

    measure();

    return () => observer.disconnect();
  }, [content, pageHeight]);

  return { pageCount, contentRef: setContent };
};

export default usePagination;
