"use client";

import { FC, useState } from "react";
import { GaugeIcon } from "@/components/icons/gauge";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AgentReview } from "@/lib/resume-score/review";
import { ScoreReport } from "@/lib/resume-score/rules";
import { cn } from "@/lib/utils";
import { Resume } from "@/types/resume";

import ScorePanel from "./score-panel";
import { scoreBand } from "./score-ring";

const BAND_DOT: Record<ReturnType<typeof scoreBand>, string> = {
  weak: "bg-destructive",
  fair: "bg-amber-500",
  strong: "bg-emerald-500",
};

interface ScoreButtonProps {
  report: ScoreReport;
  resume: Resume;
  review: AgentReview | null;
  onClearReview: () => void;
}

/**
 * The bar's entry point, carrying the score itself.
 *
 * A number on the trigger rather than a plain icon: the score is worth glancing
 * at continuously and worth opening only occasionally, so putting it in the bar
 * means most visits to this feature cost no click at all. The dot gives the same
 * reading without colour vision doing the work alone — the digits are the signal
 * and the colour is the accent, not the other way round.
 */
const ScoreButton: FC<ScoreButtonProps> = ({ report, resume, review, onClearReview }) => {
  const band = scoreBand(report.score);
  /* Stamped when the drawer opens rather than read during render, so the review's
     "4 minutes ago" is fixed for as long as you are reading it — and so nothing
     here calls `Date.now()` during the server pass, which would not match the
     client's and would trip hydration. */
  const [openedAt, setOpenedAt] = useState(0);

  return (
    <Sheet onOpenChange={(open) => open && setOpenedAt(Date.now())}>
      <SheetTrigger asChild>
        <Button variant="outline" type="button" className="gap-2" aria-label="Resume score">
          <GaugeIcon className="size-4" />
          <span className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", BAND_DOT[band])} />
            <span className="font-mono text-xs tabular-nums">{report.score}</span>
          </span>
        </Button>
      </SheetTrigger>

      {/* Wider than the default `sm:max-w-sm`: every row here is a sentence of
          feedback, and at 384px the details wrap to four lines each. */}
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Resume score</SheetTitle>
          <SheetDescription>Rule-based checks over the resume you are editing.</SheetDescription>
        </SheetHeader>

        {/* The panel scrolls, the header does not. */}
        <div className="scrollbar-overlay min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ScorePanel
            report={report}
            resume={resume}
            review={review}
            onClearReview={onClearReview}
            now={openedAt}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ScoreButton;
