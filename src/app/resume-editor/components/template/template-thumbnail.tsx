"use client";

import Frame from "react-frame-component";

import { Resume } from "@/types/resume";

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

/** Two of these plus the menu's padding is what sets the picker's width. */
export const THUMBNAIL_WIDTH_PX = 132;

const scale = THUMBNAIL_WIDTH_PX / A4_WIDTH_PX;

const TemplateThumbnail = ({
  template,
  resume,
  backgroundColor,
}: {
  template: TemplateDefinition;
  resume: Resume;
  backgroundColor: string;
}) => {
  return (
    <div
      style={{ width: `${THUMBNAIL_WIDTH_PX}px`, height: `${A4_HEIGHT_PX * scale}px` }}
      className="overflow-hidden bg-white"
    >
      {/* Scaling leaves the element occupying its unscaled size, so the box above
          crops it back to the space it appears to take. */}
      <div
        style={{
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
          transform: `scale(${scale})`,
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
