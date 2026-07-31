import { PropsWithChildren } from "react";

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

export const SectionTitle = ({
  index,
  children,
}: PropsWithChildren<{
  /** Shown in the margin, `aria-hidden` so it stays out of the heading's name. */
  index: string;
}>) => {
  return (
    // The visibility toggle arrives as part of `children` and is pushed to the far
    // end from here. It stays inside the heading deliberately: it acts on the
    // section the heading names, and that is how it is reached.
    <h2 className="flex items-center gap-3 border-t border-border pt-5 font-display text-[1.4rem] font-semibold leading-none tracking-[-0.02em] [&>button]:ml-auto [&>button]:text-muted-foreground [&>button]:transition-colors [&>button:hover]:text-foreground">
      <span aria-hidden className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">
        {index}
      </span>
      {children}
    </h2>
  );
};

export const SectionBody = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <div className={cn("mt-6 space-y-4", className)}>{children}</div>;
};

export const Section = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return <section className={cn("mb-14", className)}>{children}</section>;
};
