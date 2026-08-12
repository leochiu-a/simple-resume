"use client";

import { MotionConfig } from "motion/react";

/**
 * Makes Motion honour `prefers-reduced-motion`.
 *
 * Motion's default is `reducedMotion="never"` — it ignores the setting unless told
 * otherwise — and the animated icons vendored in `components/icons` carry no guard of
 * their own. Setting it here rather than in each of the seventeen files is both one
 * place instead of seventeen and the only version that survives re-adding an icon
 * from the registry, which overwrites those files wholesale.
 *
 * `"user"` disables transform and layout animations while keeping opacity and colour,
 * which is Motion's own reading of the setting. It is not total: `pathLength` is
 * neither a transform nor a layout property, so a stroke that draws itself still
 * draws. The alternative is patching every icon by hand and losing it on the next
 * `shadcn add`.
 */
const MotionProvider = ({ children }: { children: React.ReactNode }) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);

export default MotionProvider;
