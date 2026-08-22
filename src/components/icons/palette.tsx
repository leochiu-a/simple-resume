"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface PaletteIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type PaletteIconProps = HTMLAttributes<HTMLSpanElement>;

const DASH_LENGTH = 70;
const DRAW_DURATION = 0.9;
// Dots start slightly before the stroke finishes drawing (overlap, not a hard
// wait) so the hand-off feels continuous instead of pausing.
const DOTS_START_DELAY = DRAW_DURATION - 0.15;
const DOT_STAGGER = 0.13;

const DOTS = [
  { cx: 6.5, cy: 12.5 },
  { cx: 8.5, cy: 7.5 },
  { cx: 13.5, cy: 6.5 },
  { cx: 17.5, cy: 10.5 },
];

const OUTLINE_VARIANTS: Variants = {
  normal: {
    strokeDashoffset: 0,
  },
  animate: {
    strokeDashoffset: [DASH_LENGTH, 0],
    transition: {
      duration: DRAW_DURATION,
      ease: [0.65, 0, 0.35, 1],
    },
  },
};

const DOT_VARIANTS: Variants = {
  normal: {
    scale: 1,
  },
  animate: (index: number) => ({
    // Two keyframes only: motion rejects 3+ keyframes on a spring. Lower
    // damping = bigger, slower overshoot before it settles.
    scale: [0, 1],
    transition: {
      delay: DOTS_START_DELAY + index * DOT_STAGGER,
      damping: 10,
      stiffness: 300,
      type: "spring",
    },
  }),
};

const PaletteIcon = forwardRef<PaletteIconHandle, PaletteIconProps>(
  ({ onMouseEnter, onMouseLeave, className, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave],
    );

    return (
      <span
        className={cn("inline-flex size-4 [&>svg]:!size-full", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            animate={controls}
            d="M12 2a1 1 0 0 0 0 20l.25 0a1.75 1.75 0 0 0 1.4-2.8l-.3-.4a1.75 1.75 0 0 1 1.4-2.8h2.25a5 5 0 0 0 5-5 10 9 0 0 0-10-9z"
            initial="normal"
            strokeDasharray={DASH_LENGTH}
            variants={OUTLINE_VARIANTS}
          />
          {DOTS.map((dot, index) => (
            <motion.circle
              animate={controls}
              custom={index}
              cx={dot.cx}
              cy={dot.cy}
              fill="currentColor"
              initial="normal"
              key={`${dot.cx}-${dot.cy}`}
              r=".5"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              variants={DOT_VARIANTS}
            />
          ))}
        </svg>
      </span>
    );
  },
);

PaletteIcon.displayName = "PaletteIcon";

export { PaletteIcon };
