"use client";

import Link from "next/link";
import { CSSProperties, ReactNode, useEffect, useRef } from "react";

import { ArrowRightIcon } from "@/components/icons/arrow-right";

import { EDITS, type Figure } from "./edits";

/**
 * The guide's six edits, each with the figure that proves it.
 *
 * This page used to argue to a live A4 sheet, which was the honest thing to show
 * and unreadable: the template's body type came out at 7.9px in a column, so the
 * one part a reader needed — the actual words — was the one part they could not
 * have. Nothing here is a rendering of a page. Each figure is set at reading size
 * and shows the single change the edit makes: a line rewritten, a stack reordered,
 * a list cut.
 *
 * The animations are what carry "before" and "after" as one thing rather than two
 * columns of examples, and they are all CSS — see the `guide-*` keyframes in
 * globals.css for why every resting state here is the finished state.
 */

const NUMBER = "font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[var(--graphite-soft)]";
const HEADING =
  "mt-3 font-display text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.026em]";
const BODY = "mt-5 max-w-[62ch] text-[1.0625rem] leading-[1.7] text-[var(--graphite-soft)]";
const FIGURE =
  "mt-10 overflow-hidden rounded-[var(--r-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] shadow-[var(--shadow-sm),var(--highlight)]";
const FIGURE_LABEL = "font-mono text-[0.625rem] uppercase tracking-[0.18em]";

/**
 * The rewrite is two beats, not one: the old line is struck, and *then* the new one
 * is written. They used to run together, which meant the page showed both halves at
 * once and demonstrated neither — `WORD_LEAD` is the pause that puts the cause
 * before the effect.
 *
 * The per-word step is capped by a budget rather than fixed, so a five-word title
 * lands at a readable cadence without a twenty-six-word summary taking all day.
 */
const WORD_LEAD = 0.75;
const WORD_BUDGET = 1;
const wordStep = (count: number) => Math.min(0.045, WORD_BUDGET / count);

/** The `--*` custom properties the `guide-*` keyframes read. React types `style` as
 *  known properties only, so they go through here rather than a cast per call. */
const vars = (values: Record<string, string>) => values as CSSProperties;

/**
 * Plays a figure's animations whenever it is properly on screen, by setting
 * `data-played` on it — the CSS does the rest.
 *
 * Two things here were wrong at first and are worth keeping wrong-proof.
 *
 * The band. It used to fire at `threshold: 0.25` with the bottom of the viewport as
 * the edge, so a figure started playing while it was still a quarter visible at the
 * very bottom of the screen and the reader was two paragraphs above it. It was over
 * before anyone looked at it, which reads as "the animation is too fast" and is not.
 * The band is now inset top and bottom, and half the figure has to be inside it.
 *
 * And it replays. The attribute is dropped again on the way out, so scrolling back
 * up runs it again — the animation is the explanation, and an explanation you get
 * exactly one chance to catch is a bad one. It is still one play per arrival rather
 * than a loop: six figures cycling forever would be motion nobody asked for, and a
 * change that keeps un-happening stops reading as a change at all.
 */
const usePlayOnEntry = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) element.dataset.played = "";
        else delete element.dataset.played;
      },
      { threshold: 0.4, rootMargin: "-12% 0px -22% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
};

/**
 * The new wording, one word at a time, with the number wrapped so the highlight can
 * sweep under it once the sentence has landed.
 *
 * The split is on whitespace and the highlight is matched against *whole* words,
 * which is what keeps the punctuation attached: slicing the string at the end of
 * the highlight instead leaves a full stop stranded as its own token, and it lands
 * a space away from the word it belongs to.
 */
const Words = ({ text, highlight }: { text: string; highlight?: string }) => {
  const at = highlight ? text.indexOf(highlight) : -1;
  const words = text.split(" ");

  // Which words fall inside the highlight, by character offset.
  let cursor = 0;
  const marked = words.map((word) => {
    const start = cursor;
    cursor += word.length + 1;
    return at !== -1 && start < at + highlight!.length && start + word.length > at;
  });

  const step = wordStep(words.length);
  const markDelay = `${(WORD_LEAD + words.length * step + 0.3).toFixed(3)}s`;
  const nodes: ReactNode[] = [];
  let run: ReactNode[] = [];

  const flush = (index: number) => {
    if (!run.length) return;
    nodes.push(
      <span
        key={`mark-${index}`}
        className="guide-mark"
        style={vars({ "--mark-delay": markDelay })}
      >
        {run}
      </span>,
    );
    run = [];
  };

  words.forEach((word, index) => {
    const node = (
      <span
        key={`${index}-${word}`}
        className="guide-word"
        style={vars({ "--delay": `${(WORD_LEAD + index * step).toFixed(3)}s` })}
      >
        {word}
      </span>
    );

    // The separating space belongs outside the mark when the run is starting and
    // inside it once the run is going, so the highlight covers the number and not
    // the gap in front of it.
    if (marked[index]) {
      if (run.length) run.push(" ");
      else if (index) nodes.push(" ");
      run.push(node);
      return;
    }

    flush(index);
    if (index) nodes.push(" ");
    nodes.push(node);
  });

  flush(words.length);

  return <>{nodes}</>;
};

/**
 * Row metrics in px, because three things have to agree on them exactly: the height
 * of a row, the distance the reorder animation translates by, and where the rule
 * falls. Deriving all three from one number is what keeps the rule in the gap.
 *
 * A stack that carries the rule needs a wider gap than one that does not — the
 * label is about 15px tall, so an 8px gap cannot hold it and it lands on the row
 * below no matter where the line is drawn.
 */
const ROW_HEIGHT = 60;
const gapFor = (topThird?: boolean) => (topThird ? 28 : 8);

