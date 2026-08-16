"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Reorder, useDragControls } from "motion/react";

import { SECTION_LABELS } from "@/lib/resume-sections";
import { cn } from "@/lib/utils";
import { SectionId } from "@/types/resume";

/**
 * The reorder popover: the whole running order, floated over the spot the drag
 * started from.
 *
 * The form stays exactly as it is underneath. That is the point, and it is what the
 * two attempts before this one got wrong: both rearranged the form itself, and
 * folding six full-height sections down to headings on the way into a drag changes
 * the layout in the middle of the gesture. Motion has already measured the boxes it
 * decides swaps against and pinned the held element to where it was, so the list
 * folds, every row moves, and the section under the cursor needs its old full height
 * of travel to move one place. Neither flushing the fold synchronously nor deferring
 * the drag by a frame shifts that.
 *
 * A popover has none of that problem, because its list is DOM that did not exist a
 * moment ago. Motion measures it when the drag starts inside it, and what it
 * measures is what is on screen — there is nothing left to go stale.
 */

/** Fixed, because the popover's position is solved from it: see `anchorTop`. */
const ROW_HEIGHT = 44;
const LIST_PADDING = 6;
/** Kept off the viewport edge when the sum does not fit on screen. */
const MARGIN = 8;
const WIDTH = 260;
/** Given a fixed height so the clamp below can count it. */
const HINT_HEIGHT = 33;

export interface Grab {
  id: SectionId;
  /** The handle's box when it was pressed, in viewport coordinates. */
  rect: DOMRect;
}

/**
 * Where the popover goes so that the grabbed section's row lands on the heading it
 * was dragged from.
 *
 * Solved rather than anchored: an ordinary popover sits beside its trigger, which
 * would make the row jump away from the cursor the instant it appeared. Placing the
 * list so row `index` covers the handle means the thing being dragged does not move
 * at all when the popover opens — it simply gains five neighbours.
 */
const anchorTop = (rect: DOMRect, index: number) =>
  rect.top + rect.height / 2 - ROW_HEIGHT / 2 - LIST_PADDING - index * ROW_HEIGHT;

/**
 * Keeps the popover on screen, at the cost of the alignment above when it has to.
 *
 * The two cannot both hold: a section pressed near the bottom of the viewport wants
 * the list to hang off the end of it. Clamping is the least-bad answer rather than a
 * good one — it displaces the row from the cursor by the smallest amount that fits,
 * and the drag still tracks the pointer one-to-one from there.
 */
const clamp = (value: number, max: number) => Math.max(MARGIN, Math.min(value, max - MARGIN));

const Row = ({
  id,
  grabbed,
  latched,
  hidden,
}: {
  id: SectionId;
  /** In the order but switched off, so not on the sheet at all. */
  hidden: boolean;
  /** True on the row the handle was pressed on: the one that keeps the gesture. */
  grabbed: boolean;
  /** The popover is staying open, so every row drags on its own press. */
  latched: boolean;
}) => {
  const controls = useDragControls();
  const started = useRef(false);

  /**
   * Takes over the press that is already underway, on its first movement.
   *
   * Replaying the original `pointerdown` here does not work — the call is accepted
   * and silently does nothing, because the press belongs to a handle in the form and
   * this row was not on screen when it happened. Waiting for the first `pointermove`
   * gives Motion a live event on a row that is mounted, measured and final, which is
   * all it needs to run the rest of the drag from.
   *
   * The cost is that the drag begins a pixel or two into the movement rather than at
   * the press. That is invisible, and it is the same threshold Motion applies to an
   * ordinary drag anyway.
   *
   * Guarded with a ref because every swap re-renders this row, and a second `start`
   * on top of a gesture in flight would restart it from the new position.
   */
  useEffect(() => {
    if (!grabbed || latched) return;

    const takeOver = (event: PointerEvent) => {
      if (started.current) return;

      started.current = true;
      /* Deliberately not `snapToCursor`. It looks like the answer to the clamp above
         — put the row under the hand wherever the popover ended up — but it teleports
         the row the whole displacement in one frame, which reorders the list several
         places before the drag has really begun. Letting the row stay where it was
         drawn and track the pointer from there is the calmer of the two. */
      controls.start(event);
    };

    window.addEventListener("pointermove", takeOver);

    return () => window.removeEventListener("pointermove", takeOver);
  }, [grabbed, latched, controls]);

  return (
    <Reorder.Item
      value={id}
      /* Off while the opening press is still running — that gesture belongs to the
         grabbed row and is handed over above. Once the popover is latched open
         there is no gesture in flight, so every row listens for its own. */
      dragListener={latched}
      dragControls={controls}
      style={{ height: ROW_HEIGHT }}
      className={cn(
        /* `relative` on every row, and it is load-bearing rather than tidiness.
           Reorder puts `z-index: 1` on whichever row is being dragged and leaves the
           rest on `auto`, but a `position: static` element ignores z-index outright —
           so the stack fell to whichever row had most recently been given a layout
           transform. Dragging upwards looked right and dragging downwards painted
           the row being displaced over the one in hand. */
        "relative flex select-none items-center gap-2.5 rounded-md px-3 text-sm",
        grabbed && !latched ? "bg-accent shadow-md" : "bg-popover",
        latched && "cursor-grab active:cursor-grabbing",
        hidden && "text-muted-foreground",
      )}
    >
      <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0" fill="currentColor">
        {[5, 8, 11].map((y) => (
          <g key={y}>
            <circle cx="6" cy={y} r="1.1" />
            <circle cx="10" cy={y} r="1.1" />
          </g>
        ))}
      </svg>

      <span className="truncate">{SECTION_LABELS[id]}</span>

      {hidden && <span className="ml-auto shrink-0 text-xs">Hidden</span>}
    </Reorder.Item>
  );
};

