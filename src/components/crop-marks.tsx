import { cn } from "@/lib/utils";

/**
 * Printer's crop marks, sitting just outside the trim of whatever they are put
 * around.
 *
 * Both places a sheet appears full size get them — the landing page's hero and the
 * editor's preview — because in both the point being made is the same: this is a
 * page on its way to a printer, not a screen that happens to be white. They are the
 * one piece of decoration the two surfaces share.
 *
 * Wants a positioned ancestor sized to the sheet; the negative offset is what puts
 * each mark outside it.
 */

const POSITIONS = [
  "left-0 top-0 border-l border-t",
  "right-0 top-0 border-r border-t",
  "left-0 bottom-0 border-l border-b",
  "right-0 bottom-0 border-r border-b",
];

const CropMarks = ({ className }: { className?: string }) => (
  <>
    {POSITIONS.map((position) => (
      <span
        key={position}
        aria-hidden
        className={cn("pointer-events-none absolute z-10 h-5 w-5", position, className)}
        style={{ margin: "-14px" }}
      />
    ))}
  </>
);

export default CropMarks;
