"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface SunIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type SunIconProps = HTMLAttributes<HTMLSpanElement>;

const PATH_VARIANTS: Variants = {
  normal: { opacity: 1 },
  animate: (i: number) => ({
    opacity: [0, 1],
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

const SunIcon = forwardRef<SunIconHandle, SunIconProps>(
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
          <circle cx="12" cy="12" r="4" />
          {[
            "M12 2v2",
            "m19.07 4.93-1.41 1.41",
            "M20 12h2",
            "m17.66 17.66 1.41 1.41",
            "M12 20v2",
            "m6.34 17.66-1.41 1.41",
            "M2 12h2",
            "m4.93 4.93 1.41 1.41",
          ].map((d, index) => (
            <motion.path
              animate={controls}
              custom={index + 1}
              d={d}
              key={d}
              variants={PATH_VARIANTS}
            />
          ))}
        </svg>
      </span>
    );
  },
);

SunIcon.displayName = "SunIcon";

export { SunIcon };
