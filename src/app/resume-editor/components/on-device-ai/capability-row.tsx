import { FC, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

/** The union of both capabilities' states, reduced to what a row has to draw. */
export type CapabilityState =
  | "checking"
  | "ready"
  | "off"
  | "downloading"
  | "unavailable"
  | "error";

const STATE_LABEL: Record<CapabilityState, string> = {
  checking: "Checking",
  ready: "Ready",
  off: "Off",
  downloading: "Downloading",
  unavailable: "Unavailable",
  error: "Error",
};

/**
 * The state word's colour. The word carries the meaning; this only makes
 * "working" and "broken" separable without reading, and everything in between
 * stays in the ink greys.
 */
const STATE_TONE: Record<CapabilityState, string> = {
  ready: "text-brand",
  error: "text-destructive",
  checking: "text-muted-foreground",
  off: "text-muted-foreground",
  downloading: "text-muted-foreground",
  unavailable: "text-muted-foreground",
};

interface CapabilityRowProps {
  icon: ReactNode;
  title: string;
  state: CapabilityState;
  detail: string;
  /** 0–1 while downloading; null when the download is not ours to measure. */
  progress?: number | null;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

const CapabilityRow: FC<CapabilityRowProps> = ({
  icon,
  title,
  state,
  detail,
  progress = null,
  action,
}) => (
  <div className="flex gap-2.5 px-3 py-2.5">
    <span
      className={cn(
        "mt-0.5 shrink-0",
        state === "ready" ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {icon}
    </span>

    <div className="min-w-0 flex-1">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium">{title}</span>
        {/* The same mono micro-label the form fields and dropdown headings use,
            which is where this app puts anything that is a status and not prose. */}
        <span
          className={cn(
            "ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.2em]",
            STATE_TONE[state],
          )}
        >
          {STATE_LABEL[state]}
        </span>
      </div>

      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>

      {state === "downloading" && (
        <ProgressBar value={progress} label={`${title} model download`} className="mt-2.5" />
      )}

      {action && (
        <Button
          type="button"
          size="sm"
          className="mt-2.5"
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </Button>
      )}
    </div>
  </div>
);

export default CapabilityRow;
