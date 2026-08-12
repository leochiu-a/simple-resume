"use client";

import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from "react";
import { useCallback, useMemo, useRef } from "react";

/**
 * Lets the button drive the icon, rather than the icon waiting to be hovered itself.
 *
 * Every vendored icon animates on its own `mouseenter`, which is the wrong target
 * whenever the icon is part of something bigger: on a button reading "Add" the pointer
 * is over the label most of the time, and on an icon-only button it spends the first
 * few pixels over the padding. So the hover target becomes whatever element carries
 * `hoverProps` — a button, a link, or a container holding several icons at once.
 *
 * This is the registry's own escape hatch rather than a workaround. Attaching a ref is
 * what flips an icon into controlled mode: from then on its internal handlers only
 * forward `onMouseEnter`/`onMouseLeave` and stop starting animations themselves, so
 * there is never a self-hover fighting the group.
 *
 * `onFocus`/`onBlur` come along so the animation is not mouse-only — a keyboard user
 * tabbing to the button sees what a pointer user sees.
 */

/** The shape every icon in this directory exposes through its ref. */
export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

/**
 * Any icon from this directory, as a value.
 *
 * Passing one as a prop is safe in a way that mixing them with `lucide-react` is not:
 * every file here is `forwardRef<…IconHandle, HTMLAttributes<HTMLSpanElement>>` with
 * structurally identical handles, so they are all assignable to this one type.
 */
export type AnimatedIcon = ForwardRefExoticComponent<
  HTMLAttributes<HTMLSpanElement> & RefAttributes<AnimatedIconHandle>
>;

export const useIconHover = () => {
  const handles = useRef(new Set<AnimatedIconHandle>());

  /** Pass as `ref` to as many icons as share the hover target. */
  const registerIcon = useCallback((handle: AnimatedIconHandle | null) => {
    if (!handle) return;
    handles.current.add(handle);

    // React 19 runs a ref callback's return value as its cleanup, which is what makes
    // a set safe here — without it an unmount would only report `null` and leave the
    // set holding a handle belonging to nothing.
    return () => {
      handles.current.delete(handle);
    };
  }, []);

  const startIcons = useCallback(
    () => handles.current.forEach((handle) => handle.startAnimation()),
    [],
  );
  const stopIcons = useCallback(
    () => handles.current.forEach((handle) => handle.stopAnimation()),
    [],
  );

  /**
   * For a hover target with no handlers of its own. Spread it last, or compose with
   * `startIcons`/`stopIcons` instead — a later spread silently wins, and that is not
   * theoretical: `TooltipTrigger asChild` passes Radix's own `onFocus`/`onBlur` down as
   * props, and spreading those after these dropped the keyboard half of this entirely.
   * Radix drives its tooltip from pointer events, so the mouse half kept working and
   * the loss was invisible.
   */
  const hoverProps = useMemo(
    () => ({
      onMouseEnter: startIcons,
      onMouseLeave: stopIcons,
      onFocus: startIcons,
      onBlur: stopIcons,
    }),
    [startIcons, stopIcons],
  );

  return { registerIcon, hoverProps, startIcons, stopIcons };
};