const SectionOrderPopover = ({
  grab,
  order,
  hiddenSections,
  latched,
  onReorder,
  onDismiss,
}: {
  grab: Grab;
  /** Only the sections this template can actually place — see `ResumeForm`. */
  order: SectionId[];
  hiddenSections: readonly SectionId[];
  /** False only while the press that opened this is still down — see `ResumeForm`. */
  latched: boolean;
  onReorder: (next: SectionId[]) => void;
  /** Applies the arrangement as well as closing — nothing lands before this. */
  onDismiss: () => void;
}) => {
  /**
   * Solved once, on the first render, and then left alone.
   *
   * Recomputing it from the grabbed section's current index — which is what this did
   * first — moves the whole popover by a row every time two rows swap, so the list
   * lurches under the hand that is dragging it. The anchor is where the gesture
   * started; nothing that happens inside the list afterwards changes that.
   */
  const placement = useRef<{ top: number; left: number }>(null);

  if (!placement.current) {
    const height = order.length * ROW_HEIGHT + LIST_PADDING * 2 + HINT_HEIGHT;

    placement.current = {
      top: clamp(anchorTop(grab.rect, order.indexOf(grab.id)), window.innerHeight - height),
      left: clamp(grab.rect.left - LIST_PADDING - 12, window.innerWidth - WIDTH),
    };
  }

  const { top, left } = placement.current;

  /* Only once it is staying open does it need a way out. During the opening press
     the release is the way out, and there is nothing to listen for. */
  useEffect(() => {
    if (!latched) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [latched, onDismiss]);

  /* Portalled to the body rather than left in the form. `position: fixed` is only
     viewport-relative until an ancestor has a transform, and Motion puts transforms
     on everything it drags — so a popover rendered inside the list it reorders is
     one animation away from being positioned against the wrong box. It also takes
     no props from `useFormContext`, which is what makes leaving the provider safe. */
  return createPortal(
    <>
      {/* Not a modal: no focus trap, no scroll lock. It closes on Esc or a click out
          here — and closing is also what applies the arrangement, since nothing
          behind moves until then.

          Light — 20%, where this started at 60%. That was sized for a scrim that
          only existed while a press was down. The list now stays until it is
          dismissed, so the scrim stays too, and the moment right after a section
          lands is exactly when the sheet beside the form is worth reading. Enough
          tint to lift the popover off the form, not enough to grey out the answer. */}
      <div
        aria-hidden
        onPointerDown={latched ? onDismiss : undefined}
        className="fixed inset-0 z-40 bg-background/20"
      />

      <div
        data-section-order-popover
        style={{ top, left, width: WIDTH }}
        className="fixed z-50 rounded-lg border border-border bg-popover shadow-lg"
      >
        <Reorder.Group
          axis="y"
          values={order}
          onReorder={onReorder}
          style={{ padding: LIST_PADDING }}
        >
          {order.map((id) => (
            <Row
              key={id}
              id={id}
              grabbed={id === grab.id}
              latched={latched}
              hidden={hiddenSections.includes(id)}
            />
          ))}
        </Reorder.Group>

        {/* Rendered whatever state the popover is in. Conditional on the opening
            press being up, it grew onto the bottom a moment after the popover
            appeared, and the popover is only ever a moment old. */}
        <p
          style={{ height: HINT_HEIGHT }}
          className="flex items-center border-t border-border px-3 text-xs text-muted-foreground"
        >
          Drag to reorder
        </p>
      </div>
    </>,
    document.body,
  );
};

export default SectionOrderPopover;
