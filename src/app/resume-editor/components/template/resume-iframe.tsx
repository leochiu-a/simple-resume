"use client";

import dynamic from "next/dynamic";
import { PropsWithChildren, useRef, useState } from "react";
import Frame from "react-frame-component";

import CropMarks from "@/components/crop-marks";

// Side-effect import: quiets the ~50 dev warnings per mount that @react-pdf's
// uppercase primitives draw from React. See the module for why it cannot live in
// the sheet's iframe.
import "./silence-pdf-tag-warnings";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "./constants";
import { SHEET_DOCUMENT } from "./sheet-document";
import usePagination from "./use-pagination";
import useResumeScale, { CROP_MARK_GUTTER, MAX_SHEET_WIDTH_PX } from "./use-resume-scale";
import PagePager from "./page-pager";

/** The full-size sheet, as opposed to a thumbnail of one. */
export const PREVIEW_FRAME_TITLE = "Resume preview";

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
      {/* The paper, sized entirely in CSS: as wide as the pane less the crop-mark
          gutter, capped at 1:1, and an A4 ratio so the height follows. Deriving it
          from the measured `scale` instead meant the box only reached its real size
          once JS had run, and everything under it moved when it did. */}
      <div
        className="relative bg-white shadow-[0_18px_50px_-20px_rgba(23,21,15,0.45)]"
        style={{
          width: `calc(100% - ${CROP_MARK_GUTTER * 2}px)`,
          maxWidth: `${MAX_SHEET_WIDTH_PX}px`,
          aspectRatio: `${A4_WIDTH_PX} / ${A4_HEIGHT_PX}`,
          // A flex item's automatic minimum size is its content, and the content
          // here is a full-size A4 that only *looks* smaller because it is scaled —
          // so without this the ratio loses and the box is 1122px tall.
          minHeight: 0,
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
            // Hidden until measured; the box above is already the right size and
            // already white, so what waits here is the type, not the paper.
            visibility: scale ? "visible" : "hidden",
            borderRadius: "2px",
            overflow: "hidden",
          }}
          className="origin-top-left"
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
