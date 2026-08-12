import Image from "next/image";

/**
 * Before/after crops of the score panel itself, not a recording of it.
 *
 * A screen recording of the whole editor reads as evidence, but squeezed into
 * a page column it turns illegible — the one number that matters shrinks
 * along with everything else. Cropping to just the panel and shipping it as
 * two static frames keeps the number, and the rule list under it, sharp at
 * any width. Both crops come from a real run against this editor; the score
 * is not staged copy.
 */
const FRAMES = [
  {
    src: "/ai-demo/score-before.png",
    alt: "Resume score panel showing 59, “Getting there”, with four rules to fix: quantified results, overall length, every role described, bullet length.",
    label: "Before",
    detail: "59 · Getting there",
  },
  {
    src: "/ai-demo/score-after.png",
    alt: "Resume score panel showing 91, “Interview ready”, with the quantified-results and bullet-length rules now passing.",
    label: "After",
    detail: "91 · Interview ready",
  },
];

const ScoreStoryboard = ({ caption }: { caption: React.ReactNode }) => (
  <figure className="m-0">
    <div className="grid grid-cols-2 gap-4">
      {FRAMES.map((frame, index) => (
        <div
          key={frame.src}
          className={`overflow-hidden rounded-[var(--r-lg)] border bg-[var(--paper-raised)] p-2.5 ${
            // The "after" frame is the one the section is arguing for, so it gets
            // the lift and the ramp's edge while "before" stays neutral.
            index === 1
              ? "border-transparent bg-[image:var(--gradient)] shadow-[var(--shadow-md)]"
              : "border-[var(--rule)] shadow-[var(--shadow-sm)]"
          }`}
        >
          <div className="flex items-baseline justify-between px-1.5 pb-2">
            <span
              className={`font-mono text-[0.625rem] uppercase tracking-[0.16em] ${
                index === 1 ? "text-white/85" : "text-[var(--graphite-soft)]"
              }`}
            >
              {frame.label}
            </span>
            <span
              className={`font-mono text-[0.625rem] tabular-nums ${
                index === 1 ? "text-white" : "text-[var(--graphite-soft)]"
              }`}
            >
              {frame.detail}
            </span>
          </div>
          <Image
            src={frame.src}
            alt={frame.alt}
            width={448}
            height={520}
            className="block w-full rounded-[calc(var(--r-lg)-6px)]"
          />
        </div>
      ))}
    </div>

    <figcaption className="mt-5 text-[0.875rem] leading-[1.6] text-[var(--graphite-soft)]">
      {caption}
    </figcaption>
  </figure>
);

export default ScoreStoryboard;
