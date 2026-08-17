"use client";

import dynamic from "next/dynamic";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
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

/**
 * Every page of a resume, laid out down the screen — the reading end of a share
 * link, as opposed to the editor's paged preview.
 *
 * The editor pages one sheet at a time because it is a workbench: the sheet sits
 * in a pane beside the form, and a pager keeps it in view while you type. A shared
 * link is not a workbench. Whoever opens it is reading a document they did not
 * write, and asking them to click "2" to find out there was a second page makes
 * page two optional — scrolling is how every other document on the web is read.
 *
 * Each page is its own iframe rather than one tall one, because a page break is
 * something the sheet's own layout produces: `usePagination` measures the content
 * and nudges blocks clear of the page margins, and that measurement only means
 * anything against a real A4 window. So every sheet renders the whole resume and
 * shows its own slice of it, exactly as the editor's single sheet does — which is
 * what keeps the breaks here identical to the editor's, and to the PDF's.
 */

const Sheet = ({
  pageIndex,
  scale,
  onPageCount,
  children,
}: PropsWithChildren<{
  /** Zero-based; the slice of the resume this sheet shows. */
  pageIndex: number;
  scale: number;
  /**
   * How many pages this sheet's copy of the resume runs to. Only the first sheet
   * is asked, and that is not an optimisation: a sheet reports 1 on its first
   * render, before it has measured anything, so letting the sheets it just
   * created answer would knock the stack straight back down to one and start the
   * whole thing over. The first sheet is the one that is always there to ask.
   */
  onPageCount?: (pageCount: number) => void;
}>) => {
  // Each sheet paginates its own copy: the nudges that keep a block clear of the
  // page margins are applied to the DOM, so they have to be applied in every
  // iframe for its slice to line up with the others.
  const { pageCount, contentRef } = usePagination(A4_HEIGHT_PX);

  useEffect(() => {
    onPageCount?.(pageCount);
  }, [pageCount, onPageCount]);

  return (
    // The paper, sized entirely in CSS — as wide as the column less the crop-mark
    // gutter, capped at 1:1, A4 ratio for the height. Sizing it from the measured
    // `scale` meant a stack of sheets that changed height once JS had run.
    <div
      className="relative bg-white shadow-[0_18px_50px_-20px_rgba(23,21,15,0.45)]"
      style={{
        width: `calc(100% - ${CROP_MARK_GUTTER * 2}px)`,
        maxWidth: `${MAX_SHEET_WIDTH_PX}px`,
        aspectRatio: `${A4_WIDTH_PX} / ${A4_HEIGHT_PX}`,
        // A flex item's automatic minimum size is its content, and the content here
        // is a full-size A4 that only *looks* smaller because it is scaled — so
        // without this the ratio loses and every sheet is 1122px tall.
        minHeight: 0,
      }}
    >
      {/* Desktop only: at mobile widths the sheet is already the width of the
          screen, and 24px of gutter either side costs more than the marks add. */}
      <CropMarks className="hidden border-muted-foreground/40 md:block" />
      {/* Outer box and inner box: the inner one is a full-size A4 that `transform`
          scales down, which leaves it occupying full size in layout — so the outer
          one caps the space the scaled sheet actually takes up. */}
      <div
        style={{
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
          transform: `scale(${scale})`,
          // Hidden until measured — the box above is already paper.
          visibility: scale ? "visible" : "hidden",
          borderRadius: "2px",
          overflow: "hidden",
        }}
        className="origin-top-left"
      >
        <Frame
          // Numbered rather than the editor's single "Resume preview": there are
          // several sheets here, and the number is what tells them apart.
          title={`Resume page ${pageIndex + 1}`}
          style={{ width: "100%", height: "100%", border: 0 }}
          initialContent={SHEET_DOCUMENT}
        >
          <div
            data-resume-page={pageIndex + 1}
            style={{ position: "relative", height: `${A4_HEIGHT_PX}px`, overflow: "hidden" }}
          >
            <div
              ref={contentRef}
              style={{
                position: "absolute",
                top: `${-pageIndex * A4_HEIGHT_PX}px`,
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
  );
};

const ResumeSheets = ({ children }: PropsWithChildren) => {
  // The box the sheets have to fit inside. Measured rather than derived from the
  // window — see `useResumeScale`.
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useResumeScale(containerRef);
  const [pageCount, setPageCount] = useState(1);

  return (
    // The gap is what makes these read as separate sheets rather than one long
    // strip of paper: it is the only thing standing in for the edge of a page,
    // since the crop marks are off below `md`.
    <div ref={containerRef} className="flex w-full flex-col items-center gap-8 py-6 sm:gap-12">
      {Array.from({ length: pageCount }, (_, index) => (
        <Sheet
          key={index}
          pageIndex={index}
          scale={scale}
          onPageCount={index === 0 ? setPageCount : undefined}
        >
          {children}
        </Sheet>
      ))}
    </div>
  );
};

const ResumeSheetsCSR = dynamic(() => Promise.resolve(ResumeSheets), { ssr: false });

export default ResumeSheetsCSR;
