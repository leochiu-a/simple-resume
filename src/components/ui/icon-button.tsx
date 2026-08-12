"use client";

import { forwardRef } from "react";

import { AnimatedIcon, useIconHover } from "@/components/icons/use-icon-hover";
import { Button, ButtonProps } from "@/components/ui/button";

interface IconButtonProps extends ButtonProps {
  /** An icon from `components/icons`, passed as a value rather than written inline. */
  icon: AnimatedIcon;
}

/**
 * A button whose icon animates when the button is hovered, not when the icon is.
 *
 * The form sections have ten of these — an Add per section and a Delete per row — and
 * the Delete lives inside a `map`, where a hook cannot be called. Both reasons point at
 * one component rather than the hook repeated at each site: the ref and the two
 * handlers have to be paired correctly every time, and each row needs its own instance.
 *
 * The icon is a prop instead of children so this owns the ref wiring. `mr-2 size-4` is
 * fixed here for the same reason — every one of these buttons had exactly that, and a
 * label needs the icon at text size whatever the button says.
 *
 * The four handlers are composed rather than spread. Most of these buttons sit inside a
 * `Tooltip`, whose `asChild` trigger passes Radix's own `onFocus`/`onBlur` down as props,
 * so spreading them over a set of handlers drops one side or the other.
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, children, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
    const { registerIcon, startIcons, stopIcons } = useIconHover();

    return (
      <Button
        ref={ref}
        {...props}
        onMouseEnter={(event) => {
          onMouseEnter?.(event);
          startIcons();
        }}
        onMouseLeave={(event) => {
          onMouseLeave?.(event);
          stopIcons();
        }}
        onFocus={(event) => {
          onFocus?.(event);
          startIcons();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          stopIcons();
        }}
      >
        <Icon ref={registerIcon} className="mr-2 size-4" />
        {children}
      </Button>
    );
  },
);
IconButton.displayName = "IconButton";

export { IconButton };
