import { useCallback, useLayoutEffect, useState } from "react";

/**
 * Works out where the preview's page breaks fall.
 *
 * The preview is one continuous run of content clipped into A4-tall windows, so
 * left alone a break lands wherever the sheet happens to run out — halfway
 * through a line of text. @react-pdf does better than that in the PDF: a block
 * marked `wrap={false}` is moved whole onto the next page rather than split.
 *
 * This mirrors that rule. Each `data-avoid-break` block (see `avoid-break.tsx`)
 * is measured in document order, and any block straddling a page boundary is
 * pushed down to start the next page. The pushes are plain top margins, so the
 * gaps they open are real whitespace — which is what makes it safe to clip the
 * content into separate sheets at all.
 *
 * It approximates @react-pdf's layout engine rather than sharing it, so the page
 * count is not guaranteed identical for pathological content — a block taller
 * than a whole page still has to be split, exactly as the PDF splits it.
 */

const AVOID_BREAK = "[data-avoid-break]";

/**
 * A page is 1122.67px tall while `scrollHeight` is a whole number, so a sheet
 * that exactly fills one page measures a fraction over it. Without this slack a
 * full-page sidebar rounds up to 1123px and conjures an empty second page.
 */
const OVERSHOOT_TOLERANCE_PX = 2;

export const paginate = (content: HTMLElement, pageHeight: number): number => {
  const blocks = Array.from(content.querySelectorAll<HTMLElement>(AVOID_BREAK));

  // Start from a clean slate: last pass's margins would otherwise compound.
  for (const block of blocks) block.style.marginTop = "";
  content.style.minHeight = "";

  const contentTop = content.getBoundingClientRect().top;

  for (const block of blocks) {
    // Reading the rect flushes layout, so each block is measured against the
    // shifts already applied to the blocks above it.
    const rect = block.getBoundingClientRect();
    const top = rect.top - contentTop;

    // Nothing to be done for a block that cannot fit on a page of its own.
    if (rect.height > pageHeight) continue;

    const pageBottom = (Math.floor(top / pageHeight) + 1) * pageHeight;
    const overhang = top + rect.height - pageBottom;

    if (overhang > OVERSHOOT_TOLERANCE_PX) block.style.marginTop = `${pageBottom - top}px`;
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
 * Returns the page count for the sheet, and a ref callback to attach to every
 * rendered copy of the content.
 *
 * Each page renders the whole content clipped to its own window, so the same
 * tree exists once per page and every copy has to be shifted identically —
 * hence a set of roots rather than a single ref.
 */
const usePagination = (pageHeight: number) => {
  const [contents, setContents] = useState<HTMLElement[]>([]);
  const [pageCount, setPageCount] = useState(1);

  const registerContent = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    setContents((current) => (current.includes(node) ? current : [...current, node]));
  }, []);

  useLayoutEffect(() => {
    const live = contents.filter((node) => node.isConnected);
    if (live.length !== contents.length) {
      setContents(live);
      return;
    }
    if (live.length === 0) return;

    // Re-measuring on every render would mean a setState with no dependencies —
    // an open invitation to an update loop. Watching the sheet's size instead
    // reacts to the thing that actually matters: the resume growing or shrinking.
    const observer = new ResizeObserver(() => measure());

    const measure = () => {
      // Paginating moves margins around, which would retrigger the observer, so
      // it stays detached for the duration of the pass.
      observer.disconnect();

      // Every copy holds the same tree, so they all resolve to the same count.
      const counts = live.map((node) => paginate(node, pageHeight));
      setPageCount((current) => (counts[0] === current ? current : counts[0]));

      for (const node of live) observer.observe(node);
    };

    measure();

    return () => observer.disconnect();
  }, [contents, pageHeight]);

  return { pageCount, registerContent };
};

export default usePagination;
