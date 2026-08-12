"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface BanIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type BanIconProps = HTMLAttributes<HTMLSpanElement>;

const CIRCLE_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
};

const LINE_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 },
    },
  },
  slash: () => ({
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  }),
};

const BanIcon = forwardRef<BanIconHandle, BanIconProps>(
  ({ onMouseEnter, onMouseLeave, className, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => {
          controls.start("animate");
          controls.start("slash", { delay: 0.5 });
        },
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
          controls.start("slash", { delay: 0.5 });
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
          <motion.circle
            animate={controls}
            cx="12"
            cy="12"
            initial="normal"
            r="10"
            variants={CIRCLE_VARIANTS}
          />
          <motion.path
            animate={controls}
            d="m4.9 4.9 14.2 14.2"
            initial="normal"
            variants={LINE_VARIANTS}
          />
        </svg>
      </span>
    );
  },
);

BanIcon.displayName = "BanIcon";

export { BanIcon };
