import { FC } from "react";
import { Bot, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentReview, ReviewNote } from "@/lib/resume-score/review";
import { Resume } from "@/types/resume";

/** Where a note points, written the way the form labels it. */
const describeTarget = (note: ReviewNote, resume: Resume): string | null => {
  const { section, entryIndex, bulletIndex } = note;
  if (!section) return null;

  if (section === "profile") return "Profile";
  if (section === "skills") return "Skills";

  const entries = section === "employmentHistory" ? resume.employmentHistory : resume.projects;
  const entry = entryIndex === undefined ? undefined : entries?.[entryIndex];
  const label =
    section === "employmentHistory"
      ? ((entry as Resume["employmentHistory"][number] | undefined)?.company ?? "")
      : ((entry as Resume["projects"][number] | undefined)?.name ?? "");

  const heading = label.trim() || (section === "employmentHistory" ? "Employment" : "Projects");

  return bulletIndex === undefined ? heading : `${heading} · bullet ${bulletIndex + 1}`;
};

/** "just now", "4 minutes ago" — enough for the reader to weigh how stale it is. */
const describeAge = (submittedAt: number, now: number): string => {
  const minutes = Math.floor((now - submittedAt) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);

  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
};

interface ReviewSectionProps {
  review: AgentReview;
  resume: Resume;
  now: number;
  onClear: () => void;
}

/**
 * The agent's review, kept visibly separate from the rules above it.
 *
 * The separation is the design. Everything higher in this drawer is computed
 * from fixed weights and is the same for the same document; this is one
 * assistant's opinion of one version of it. Merging them would leave the reader
 * unable to tell which claims the page stands behind, so this section is
 * attributed, timestamped, dismissable, and carries no score of its own.
 */
const ReviewSection: FC<ReviewSectionProps> = ({ review, resume, now, onClear }) => (
  <section className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <Bot className="size-3.5" />
        From your assistant
      </h3>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={onClear}
        className="h-6 px-1.5 text-muted-foreground"
      >
        <X className="size-3.5" />
        <span className="sr-only">Dismiss review</span>
      </Button>
    </div>

    <div className="rounded-sm border border-dashed px-3 py-2.5">
      <p className="text-xs leading-relaxed">{review.summary}</p>
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Reviewed {describeAge(review.submittedAt, now)} · not part of the score
      </p>
    </div>

    {review.notes.map((note, index) => {
      const target = describeTarget(note, resume);

      return (
        <div key={index} className="rounded-sm border px-3 py-2.5">
          {target && (
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {target}
            </p>
          )}
          {note.quote && (
            <p className="mt-1 truncate border-l-2 pl-2 text-xs italic text-muted-foreground/80">
              {note.quote}
            </p>
          )}
          <p className="mt-1.5 text-xs leading-relaxed">{note.comment}</p>
          {note.suggestion && (
            <p className="mt-2 rounded-sm bg-muted/60 px-2 py-1.5 text-xs leading-relaxed">
              <span className="font-medium">Suggested: </span>
              {note.suggestion}
            </p>
          )}
        </div>
      );
    })}
  </section>
);

export default ReviewSection;
