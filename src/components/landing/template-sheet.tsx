"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Frame from "react-frame-component";

import { A4_HEIGHT_PX, A4_WIDTH_PX } from "@/app/resume-editor/components/template/constants";
import { SHEET_DOCUMENT } from "@/app/resume-editor/components/template/sheet-document";
import { getTemplate } from "@/app/resume-editor/components/template/registry";

import { SHOWCASE_RESUME } from "./showcase-resume";

/**
 * The hero's sheet: the real template, rendering the real thing, scaled to
 * whatever width the column happens to be.
 *
 * Same trick as the editor's preview and the picker's thumbnails — the @react-pdf
 * tree goes into an iframe carrying `SHEET_DOCUMENT`, so the page's own stylesheet
 * and dark mode cannot reach it and the sheet stays paper-white either way. The
 * frame itself never remounts: switching template or colour only swaps the
 * children inside it, which is why the paper does not flash.
 */

export const SHEET_FRAME_TITLE = "Template preview";

/** 0 until the box has been measured. Guessing a starting scale is what made the
 *  sheet jump: the guess paints, the measurement lands a frame later, and the whole
 *  page re-scales in front of the visitor. The sheet stays hidden instead — the box
 *  it sits in is sized by CSS, so nothing moves either way. */
const useFitScale = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => setScale(element.getBoundingClientRect().width / A4_WIDTH_PX);

    // Measured here as well as in the observer: the observer's first callback is
    // delivered after this mount, and the sheet should be visible on the frame
    // the frame itself appears on.
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, scale };
};

const TemplateSheet = ({ templateId, color }: { templateId: string; color: string }) => {
  const { ref, scale } = useFitScale();
  const template = getTemplate(templateId);

  return (
    // The paper is this box, and its size is CSS: an A4-ratio box as wide as the
    // column, so the height follows the width without JS having a say. The scaled
    // sheet inside is what waits to be measured.
    //
    // The sheet is always paper-white, so it needs its own shadow rather than the
    // token set's: on dark surfaces a black shadow under a white rectangle does
    // nothing, and the sheet has to read as lit instead.
    <div
      ref={ref}
      style={{ aspectRatio: `${A4_WIDTH_PX} / ${A4_HEIGHT_PX}` }}
      className="relative w-full overflow-hidden bg-white shadow-[0_24px_60px_-24px_rgb(9_11_28/0.28)] dark:shadow-[0_28px_90px_-30px_rgb(255_255_255/0.16)]"
    >
      {/* Scaling leaves the element occupying its unscaled box, so the box above
          crops it back to the space it appears to take. Hidden until measured —
          one frame at the wrong scale is the jump. */}
      <div
        style={{
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
        }}
        className="origin-top-left"
      >
        <Frame
          title={SHEET_FRAME_TITLE}
          style={{ width: "100%", height: "100%", border: 0, pointerEvents: "none" }}
          initialContent={SHEET_DOCUMENT}
          tabIndex={-1}
        >
          <div
            style={{
              height: `${A4_HEIGHT_PX}px`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {template.render({ resume: SHOWCASE_RESUME, backgroundColor: color })}
          </div>
        </Frame>
      </div>
    </div>
  );
};

/** react-frame-component needs a document to portal into, so there is nothing to
 *  render on the server. The hero reserves the space with an A4-ratio placeholder —
 *  the same ratio and the same paper the real sheet lands on, so the swap is a
 *  resume appearing on the page rather than the page resizing around it. */
export default dynamic(() => Promise.resolve(TemplateSheet), {
  ssr: false,
  loading: () => (
    <div
      style={{ aspectRatio: `${A4_WIDTH_PX} / ${A4_HEIGHT_PX}` }}
      className="w-full bg-white shadow-[0_24px_60px_-24px_rgb(9_11_28/0.28)] dark:shadow-[0_28px_90px_-30px_rgb(255_255_255/0.16)]"
    />
  ),
});
