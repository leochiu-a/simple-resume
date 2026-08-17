"use client";

import { RefObject, useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

import { A4_WIDTH_PX } from "./constants";

/** Room either side of the sheet for the crop marks to sit in. */
export const CROP_MARK_GUTTER = 24;

/**
 * A ceiling on the sheet, so it stops growing before it becomes absurd.
 *
 * The preview is driven by the width it is given, which on a 27" monitor is a lot
 * of width — and a sheet grown past its natural size is just a magnified one,
 * with type to match. So the ceiling is exactly 1:1: A4 is 794px at 96dpi, and at
 * this width the preview is the size the thing actually prints at.
 *
 * It was a flat 720 before, which undershot that by 10% for no stated reason — on
 * a wide monitor the pane had ~950px to give and the sheet stopped at 720, so the
 * preview was smaller than the paper while surrounded by empty desk. Scaling
 * beyond 1:1 is still refused; there is just no longer a gap below it.
 */
export const MAX_SHEET_WIDTH_PX = A4_WIDTH_PX;

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
 *
 * Shared by the editor's paged preview and the shared page's stack of sheets, so
 * a sheet is the same size in both for the same amount of room.
 *
 * 0 until the first measurement, and callers keep the sheet hidden until it is
 * not. It used to start at 0.5, which is a guess — and a guess paints: the sheet
 * appeared at half size and then snapped to the ~1.0 the pane actually affords,
 * one frame later, which is the jump the preview had on load. Nothing is drawn at
 * a scale nobody measured.
 */
const useResumeScale = (containerRef: RefObject<HTMLElement | null>) => {
  const [scale, setScale] = useState(0);
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

export default useResumeScale;
