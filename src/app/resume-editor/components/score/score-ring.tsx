import { FC } from "react";

import { cn } from "@/lib/utils";

/** The three bands the score is read in, and the one place their colours live. */
export const scoreBand = (score: number): "weak" | "fair" | "strong" =>
  score >= 80 ? "strong" : score >= 55 ? "fair" : "weak";

const BAND_STROKE: Record<ReturnType<typeof scoreBand>, string> = {
  weak: "stroke-destructive",
  fair: "stroke-amber-500",
  strong: "stroke-emerald-500",
};

const BAND_TEXT: Record<ReturnType<typeof scoreBand>, string> = {
  weak: "text-destructive",
  fair: "text-amber-500",
  strong: "text-emerald-500",
};

interface ScoreRingProps {
  score: number;
  size?: number;
  className?: string;
}

/**
 * The score as a ring.
 *
 * An SVG rather than a conic-gradient div: the arc has to animate as you type,
 * and `stroke-dashoffset` is the one property that interpolates smoothly and
 * cheaply. The track and the arc share a circle so nothing has to be measured.
 */
const ScoreRing: FC<ScoreRingProps> = ({ score, size = 84, className }) => {
  const band = scoreBand(score);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      {/* -90deg so the arc starts at twelve o'clock rather than three. */}
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className={cn("transition-[stroke-dashoffset] duration-500", BAND_STROKE[band])}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-display text-2xl font-semibold tabular-nums", BAND_TEXT[band])}>
          {score}
        </span>
      </div>
    </div>
  );
};

export default ScoreRing;
