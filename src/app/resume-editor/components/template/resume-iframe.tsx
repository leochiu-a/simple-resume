"use client";

import dynamic from "next/dynamic";
import { PropsWithChildren, useEffect, useState } from "react";
import Frame from "react-frame-component";
import { useMediaQuery } from "usehooks-ts";

import { A4_HEIGHT_PX, A4_WIDTH_PX } from "./constants";
import { SHEET_DOCUMENT } from "./sheet-document";
import usePagination from "./use-pagination";
import PagePager from "./page-pager";

/** The full-size sheet, as opposed to a thumbnail of one. */
export const PREVIEW_FRAME_TITLE = "Resume preview";

const useResumeScale = () => {
  const [scale, setScale] = useState(0.5);
  const matches = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const getDefaultScale = () => {
      let scale: number;

      if (matches) {
        const screenHeightPx = window.innerHeight;
        const navHeight = 48;
        // Reserved whether or not the pager is showing, so the sheet does not
        // resize out from under you the moment a resume spills onto a second page.
        const pagerHeight = 40 + 16;
        const resumePaddingY = 32 * 2;
        const resumeHeight = screenHeightPx - navHeight - pagerHeight - resumePaddingY;

        scale = resumeHeight / A4_HEIGHT_PX;
      } else {
        const screenWidthPx = window.innerWidth;
        const resumePaddingX = 16 * 2;
        const resumeWidth = screenWidthPx - resumePaddingX;

        scale = resumeWidth / A4_WIDTH_PX;
      }

      return scale;
    };

    const setDefaultScale = () => {
      const defaultScale = getDefaultScale();
      setScale(defaultScale);
    };

    setDefaultScale();
    window.addEventListener("resize", setDefaultScale);

    return () => {
      window.removeEventListener("resize", setDefaultScale);
    };
  }, [matches]);

  return scale;
};

const ResumeIframe = ({ children }: PropsWithChildren) => {
  const scale = useResumeScale();
  const { pageCount, contentRef } = usePagination(A4_HEIGHT_PX);
  const [page, setPage] = useState(0);

  // Deleting a job can drop the page you were looking at out of existence.
  const currentPage = Math.min(page, pageCount - 1);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        style={{
          maxWidth: `${A4_WIDTH_PX * scale}px`,
          maxHeight: `${A4_HEIGHT_PX * scale}px`,
        }}
      >
        {/* There is an outer div and an inner div here. The inner div sets the iframe width and uses transform scale to zoom in/out the resume iframe.
            While zooming out or scaling down via transform, the element appears smaller but still occupies the same width/height. Therefore, we use the
            outer div to restrict the max width & height proportionally */}
        <div
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${A4_HEIGHT_PX}px`,
            transform: `scale(${scale})`,
            borderRadius: "8px",
            overflow: "hidden",
          }}
          className="origin-top-left bg-white shadow-xl"
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