const StackFigure = ({ figure }: { figure: Extract<Figure, { kind: "stack" }> }) => {
  const gap = gapFor(figure.topThird);
  const step = ROW_HEIGHT + gap;

  return (
    <ol className="relative mt-5" style={vars({ "--row-step": `${step}px` })}>
      {figure.rows.map((row, index) => (
        <li
          key={row.label}
          className="guide-lift flex flex-col justify-center gap-0.5 rounded-[var(--r-sm)] border border-[var(--rule)] bg-[var(--wash)] px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          style={{
            height: ROW_HEIGHT,
            marginBottom: index === figure.rows.length - 1 ? 0 : gap,
            ...vars({
              "--from-y": `calc(var(--row-step) * ${row.from - index})`,
              // Wide enough apart that the rows arrive one after another. Moving them
              // together is the same picture as not moving them at all.
              "--delay": `${(index * 0.12).toFixed(2)}s`,
            }),
          }}
        >
          <span className="text-[0.9375rem] font-medium leading-[1.3]">{row.label}</span>
          <span className="font-mono text-[0.6875rem] leading-[1.3] text-[var(--graphite-soft)]">
            {row.meta}
          </span>
        </li>
      ))}

      {/* Drawn over the list rather than between two of its items: it marks a height
          on the page, which is exactly the claim — the rule falls where it falls.
          Centred on the gap's midpoint rather than starting there, or the label's own
          box hangs 11px into the row underneath. */}
      {figure.topThird && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 flex -translate-y-1/2 items-center gap-3"
          style={{ top: `${step * 2 - gap / 2}px` }}
        >
          <span className="h-px flex-1 bg-[var(--accent)] opacity-50" />
          <span className={`${FIGURE_LABEL} shrink-0 pl-2 text-[var(--accent)]`}>
            What gets read
          </span>
        </div>
      )}
    </ol>
  );
};

const ChipsFigure = ({ figure }: { figure: Extract<Figure, { kind: "chips" }> }) => (
  <ul className="mt-5 flex flex-wrap gap-2">
    {figure.kept.map((skill) => (
      <li
        key={skill}
        className="rounded-full border border-[var(--rule-strong)] bg-[var(--wash)] px-3 py-1.5 text-[0.875rem] font-medium"
      >
        {skill}
      </li>
    ))}
    {figure.dropped.map((skill, index) => (
      <li
        key={skill}
        className="guide-cull rounded-full border border-[var(--rule)] px-3 py-1.5 text-[0.875rem] text-[var(--graphite-soft)] line-through decoration-[var(--rule-strong)] opacity-45"
        style={vars({ "--delay": `${(0.25 + index * 0.075).toFixed(3)}s` })}
      >
        {skill}
      </li>
    ))}
  </ul>
);

const EditFigure = ({ figure }: { figure: Figure }) => {
  const ref = usePlayOnEntry<HTMLElement>();

  if (figure.kind === "line") {
    return (
      <figure ref={ref} className={`${FIGURE} m-0`}>
        <div className="border-b border-[var(--rule)] px-5 py-5 sm:px-7">
          <p className={`${FIGURE_LABEL} text-[var(--graphite-soft)]`}>Before</p>
          <p className="mt-2.5 text-[1.0625rem] leading-[1.6] text-[var(--graphite-soft)]">
            <span className="guide-strike">{figure.before}</span>
          </p>
        </div>
        <div className="px-5 py-5 sm:px-7">
          <p className={`${FIGURE_LABEL} text-[var(--accent)]`}>After</p>
          <p className="mt-2.5 text-[1.0625rem] font-medium leading-[1.6]">
            <Words text={figure.after} highlight={figure.highlight} />
          </p>
        </div>
      </figure>
    );
  }

  return (
    <figure ref={ref} className={`${FIGURE} m-0 px-5 py-5 sm:px-7`}>
      <p className={`${FIGURE_LABEL} text-[var(--graphite-soft)]`}>
        {figure.kind === "stack"
          ? "Order on the page"
          : `Skills · ${figure.kept.length + figure.dropped.length} → ${figure.kept.length}`}
      </p>
      {figure.kind === "stack" ? <StackFigure figure={figure} /> : <ChipsFigure figure={figure} />}
    </figure>
  );
};

const RewriteGuide = () => (
  <div className="mx-auto w-full max-w-[1120px] px-6">
    <div className="mx-auto max-w-[46rem]">
      {EDITS.map((edit, index) => (
        <section
          key={edit.id}
          id={edit.id}
          className="scroll-mt-24 border-t border-[var(--rule)] py-16 lg:py-24"
        >
          <p className={NUMBER}>Edit {String(index + 1).padStart(2, "0")}</p>
          <h2 className={HEADING}>{edit.title}</h2>
          <p className={BODY}>{edit.body}</p>
          <EditFigure figure={edit.figure} />
        </section>
      ))}

      <section className="border-t border-[var(--rule)] py-16 lg:py-24">
        <p className={NUMBER}>After</p>
        <h2 className={HEADING}>Same nine years. Read this time.</h2>
        <p className={BODY}>
          Nothing was invented to get here — no employer, no date, no number that was not already
          true. The six edits only decided what got said first, what got said in numbers, and what
          did not need saying. That is most of what resume advice is, and all of it is available to
          you before anyone reads a word.
        </p>

        <Link
          href="/resume-editor"
          className="group mt-9 inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient)] px-6 py-3 text-[0.9375rem] font-medium text-white shadow-[0_6px_20px_-6px_hsl(184_80%_40%/0.55)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_10px_28px_-6px_hsl(184_80%_40%/0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
        >
          Write yours
          <ArrowRightIcon
            aria-hidden
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </Link>
      </section>
    </div>
  </div>
);

export default RewriteGuide;
