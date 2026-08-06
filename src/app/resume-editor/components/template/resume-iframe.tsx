"use client";

import dynamic from "next/dynamic";
import { PropsWithChildren, RefObject, useEffect, useRef, useState } from "react";
import Frame from "react-frame-component";
import { useMediaQuery } from "usehooks-ts";

import CropMarks from "@/components/crop-marks";

import { A4_HEIGHT_PX, A4_WIDTH_PX } from "./constants";
import { SHEET_DOCUMENT } from "./sheet-document";
import usePagination from "./use-pagination";
import PagePager from "./page-pager";

/** The full-size sheet, as opposed to a thumbnail of one. */
export const PREVIEW_FRAME_TITLE = "Resume preview";

/** Room either side of the sheet for the crop marks to sit in. */
export const CROP_MARK_GUTTER = 24;

/**
 * A ceiling on the sheet, so it stops growing before it becomes absurd.
 *
 * The preview is driven by the width it is given, which on a 27" monitor is a lot
 * of width — and a sheet grown past its natural size is just a magnified one,
 * with type to match. A4 is 794px at 96dpi, so this holds the preview a little
 * under 1:1 and never above it.
 */
export const MAX_SHEET_WIDTH_PX = 720;

/**
 * How large the sheet can be drawn, measured from the box it is actually in.
 *
 * This used to be arithmetic on `window`: half the viewport wide, and the height
 * minus a hardcoded `navHeight = 56` and two paddings. That worked only while
 * those numbers happened to match the layout, and it silently stopped being true
 * the moment the shell changed — the header is one bar now rather than two, the
 * preview owns its own scroll region, and the padding around the sheet moved. The
 * result was a sheet scaled for a container that no longer existed, sitting in a
 * pane with dead space under it.
 *
 * A ResizeObserver on the real element cannot drift like that. It also picks up
 * every reason the box can change size — the window resizing, yes, but equally
 * the appearance panel opening beside it or a scrollbar appearing — none of
 * which a `window.innerWidth` calculation can see.
 */
const useResumeScale = (containerRef: RefObject<HTMLElement | null>) => {
  const [scale, setScale] = useState(0.5);
  const matches = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;

      /*
        Width decides, on every breakpoint.

        This used to take `Math.min` of the width fit and the height fit, and for
        an A4 sheet in a half-window pane the height always won — so the sheet was
        shrunk until its full length fitted on screen, leaving it floating in the
        middle of a pane it never filled. Fitting the whole page into the viewport
        is not what a preview is for; the pane scrolls, and a page you can read is
        worth more than a whole page you cannot.

        MAX_SHEET_WIDTH_PX is what keeps that honest on a wide monitor, where an
        unbounded sheet would grow past the size any of this is ever printed at.
      */
      const available = Math.min(width - CROP_MARK_GUTTER * 2, MAX_SHEET_WIDTH_PX);

      setScale(available / A4_WIDTH_PX);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => observer.disconnect();
  }, [matches, containerRef]);

  return scale;
};

const ResumeIframe = ({ children }: PropsWithChildren) => {
  // The box the sheet has to fit inside. Measured rather than derived from the
  // window — see `useResumeScale`.
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useResumeScale(containerRef);
  const { pageCount, contentRef } = usePagination(A4_HEIGHT_PX);
  const [page, setPage] = useState(0);

  // Deleting a job can drop the page you were looking at out of existence.
  const currentPage = Math.min(page, pageCount - 1);

  return (
    // Anchored to the top rather than centred. The sheet is sized to fill the
    // width now, so it is usually taller than the pane — and a centred box taller
    // than its container overflows equally in both directions, putting the top of
    // the resume above the scroll origin where it cannot be reached.
    <div ref={containerRef} className="flex w-full flex-col items-center gap-4 py-6">
      <div
        className="relative"
        style={{
          maxWidth: `${A4_WIDTH_PX * scale}px`,
          maxHeight: `${A4_HEIGHT_PX * scale}px`,
        }}
      >
        {/* Desktop only: at mobile widths the sheet is already the width of the
            screen, and 24px of gutter either side costs more than the marks add. */}
        <CropMarks className="hidden border-muted-foreground/40 md:block" />
        {/* There is an outer div and an inner div here. The inner div sets the iframe width and uses transform scale to zoom in/out the resume iframe.
            While zooming out or scaling down via transform, the element appears smaller but still occupies the same width/height. Therefore, we use the
            outer div to restrict the max width & height proportionally */}
        <div
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${A4_HEIGHT_PX}px`,
            transform: `scale(${scale})`,
            borderRadius: "2px",
            overflow: "hidden",
          }}
          className="origin-top-left bg-white shadow-[0_18px_50px_-20px_rgba(23,21,15,0.45)]"
        >
          <Frame
            // Names the sheet apart from the picker's thumbnail frames, which are
            // also sheets in iframes.
            title={PREVIEW_FRAME_TITLE}
            style={{ width: "100%", height: "100%", border: 0 }}
            initialContent={SHEET_DOCUMENT}
          >
            {/* One A4 window onto a single copy of the resume: paging slides that
                copy up by whole pages behind it. `use-pagination` has already
                pushed any unbreakable block clear of the boundaries, so a page
                never opens or closes mid-entry. */}
            <div
              data-resume-page={currentPage + 1}
              style={{ position: "relative", height: `${A4_HEIGHT_PX}px`, overflow: "hidden" }}
            >
              <div
                ref={contentRef}
                style={{
                  position: "absolute",
                  top: `${-currentPage * A4_HEIGHT_PX}px`,
                  left: 0,
                  right: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {children}
              </div>
            </div>
          </Frame>
        </div>
      </div>

      <PagePager pageCount={pageCount} page={currentPage} onSelect={setPage} />
    </div>
  );
};

const ResumeIframeCSR = dynamic(() => Promise.resolve(ResumeIframe), {
  ssr: false,
});

export default ResumeIframeCSR;
