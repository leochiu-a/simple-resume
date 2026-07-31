import { ReactNode } from "react";

/** The masthead every section below the hero carries: a numbered mono label in the
 *  margin, the statement itself set large in the display face. */
const SectionHeading = ({
  index,
  label,
  title,
}: {
  index: string;
  label: string;
  title: ReactNode;
}) => (
  <div className="grid grid-cols-1 gap-y-5 lg:grid-cols-12 lg:gap-x-14">
    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--graphite-soft)] lg:col-span-3 lg:pt-3">
      <span className="text-[var(--ink-display)]">{index}</span> / {label}
    </p>
    <h2 className="font-display text-[clamp(2.1rem,4.2vw,3.4rem)] font-semibold leading-[1.03] tracking-[-0.025em] lg:col-span-9">
      {title}
    </h2>
  </div>
);

export default SectionHeading;
