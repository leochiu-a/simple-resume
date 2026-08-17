"use client";

import { createContext, PointerEvent, PropsWithChildren, useContext } from "react";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * A section of the form, set the way the landing page sets a section: a hairline
 * rule, a number out front in mono, the name in the display face.
 *
 * These used to be rounded, shadowed cards. Six boxes stacked down a column read as
 * six separate things to deal with, when what they are is one document in parts —
 * and the boxes competed with the one box on screen that matters, which is the
 * sheet. Rules divide without enclosing.
 */

/**
 * What a section is told about its place in the column.
 *
 * Passed as context rather than as props because the six section components sit
 * between the list and their own headings, and every one of them would otherwise
 * have to accept and forward four things it does not use. The number in particular
 * used to be a literal in each file — `index="04"` — which is exactly the kind of
 * thing that goes wrong the first time the order is not fixed.
 */
export interface SectionSlot {
  /** Its position, already padded: "01". */
  index: string;
  /**
   * Starts the reorder. Absent for Information, which is the sheet's header and
   * does not move.
   *
   * Pointer only, and the handle below is deliberately not focusable to match: a
   * `<button>` that Tab reaches and Enter does nothing to is worse than no control
   * at all. Reordering by keyboard is not offered here — the agent's
   * `set-section-layout` tool is the non-pointer route.
   */
  onGrab?: (event: PointerEvent<HTMLElement>) => void;
  /**
   * Set when the chosen template keeps this section in its sidebar, where the
   * position in this list has nothing to say. Better to admit it on the heading
   * than to let someone drag a section up and watch the sheet not move.
   */
  pinnedNote?: string;
}

const SlotContext = createContext<SectionSlot>({ index: "" });

export const SectionSlotProvider = ({
  slot,
  children,
}: PropsWithChildren<{ slot: SectionSlot }>) => (
  <SlotContext.Provider value={slot}>{children}</SlotContext.Provider>
);

/** Six dots. Not in `components/icons`, which holds the vendored animated set a
 *  `shadcn add` overwrites wholesale — a hand-written file there is one waiting to
 *  be lost. */
const GripIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="currentColor">
    {[5, 8, 11].map((y) => (
      <g key={y}>
        <circle cx="6" cy={y} r="1.1" />
        <circle cx="10" cy={y} r="1.1" />
      </g>
    ))}
  </svg>
);

const DragHandle = ({ onGrab }: { onGrab: NonNullable<SectionSlot["onGrab"]> }) => (
  <Tooltip title="Drag to reorder">
    <span
      /* The one hook the reorder popover and its tests address the handle by. */
      data-drag-handle
      role="presentation"
      onPointerDown={onGrab}
      /* `touch-none` is load-bearing: without it the browser claims the gesture for
         scrolling and the drag never starts on a phone. It is on the handle alone,
         so the rest of the section still scrolls under a finger. */
      className="cursor-grab touch-none text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
    >
      <GripIcon />
    </span>
  </Tooltip>
);

export const SectionTitle = ({ children }: PropsWithChildren) => {
  const { index, onGrab, pinnedNote } = useContext(SlotContext);

  return (
    /*
      The visibility toggle arrives as part of `children` and is pushed to the far
      end from here. It stays inside the heading deliberately: it acts on the
      section the heading names, and that is how it is reached.

      `ml-auto` is on the direct child, because only the outermost thing in the
      row should be pushed over — but the colour is on every descendant button.
      Profile wraps its toggle alongside a rewrite trigger, and with a `>` on the
      colour too that one eye came out darker than every other section's.
    */
    <h2 className="flex items-center gap-3 border-t border-border pt-5 font-display text-[1.4rem] font-semibold leading-none tracking-[-0.02em] [&>button]:ml-auto [&_button]:text-muted-foreground [&_button]:transition-colors [&_button:hover]:text-foreground">
      {/* Ahead of the number rather than in the margin beside it: the grip is the
          one thing here you act on, and a handle that only appears on hover is a
          handle nobody finds.

          Information gets no spacer in its place. Reserving the width kept every
          number on one vertical line, but Information is the first thing in the
          form and the reserved gap read as an unexplained indent with nothing in
          it. Letting it sit flush costs a little alignment and buys a distinction
          worth drawing: the indented headings are the ones that move. */}
      {onGrab && <DragHandle onGrab={onGrab} />}

      <span aria-hidden className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">
        {index}
      </span>
      {children}

      {pinnedNote && (
        <Tooltip title={pinnedNote}>
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Sidebar
          </span>
        </Tooltip>
      )}
    </h2>
  );
};

export const SectionBody = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div className={cn("mt-6 space-y-4", className)}>{children}</div>
);

export const Section = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <section className={cn("mb-14", className)}>{children}</section>
);
