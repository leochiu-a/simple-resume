"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Frame from "react-frame-component";

import { A4_HEIGHT_PX, A4_WIDTH_PX } from "@/app/resume-editor/components/template/constants";
import { SHEET_DOCUMENT } from "@/app/resume-editor/components/template/sheet-document";
import { getTemplate } from "@/app/resume-editor/components/template/registry";

import CropMarks from "@/components/crop-marks";

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

const useFitScale = () => {
  const ref = useRef<HTMLDivElement>(null);
  // Starts at the width the hero column settles on at desktop, so the first paint
  // is close enough that the sheet does not visibly jump once measured.
  const [scale, setScale] = useState(0.55);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / A4_WIDTH_PX);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, scale };
};

const TemplateSheet = ({ templateId, color }: { templateId: string; color: string }) => {
  const { ref, scale } = useFitScale();
  const template = getTemplate(templateId);

  return (
    <div className="relative">
      <CropMarks className="border-[var(--accent)] opacity-50" />

      <div ref={ref} className="w-full" style={{ height: `${A4_HEIGHT_PX * scale}px` }}>
        {/* Scaling leaves the element occupying its unscaled box, so the wrapper
            above is given the scaled height to reclaim the difference. */}
        <div
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${A4_HEIGHT_PX}px`,
            transform: `scale(${scale})`,
          }}
          // A cast shadow on light paper; on dark stock a black shadow does
          // nothing, so it becomes the glow a lit sheet actually throws.
          className="origin-top-left bg-white shadow-[0_24px_60px_-24px_rgba(23,21,15,0.45)] dark:shadow-[0_28px_90px_-30px_rgba(255,244,222,0.18)]"
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
    </div>
  );
};

/** react-frame-component needs a document to portal into, so there is nothing to
 *  render on the server. The hero reserves the space with an A4-ratio placeholder. */
export default dynamic(() => Promise.resolve(TemplateSheet), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-white/60 shadow-xl" style={{ aspectRatio: "1 / 1.414" }} />
  ),
});
