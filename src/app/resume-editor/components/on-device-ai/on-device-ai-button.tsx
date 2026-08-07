"use client";

import { FC, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Tooltip } from "@/components/ui/tooltip";
import { LangPair } from "@/lib/translator";
import { cn } from "@/lib/utils";
import { WebMcpStatus } from "@/lib/webmcp";
import { useTranslatorCapability } from "../../hooks/useTranslatorCapability";
import OnDeviceAiRows from "./on-device-ai-rows";

interface OnDeviceAiButtonProps {
  mcpStatus: WebMcpStatus;
  mcpToolCount: number;
  /** null until a second language is chosen — nothing is probed before then. */
  pair: LangPair | null;
  /** Human-readable direction for the row, e.g. "Chinese → English". */
  pairLabel: string | null;
  /**
   * Off inside the mobile preview dialog. A Radix tooltip closes on Escape and
   * stops the event propagating, so a tooltip on a control inside a dialog eats
   * the Escape that should have closed the dialog. The `aria-label` still names
   * the button. See the same note on AppearanceTrigger.
   */
  tooltip?: boolean;
}

/**
 * The standalone on-device AI control, used by the editor header on desktop and
 * by the mobile preview dialog's toolbar.
 *
 * The rows spent a release rendered inline in the header's overflow menu instead,
 * on the reasoning that a trigger was a click nobody needed to read a status. The
 * click was real but it bought less than it cost: inline, the capability was
 * invisible until you opened a `…` menu, and its two titles, status words,
 * sentences and privacy note buried the five one-line settings beneath it. A
 * trigger in the bar is the thing that advertises the capability.
 *
 * A Popover and not a DropdownMenu, deliberately — see the note on
 * `OnDeviceAiRows` for the progress-bar, close-on-select and roving-tabindex
 * reasons. Popover is also non-modal by default, so the rest of the bar keeps
 * working while it is open.
 */
const OnDeviceAiButton: FC<OnDeviceAiButtonProps> = ({
  mcpStatus,
  mcpToolCount,
  pair,
  pairLabel,
  tooltip: withTooltip = true,
}) => {
  const [open, setOpen] = useState(false);
  const translator = useTranslatorCapability(pair);

  // Both still probing: a control that appears and then changes its mind reads
  // worse than one that arrives a moment late. Matches the old badge's behaviour.
  if (mcpStatus === "checking" && translator.state === "checking") {
    return null;
  }

  const downloading = translator.state === "downloading";
  const allUnavailable = mcpStatus !== "ready" && translator.state === "unsupported";

  const tooltip = downloading
    ? translator.progress === null
      ? "Downloading translation model"
      : `Downloading translation model — ${Math.round(translator.progress * 100)}%`
    : allUnavailable
      ? "On-device AI — not available in this browser"
      : "On-device AI";

  /* Noto's animated sparkles, self-hosted from `public/`.

     Not the fonts.gstatic.com URL it ships as: this page promises the resume never
     leaves the browser, the fonts are already self-hosted by next/font, and an
     icon fetched from a third party would be the only outbound request the editor
     makes. The file is also rebuilt at 64px and half the frame rate — 24KB rather
     than the 188KB original, for a mark that renders at sixteen pixels.

     A raster cannot take `currentColor`, so the dimming that says "nothing here
     works" is done with a filter instead.

     The spinner takes its place rather than joining it, the same swap the download
     button makes. */
  const mark = downloading ? (
    <LoadingSpinner className="size-3.5" />
  ) : (
    <picture>
      {/* No JS needed to respect the setting: <source media> takes any media
          query, and the still frame is the same artwork. */}
      <source srcSet="/sparkles.svg" media="(prefers-reduced-motion: reduce)" />
      {/* eslint-disable-next-line @next/next/no-img-element -- an animated WebP
          inside <picture>; next/image cannot serve either. */}
      <img
        src="/sparkles.webp"
        alt=""
        width={16}
        height={16}
        className={cn("size-4", allUnavailable && "opacity-40 grayscale")}
      />
    </picture>
  );

  const iconTrigger = (
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-busy={downloading}
        aria-label="On-device AI"
        className={cn(allUnavailable && "text-muted-foreground")}
      >
        {mark}
      </Button>
    </PopoverTrigger>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {withTooltip ? <Tooltip title={tooltip}>{iconTrigger}</Tooltip> : iconTrigger}

      <PopoverContent align="end" collisionPadding={16} className="w-72 p-0">
        <p className="border-b px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          On-device AI
        </p>

        <OnDeviceAiRows
          mcpStatus={mcpStatus}
          mcpToolCount={mcpToolCount}
          pair={pair}
          pairLabel={pairLabel}
        />
      </PopoverContent>
    </Popover>
  );
};

export default OnDeviceAiButton;
