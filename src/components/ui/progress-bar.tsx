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
          "h-full bg-brand",
          /*
            The transition and the animation are mutually exclusive, and they have
            to be: `tailwindcss-animate` extends `duration-*` and `ease-*` to set
            `animation-duration` and `animation-timing-function` as well as the
            transition ones, so `duration-200` sitting here unconditionally
            overrode the indeterminate animation down to 200ms. That is what made
            this bar strobe five times a second — first as a pulse, then as a
            segment shooting across the track.

            Nothing needs easing in the indeterminate state anyway: the width is
            constant there, and only the determinate bar has a width to animate.
          */
          percent === null
            ? // Another tab owns this download, so there is no monitor to read a
              // percentage from and a fixed bar would be a lie. See globals.css.
              "progress-travel"
            : "transition-[width] duration-200 ease-out",
        )}
        style={percent === null ? undefined : { width: `${percent}%` }}
      />
    </div>
  );
};
