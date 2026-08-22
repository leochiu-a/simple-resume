"use client";

import { PaletteIcon } from "@/components/icons/palette";
import { useIconHover } from "@/components/icons/use-icon-hover";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * The way into the appearance panel: a palette button floating over the sheet.
 *
 * It sits on the preview because that is what it changes — the control and its
 * result in one place. Clicking it does not open a popover here; it swaps the
 * editing column beside it for the panel, which is where there is actually room
 * to compare eight templates. The panel's own ✕ is the way back.
 */
const AppearanceTrigger = ({
  onOpen,
  className,
  /**
   * Off inside the mobile preview dialog, and not merely for tidiness.
   *
   * A Radix tooltip closes on Escape and stops the event propagating. This button
   * is the first control in that dialog, so it takes focus when the dialog opens
   * — which meant the first Escape dismissed an invisible tooltip instead of the
   * dialog, leaving it stuck open with the body still scroll-locked. That is the
   * exact freeze preview-dialog.mobile.spec.ts guards against.
   *
   * The button carries an `aria-label` either way, so nothing is lost: on the
   * desktop preview it floats alone over the sheet and the tooltip is worth
   * having; in a labelled toolbar row beside Download it is not.
   */
  tooltip = true,
  /**
   * Whether the button hides itself until the preview pane is hovered.
   *
   * On by default, because that is what it is for on the desktop preview: the
   * resting state there is the sheet and nothing else. Off in the mobile
   * dialog's toolbar, where the button is a row item like Download and there is
   * no pane to hover.
   *
   * A prop rather than something a caller can turn off with a class, because the
   * reveal is `opacity-0` *and* `pointer-events-none`: overriding only the
   * opacity left a fully visible button that silently took no clicks — a pointer
   * that reports no hover (`[@media(hover:none)]`) was the only thing restoring
   * them, so a narrow desktop window got a dead palette button.
   */
  reveal = true,
}: {
  onOpen: () => void;
  className?: string;
  tooltip?: boolean;
  reveal?: boolean;
}) => {
  const { registerIcon, startIcons, stopIcons } = useIconHover();

  const button = (
    <Button
      type="button"
      size="icon"
      onClick={onOpen}
      onMouseEnter={startIcons}
      onMouseLeave={stopIcons}
      onFocus={startIcons}
      onBlur={stopIcons}
      aria-label="Template and colour"
      className={cn(
        "size-11 rounded-full shadow-lg transition-opacity duration-200",
        /*
          Hidden until the pointer is over the preview, so the resting state is
          the sheet and nothing else.

          `pointer-events-none` while hidden matters as much as the opacity: a
          fully transparent button still takes clicks, and this one sits directly
          over the middle of the sheet.

          `group-hover` is the preview pane, not the button — the whole desk is
          the target, so it appears as soon as the pointer is anywhere near.
          `group-focus-within` keeps it reachable by keyboard, where there is no
          hover to give, and `(hover: none)` pins it visible on touch, which has
          no hover at all and would otherwise have no way into the panel.
        */
        reveal && [
          "pointer-events-none opacity-0",
          "group-hover:pointer-events-auto group-hover:opacity-100",
          "group-focus-within:pointer-events-auto group-focus-within:opacity-100",
          "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100",
        ],
        className,
      )}
    >
      <PaletteIcon ref={registerIcon} className="size-5" />
    </Button>
  );

  return tooltip ? <Tooltip title="Template & colour">{button}</Tooltip> : button;
};

export default AppearanceTrigger;
