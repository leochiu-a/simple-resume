"use client";

import ScorePanel from "@/app/resume-editor/components/score/score-panel";

import { AFTER_REPORT, AFTER_RESUME, BEFORE_REPORT, BEFORE_RESUME } from "./score-fixtures";

/**
 * Before/after of the score panel — the real component, not pictures of it.
 *
 * This used to be two PNGs cropped from a run against the editor. The screenshots
 * were sharp and they were honest when they were taken, but they were also the one
 * place on the page where a claim about the product was made by an image that no
 * longer had anything to do with the product: change a weight in `rules.ts` and the
 * crops keep quoting the old arithmetic, and the caption keeps quoting numbers that
 * are no longer what the scorer says.
 *
 * So the panel is mounted twice against two resume fixtures and scored here, in the
 * reader's browser, by the same `scoreResume` the editor calls. Nothing in the figure
 * is authored: the scores, the bands, the findings and every `+n%` chip are computed,
 * which also means this figure cannot go stale without the page failing to build.
 *
 * It follows the site theme rather than being pinned to the editor's light palette —
 * `ScorePanel` reads the same `--c-*` primitives the landing tokens derive from, so a
 * dark-mode reader sees the panel they would actually get.
 *
 * The rows stay interactive, which is a bonus rather than the point: a finding with a
 * detail line can be expanded right here.
 */

const PANELS = [
  { key: "before", label: "Before", report: BEFORE_REPORT, resume: BEFORE_RESUME },
  { key: "after", label: "After", report: AFTER_REPORT, resume: AFTER_RESUME },
] as const;

/** The panel takes it for the agent-review timestamp, which these fixtures never have.
 *  A constant keeps the two renders identical between server and client. */
const NO_REVIEW_CLOCK = 0;

const noop = () => {};

const ScoreStoryboard = ({ caption }: { caption: React.ReactNode }) => (
  <figure className="m-0">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-4">
      {PANELS.map(({ key, label, report, resume }, index) => (
        <div
          key={key}
          className={`rounded-[var(--r-lg)] border p-2.5 ${
            // The "after" frame is the one the section is arguing for, so it gets
            // the lift and the ramp's edge while "before" stays neutral.
            index === 1
              ? "border-transparent bg-[image:var(--gradient)] shadow-[var(--shadow-md)]"
              : "border-[var(--rule)] bg-[var(--paper-raised)] shadow-[var(--shadow-sm)]"
          }`}
        >
          <div className="flex items-baseline justify-between px-1.5 pb-2">
            <span
              className={`font-mono text-[0.625rem] uppercase tracking-[0.16em] ${
                index === 1 ? "text-white/85" : "text-[var(--graphite-soft)]"
              }`}
            >
              {label}
            </span>
            <span
              className={`font-mono text-[0.625rem] tabular-nums ${
                index === 1 ? "text-white" : "text-[var(--graphite-soft)]"
              }`}
            >
              {report.score}
            </span>
          </div>

          {/* Fixed height, and it scrolls — which is what the real drawer does too.
              Left to grow, the full panel runs to ~970px because it ends in a list of
              passing checks, and the figure would be arguing its point in the top
              third and filling the other two with green ticks. Both frames get the
              same height so the two "to fix" lists start on the same line, which is
              the comparison the figure exists to make. */}
          <div className="h-[500px] overflow-y-auto overscroll-contain rounded-[calc(var(--r-lg)-6px)] bg-[var(--paper-raised)] p-5">
            <ScorePanel
              report={report}
              resume={resume}
              review={null}
              onClearReview={noop}
              now={NO_REVIEW_CLOCK}
            />
          </div>
        </div>
      ))}
    </div>

    <figcaption className="mt-5 text-[0.875rem] leading-[1.6] text-[var(--graphite-soft)]">
      {caption}
    </figcaption>
  </figure>
);

export default ScoreStoryboard;
