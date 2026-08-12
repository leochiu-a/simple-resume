"use client";

import { FC, useState } from "react";
import { Check, CircleAlert, CircleX } from "lucide-react";

import { ChevronDownIcon } from "@/components/icons/chevron-down";
import { ShieldCheckIcon } from "@/components/icons/shield-check";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AgentReview } from "@/lib/resume-score/review";
import { CheckResult, potentialGain, ScoreReport } from "@/lib/resume-score/rules";
import { cn } from "@/lib/utils";
import { Resume } from "@/types/resume";

import ReviewSection from "./review-section";
import ScoreRing, { scoreBand } from "./score-ring";

const BAND_HEADLINE: Record<ReturnType<typeof scoreBand>, string> = {
  weak: "Needs work",
  fair: "Getting there",
  strong: "Interview ready",
};

/* Stays on `lucide-react`, all three of it. `circle-alert` and `circle-x` have no
   animated counterpart in the registry, and a table of icon components can only have
   one call signature — the animated ones take `HTMLAttributes<HTMLDivElement>` where
   these take SVG props. Swapping only `pass` would also animate one row of a status
   list and leave its neighbours still. */
const STATUS_ICON = {
  fail: CircleX,
  warn: CircleAlert,
  pass: Check,
} as const;

const STATUS_TONE = {
  fail: "text-destructive",
  warn: "text-amber-500",
  pass: "text-emerald-500",
} as const;

interface CheckRowProps {
  check: CheckResult;
  applicableWeight: number;
}

/**
 * One finding.
 *
 * The gain is the point of the row, so it is set as its own chip rather than
 * buried in the sentence: "+6%" is what makes a list of criticisms read as a
 * list of moves. Passing checks show no chip — there is nothing left to earn.
 */
const CheckRow: FC<CheckRowProps> = ({ check, applicableWeight }) => {
  const [open, setOpen] = useState(false);
  const status = check.status === "skipped" ? "pass" : check.status;
  const Icon = STATUS_ICON[status];
  const gain = potentialGain(check, applicableWeight);
  const hasDetail = check.detail !== "";

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("rounded-sm border px-3 py-2.5", status !== "pass" && "bg-muted/40")}
    >
      <CollapsibleTrigger
        type="button"
        disabled={!hasDetail}
        className="flex w-full items-center gap-2.5 text-left disabled:cursor-default"
      >
        <Icon className={cn("size-4 shrink-0", STATUS_TONE[status])} />
        <span className="min-w-0 flex-1 truncate text-sm">{check.title}</span>

        {gain > 0 && (
          <span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-primary">
            +{gain}%
          </span>
        )}
        {/* An advisory row has no gain to show, and the empty space where every
            other row carries a chip would read as a bug. This says what it is
            instead: a remark, not a deduction. */}
        {check.advisory && check.status !== "pass" && (
          <span className="shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            FYI
          </span>
        )}
        {hasDetail && (
          <ChevronDownIcon
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </CollapsibleTrigger>

      {hasDetail && (
        <CollapsibleContent className="pl-6.5 pt-2">
          <p className="text-xs leading-relaxed text-muted-foreground">{check.detail}</p>
          {check.evidence && check.evidence.length > 0 && (
            <ul className="mt-2 space-y-1">
              {check.evidence.map((item, index) => (
                <li
                  key={index}
                  className="truncate border-l-2 pl-2 text-xs italic text-muted-foreground/80"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};

interface ScorePanelProps {
  report: ScoreReport;
  resume: Resume;
  /** Null until an agent submits one, which most sessions never will. */
  review: AgentReview | null;
  onClearReview: () => void;
  /** Passed in rather than read here so the age line is stable within a render. */
  now: number;
}

/**
 * The drawer's body: the score, then everything still to fix, then everything
 * already passing.
 *
 * Issues first and passes second, rather than one list in rule order. The panel
 * exists to answer "what do I do next", and a to-do list that opens with four
 * green ticks answers it slowly.
 */
const ScorePanel: FC<ScorePanelProps> = ({ report, resume, review, onClearReview, now }) => {
  const { score, issues, checks, applicableWeight } = report;
  const passed = checks.filter((check) => check.status === "pass");
  const band = scoreBand(score);

  /* The sum of the chips below, not `100 - score`.
     The two agree only while every rule applies. Hide a section and the score is
     rescaled over the rules that remain, so `100 - score` counts points that no
     longer exist and the headline promises more than the list can deliver.
     Adding up the same per-check figures the rows advertise keeps the headline
     answerable by the list under it. */
  const totalGain = issues.reduce((sum, check) => sum + potentialGain(check, applicableWeight), 0);

  /* Counted separately from `issues`, which also holds the advisory rows. The
     headline promises a percentage, so it may only count the findings that carry
     one — "5 things to fix, worth 25%" reads as a lie when one of the five is
     worth nothing by construction. */
  const scored = issues.filter((check) => !check.advisory);
  const advisory = issues.filter((check) => check.advisory);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ScoreRing score={score} />
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold">{BAND_HEADLINE[band]}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {scored.length === 0
              ? "Every scored check passes. Nothing here is blocking you."
              : `${scored.length} ${scored.length === 1 ? "thing" : "things"} to fix, worth ${totalGain}%.`}
          </p>
        </div>
      </div>

      {/* The claim that distinguishes this from every hosted scorer, stated where
          it is relevant rather than in marketing copy. */}
      <p className="flex items-start gap-2 rounded-sm border border-dashed px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Scored entirely in this browser. Your resume is never uploaded, and this panel makes no
          network requests.
        </span>
      </p>

      {scored.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            To fix
          </h3>
          {scored.map((check) => (
            <CheckRow key={check.id} check={check} applicableWeight={applicableWeight} />
          ))}
        </section>
      )}

      {/* Its own heading rather than the tail of "To fix". These findings cost
          nothing and may be wrong; filing them under a list of deductions would
          overstate them twice over. */}
      {advisory.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Worth a look
          </h3>
          {advisory.map((check) => (
            <CheckRow key={check.id} check={check} applicableWeight={applicableWeight} />
          ))}
        </section>
      )}

      {/* Below the rules, above the passing list: it is commentary on the same
          document, but it is not one of the checks and must not read as one. */}
      {review && (
        <ReviewSection review={review} resume={resume} now={now} onClear={onClearReview} />
      )}

      {passed.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Passing
          </h3>
          {passed.map((check) => (
            <CheckRow key={check.id} check={check} applicableWeight={applicableWeight} />
          ))}
        </section>
      )}
    </div>
  );
};

export default ScorePanel;
