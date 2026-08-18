import { useLayoutEffect, useState } from "react";

/**
 * Works out where the preview's page breaks fall.
 *
 * The preview is one continuous run of content shown through an A4-tall window,
 * so left alone a break lands wherever the sheet happens to run out — through the
 * middle of a line of text, and hard against the trim. @react-pdf does better
 * than that in the PDF, and this mirrors what it does:
 *
 * - every page keeps a margin clear at its top and bottom, which is the `Page`'s
 *   own padding — @react-pdf re-applies it to each page the content spills onto,
 *   while the preview's single copy of that CSS only ever indents the first and
 *   the last;
 * - nothing may reach into that margin: a block that would moves whole onto the
 *   next page, whether or not it is marked `wrap={false}` (see `avoid-break.tsx`).
 *
 * Both are enforced with a top margin on the offending element, which pushes it
 * down to somewhere it is allowed to sit. Those margins open real whitespace,
 * which is what makes it safe to show the content through a hard-edged window at
 * all.
 *
 * It approximates @react-pdf's layout engine rather than sharing it, so the page
 * count is not guaranteed identical for pathological content. The one place it
 * knowingly falls short: a single run of text taller than a whole page has to
 * split, and no margin can open a page's margins around a split *inside* an
 * element — a margin moves every line of it by the same amount. Such a run breaks
 * between lines, at the trim, where the PDF gives it the page's margins. Text
 * arrives as one element per typed line (see `summary.tsx`), so this is the
 * single-paragraph-longer-than-a-page case rather than the long-profile one.
 */

const AVOID_BREAK = "[data-avoid-break]";

/** @react-pdf renders `Text` as this element; the preview reads it back. */
const TEXT = "text";

/**
 * Marks an element carrying a pagination nudge, so the next pass can undo it. Its
 * value is the `margin-top` the template itself had written there — see `nudge`.
 */
const NUDGED = "data-page-nudged";

/**
 * A page is 1122.67px tall while `scrollHeight` is a whole number, so a sheet that
 * exactly fills one page measures a fraction over it. Without this slack a
 * full-page sidebar rounds up to 1123px and conjures an empty second page. It also
 * absorbs the 1/64px that browsers round layout to.
 */
const OVERSHOOT_TOLERANCE_PX = 2;

/**
 * The band each page keeps clear at its top and bottom, read off the sheet rather
 * than configured here.
 *
 * @react-pdf re-applies a page's padding to every page the content spills onto, so
 * that padding *is* the margin the printed resume has. The preview is one
 * continuous run of content behind an A4 window, where the same CSS padding only
 * ever indents the first and last page — so the value has to be read back and
 * honoured at each break by hand. Taking it from the element keeps the two
 * renderers agreeing by construction: a template that changes its page padding
 * moves the preview's breaks with it.
 */
const safeArea = (content: HTMLElement) => {
  const page = content.querySelector<HTMLElement>("page");
  const style = page?.ownerDocument.defaultView?.getComputedStyle(page);

  return {
    top: Number.parseFloat(style?.paddingTop ?? "") || 0,
    bottom: Number.parseFloat(style?.paddingBottom ?? "") || 0,
  };
};

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
  //
  // Restoring the recorded value rather than clearing the property: a template's
  // own spacing is an inline style too — the same style objects the PDF is built
  // from are handed to React as `style` — so blanking `margin-top` here does not
  // fall back to the template's gap, it deletes it. React will not put it back
  // either, since the prop it rendered never changed. That is what used to make an
  // entry that had once been nudged sit flush against the bullet above it.
  for (const nudged of content.querySelectorAll<HTMLElement>(`[${NUDGED}]`)) {
    nudged.style.marginTop = nudged.getAttribute(NUDGED) ?? "";
    nudged.removeAttribute(NUDGED);
  }
  content.style.minHeight = "";

  /**
   * Pushes an element `by` pixels further down, on top of whatever margin it
   * already carries — the template's gap, or an earlier nudge in this same pass
   * (a shift target can be the block-level ancestor of more than one candidate,
   * and each `by` is measured against the shifts already applied above it).
   *
   * The margin the template wrote is stashed on the marker so the next pass can
   * hand it back untouched.
   */
  const nudge = (element: HTMLElement, by: number) => {
    const view = element.ownerDocument.defaultView;
    const current = Number.parseFloat(view?.getComputedStyle(element).marginTop ?? "") || 0;

    if (!element.hasAttribute(NUDGED)) element.setAttribute(NUDGED, element.style.marginTop);
    element.style.marginTop = `${current + by}px`;
  };

  const sheetTop = content.getBoundingClientRect().top;
  const safe = safeArea(content);

  /** How much of a page is left to put content on, once its margins are taken. */
  const usableHeight = pageHeight - safe.top - safe.bottom;

  /** Which page an offset falls on, and what that page allows. */
  const placement = (top: number) => {
    const index = Math.floor(top / pageHeight);
    const boundary = (index + 1) * pageHeight;

    return {
      index,
      /** The page edge itself, which only content too tall to place still meets. */
      boundary,
      /** Where content may begin on this page. */
      start: index * pageHeight + safe.top,
      /** How far down this page content may reach. */
      limit: boundary - safe.bottom,
      /** Where content lands when it gives up and starts the next page. */
      next: boundary + safe.top,
    };
  };

  for (const element of candidates) {
    // Reading the rect flushes layout, so each element is measured against the
    // shifts already applied above it.
    const rect = element.getBoundingClientRect();
    const top = rect.top - sheetTop;
    const { index, boundary, start, limit, next } = placement(top);

    // Stranded in a page's top margin — a gap between two blocks can drop
    // something there without it ever reaching far enough down to be caught by
    // the rule below. The first page is left alone: nothing has been moved onto
    // it, so anything sitting above the margin there is the template's own doing.
    if (index > 0 && start - top > OVERSHOOT_TOLERANCE_PX) {
      nudge(shiftTarget(element, content), start - top);
      continue;
    }

    // Comfortably clear of the page's bottom margin, or ending exactly on it.
    if (top + rect.height - limit <= OVERSHOOT_TOLERANCE_PX) continue;

    /*
     * It fits on a page, so it moves onto the next one whole — text as much as an
     * unbreakable block.
     *
     * Splitting text between its lines instead is not an option a margin can
     * offer, however much cheaper it would be. A margin moves every line of the
     * element by the same amount: a shift big enough to carry the overflowing
     * line past the boundary drags the line above it down into the margin the
     * shift was opening. There is no value that leaves one line behind and moves
     * the next, and pushing repeatedly only walks the whole block down the sheet.
     */
    if (rect.height <= usableHeight) {
      nudge(shiftTarget(element, content), next - top);
      continue;
    }

    // Taller than any page: it has to split, exactly as the PDF splits it, and
    // for the same reason the margins cannot be opened around the split. What is
    // still worth doing is keeping the break out of the middle of a line — the
    // line the page edge falls through starts the next page instead.
    if (element.hasAttribute("data-avoid-break")) continue;

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

    // The sheet's webfonts arrive after first paint, and different metrics mean
    // different line wrapping — so the first measurement is taken against fallback
    // fonts and can be wrong. A resize usually catches it, but not reliably: a
    // reflow that shuffles line breaks without changing the total height leaves a
    // stale answer behind.
    let cancelled = false;
    content.ownerDocument.fonts?.ready.then(() => {
      if (!cancelled && content.isConnected) measure();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [content, pageHeight]);

  return { pageCount, contentRef: setContent };
};

export default usePagination;
