"use client";

import { useEffect, useRef, useState } from "react";
import { FaWandMagicSparkles } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  MIN_REWRITE_LENGTH,
  RewriteAction,
  RewriteSection,
  rewriteText,
  SECTION_GUIDES,
  toPreviewText,
} from "@/lib/rewrite";
import { cn } from "@/lib/utils";
import { useLanguageModelCapability } from "../../hooks/useLanguageModelCapability";

interface RewritePopoverProps {
  section: RewriteSection;
  /** Read when a rewrite starts, so the popover never holds a stale copy. */
  getValue: () => string;
  onApply: (value: string) => void;
  className?: string;
}

/**
 * Advice on writing one section of the résumé, and the on-device model offering
 * to do it for you.
 *
 * Opening this costs nothing: the guidance is written down rather than
 * generated, so the panel is useful even in a browser with no model at all, and
 * a reader who just wanted to know what to write never waits on anything. The
 * model is reached only when one of the actions is pressed.
 *
 * A rewrite is always shown before it is applied. The field keeps what it has
 * until "Use this" is pressed, which is what makes trying an action safe.
 */
const RewritePopover = ({ section, getValue, onApply, className }: RewritePopoverProps) => {
  const guide = SECTION_GUIDES[section];
  const model = useLanguageModelCapability();

  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<RewriteAction | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  /** Which action produced the draft on screen, so "Try again" can repeat it. */
  const [lastAction, setLastAction] = useState<RewriteAction | null>(null);

  // A rewrite outlives neither the popover nor the field. Closing is a way to
  // say "never mind", and leaving a stream running would spend the model on an
  // answer with nowhere to go.
  useEffect(() => () => abort.current?.abort(), []);

  const reset = () => {
    abort.current?.abort();
    abort.current = null;
    setRunning(null);
    setDraft(null);
    setError(null);
    setLastAction(null);
  };

  /*
    Whether there is enough text to rewrite, sampled when the popover opens.

    Read on open rather than watched, for the same reason `getValue` is a
    callback: subscribing to the field would re-render this on every keystroke,
    and the answer is only needed while the panel is up. It gates the actions
    rather than being checked inside `run`, so a field that is too short says so
    before it is clicked instead of after.
  */
  const [tooShort, setTooShort] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setTooShort(getValue().trim().length < MIN_REWRITE_LENGTH);
    else reset();
  };

  const run = (action: RewriteAction) => {
    const text = getValue().trim();
    if (text.length < MIN_REWRITE_LENGTH) return;

    const controller = new AbortController();
    abort.current = controller;
    setRunning(action);
    setLastAction(action);
    setDraft("");
    setError(null);

    // Deliberately not awaited: the click's user activation has to reach
    // `create()` inside this call, and awaiting here would not change that but
    // would make the handler async for no reason.
    void rewriteText({
      section,
      action,
      text,
      signal: controller.signal,
      onChunk: (soFar) => {
        if (!controller.signal.aborted) setDraft(soFar);
      },
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setDraft(result);
        setRunning(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setRunning(null);
        setDraft(null);
        setError(
          cause instanceof Error && cause.message
            ? cause.message
            : "The rewrite could not be finished.",
        );
      });
  };

  const apply = () => {
    if (!draft) return;
    onApply(draft);
    handleOpenChange(false);
  };

  const downloading = model.state === "downloading";
  const unsupported = model.state === "unsupported";
  const busy = running !== null || downloading;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${guide.title} — suggestions`}
          className={cn(
            "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground",
            className,
          )}
        >
          <FaWandMagicSparkles className="size-3" />
          Improve
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[24rem]">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {guide.title}
        </p>

        {/* The advice stays up while a rewrite runs beneath it: it is the thing
            being applied, and it is also what a reader falls back on when the
            model is unavailable or its answer is not good enough. */}
        <ul className="mt-3 space-y-2">
          {guide.tips.map((tip) => (
            <li
              key={tip}
              className="flex gap-2 text-sm leading-relaxed text-muted-foreground before:text-foreground/40 before:content-['—']"
            >
              <span>{tip}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t pt-4">
          {draft !== null ? (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {running ? `${running.label}…` : "Suggested rewrite"}
              </p>
              {/* The draft is never written to the field until it is accepted,
                  so this is the only place it exists. */}
              <div className="scrollbar-overlay mt-2 max-h-56 overflow-y-auto whitespace-pre-line text-sm leading-relaxed">
                {toPreviewText(draft, section) || (
                  <span className="text-muted-foreground">Thinking…</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="text-sm"
                  disabled={running !== null}
                  onClick={apply}
                >
                  Use this
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-sm"
                  disabled={running !== null || lastAction === null}
                  onClick={() => lastAction && run(lastAction)}
                >
                  Try again
                </Button>
                <button
                  type="button"
                  onClick={reset}
                  className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  {running ? "Stop" : "Discard"}
                </button>
              </div>
            </>
          ) : downloading ? (
            <>
              <ProgressBar value={model.progress} label="Model download" />
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {model.progress === null
                  ? "Downloading model"
                  : `Downloading model · ${Math.round(model.progress * 100)}%`}
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {guide.actions.map((action) => (
                  <Button
                    key={action.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-sm"
                    disabled={unsupported || tooShort || busy}
                    onClick={() => run(action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                {unsupported
                  ? `${model.error ?? "On-device rewriting needs Chrome 138+ on desktop."} The advice above still applies.`
                  : tooShort
                    ? "Write a first draft here and the model can rewrite it."
                    : model.state === "downloadable"
                      ? "The model is downloaded the first time you do this, and kept for later. It runs on this device — nothing is uploaded."
                      : "Runs on this device — nothing is uploaded."}
              </p>
            </>
          )}

          {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RewritePopover;
