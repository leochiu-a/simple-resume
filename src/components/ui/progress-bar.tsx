import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0–1, or null when the work is happening somewhere we cannot measure. */
  value: number | null;
  label?: string;
  className?: string;
}

/**
 * A hairline rule that fills up. Square, one pixel of colour, no capsule — this
 * is a mark on a page, and the page is the thing this app is about.
 */
export const ProgressBar = ({ value, label, className }: ProgressBarProps) => {
  const percent = value === null ? null : Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent ?? undefined}
      className={cn("h-1 w-full overflow-hidden rounded-sm bg-muted", className)}
    >
      <div
        className={cn(
          "h-full bg-primary transition-[width] duration-200 ease-out",
          // Indeterminate: another tab owns this download, so there is no
          // monitor to read a percentage from and a fixed bar would be a lie.
          percent === null && "w-1/3 animate-pulse",
        )}
        style={percent === null ? undefined : { width: `${percent}%` }}
      />
    </div>
  );
};
