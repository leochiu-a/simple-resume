"use client";

import { useEffect, useRef, useState } from "react";
import Frame from "react-frame-component";

import { Resume } from "@/types/resume";

// Side-effect import, same reason as the full-size preview: the picker mounts a
// template per card, and each one warns for every primitive in it.
import "./silence-pdf-tag-warnings";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "./constants";
import { SHEET_DOCUMENT } from "./sheet-document";
import { TemplateDefinition } from "./registry";

/**
 * A template's first page, small enough to sit in the picker.
 *
 * It renders the real template with the real resume, then scales the whole sheet
 * down — so what you pick is what you get, rather than a stock screenshot that
 * drifts the moment a template changes. At this size the words are illegible and
 * that is fine: the choice being made is a layout, and the shape of the page is
 * what carries it.
 *
 * The full-size preview measures its own page breaks (see `use-pagination.ts`).
 * Nothing here needs that — the box is exactly one page tall and clips whatever
 * runs past it.
 */

/**
 * Fills the width it is given, at the sheet's own proportions.
 *
 * This used to be a fixed 132px wide — a number chosen for the 320px dropdown the
 * picker lived in. The picker is a full-width panel now, so the card grew and the
 * sheet did not: the resume sat in the left third of a wide landscape box with
 * dead paper filling the rest, which is the one thing a template preview must not
 * do. A thumbnail whose shape is not the page's shape is showing a layout you
 * will never get.
 *
 * `aspect-ratio` holds the box at the page's proportions whatever width the grid
 * gives it, and the sheet inside is scaled to match by measuring that width.
 *
 * Measured rather than expressed in CSS: `transform: scale` needs a number, and
 * `zoom` — which would have taken a `cqw` calc and needed no JS — does not apply
 * one reliably here, so the sheet rendered full size and the card showed a
 * fragment of the first heading. A ResizeObserver is the boring option that works.
 */
const TemplateThumbnail = ({
  template,
  resume,
  backgroundColor,
}: {
  template: TemplateDefinition;
  resume: Resume;
  backgroundColor: string;
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const measure = () => setScale(el.getBoundingClientRect().width / A4_WIDTH_PX);

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      style={{ aspectRatio: `${A4_WIDTH_PX} / ${A4_HEIGHT_PX}` }}
      className="relative w-full overflow-hidden bg-white"
    >
      {/* Scaling leaves the element occupying its unscaled size, so the box above
          crops it back to the space it appears to take. Hidden until measured —
          one frame at full size is a flash of enormous type. */}
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
          // The sheet is decoration here; the menu item around it is the control. An
          // iframe shows its own document's cursor and eats the hover, so it has to
          // be transparent to the pointer for the card underneath to feel clickable.
          style={{ width: "100%", height: "100%", border: 0, pointerEvents: "none" }}
          initialContent={SHEET_DOCUMENT}
          tabIndex={-1}
          aria-hidden
        >
          <div
            style={{
              height: `${A4_HEIGHT_PX}px`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {template.render({ resume, backgroundColor })}
          </div>
        </Frame>
      </div>
    </div>
  );
};

export default TemplateThumbnail;
