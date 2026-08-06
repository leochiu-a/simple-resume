"use client";

import { FC, useState } from "react";
import { FaRobot } from "react-icons/fa6";
import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Tooltip } from "@/components/ui/tooltip";
import { LangPair, TranslatorStatus } from "@/lib/translator";
import { cn } from "@/lib/utils";
import { WebMcpStatus } from "@/lib/webmcp";
import { useTranslatorCapability } from "../../hooks/useTranslatorCapability";
import CapabilityRow, { CapabilityState } from "./capability-row";

interface OnDeviceAiButtonProps {
  mcpStatus: WebMcpStatus;
  mcpToolCount: number;
  /** null until a second language is chosen — nothing is probed before then. */
  pair: LangPair | null;
  /** Human-readable direction for the row, e.g. "Chinese → English". */
  pairLabel: string | null;
}

const TRANSLATOR_ROW_STATE: Record<TranslatorStatus["state"], CapabilityState> = {
  checking: "checking",
  unsupported: "unavailable",
  downloadable: "off",
  downloading: "downloading",
  ready: "ready",
  error: "error",
};

const mcpRowState = (status: WebMcpStatus): CapabilityState =>
  status === "ready"
    ? "ready"
    : status === "error"
      ? "error"
      : status === "checking"
        ? "checking"
        : "unavailable";

const mcpDetail = (status: WebMcpStatus, toolCount: number) => {
  if (status === "ready") {
    return `${toolCount} tools registered — ask your browser agent to fill in this resume.`;
  }
  if (status === "error") return "Registering the WebMCP tools failed.";
  if (status === "checking") return "Looking for a browser agent…";

  return "Needs Edge 147+, or chrome://flags/#enable-webmcp-testing.";
};

const translationDetail = (
  translator: TranslatorStatus,
  pairLabel: string | null,
  hasPair: boolean,
) => {
  if (!hasPair) return "Pick a second language for this resume to enable translation.";

  switch (translator.state) {
    case "checking":
      return "Checking whether the model is already on this device…";
    case "unsupported":
      // The API can also be present but unusable — the pair unsupported, or the
      // model service silent — and saying so beats blaming the browser version.
      return translator.error ?? "Needs Chrome 138+ or Edge 148+ on desktop.";
    case "downloadable":
      return `${pairLabel} — the model downloads once, then stays on this device.`;
    case "downloading":
      return translator.progress === null
        ? "Another tab is already downloading this model."
        : `${pairLabel} — downloading, ${Math.round(translator.progress * 100)}%.`;
    case "ready":
      return `${pairLabel} — ready to translate.`;
    case "error":
      return translator.error ?? "Something went wrong.";
  }
};

/**
 * The nav's one on-device AI control: a status readout for both browser-side AI
 * capabilities this editor uses, and the place the translation model is turned on.
 *
 * A Popover and not a DropdownMenu, deliberately. The panel holds a progress bar
 * and a real button, which `role="menu"` misdescribes; `DropdownMenuItem` closes
 * on select, and the download has to stay on screen after the click that starts
 * it; and a Radix menu's roving tabindex takes the nested button out of the tab
 * order. Popover is also non-modal by default, so the nav and the colour
 * picker's full-screen click-catcher keep working while it is open — and, for
 * the same containing-block reason the nav gives, nothing here may use
 * `backdrop-blur`.
 */
const OnDeviceAiButton: FC<OnDeviceAiButtonProps> = ({
  mcpStatus,
  mcpToolCount,
  pair,
  pairLabel,
}) => {
  const [open, setOpen] = useState(false);
  const translator = useTranslatorCapability(pair);

  // Both still probing: a control that appears and then changes its mind reads
  // worse than one that arrives a moment late. Matches the old badge's behaviour.
  if (mcpStatus === "checking" && translator.state === "checking") return null;

  const downloading = translator.state === "downloading";
  const allUnavailable = mcpStatus !== "ready" && translator.state === "unsupported";
  const canEnable = translator.state === "downloadable" || translator.state === "error";

  const tooltip = downloading
    ? translator.progress === null
      ? "Downloading translation model"
      : `Downloading translation model — ${Math.round(translator.progress * 100)}%`
    : allUnavailable
      ? "On-device AI — not available in this browser"
      : "On-device AI";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip title={tooltip}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-busy={downloading}
            aria-label="On-device AI"
            className={cn(allUnavailable && "text-muted-foreground")}
          >
            {/* Noto's animated sparkles, self-hosted from `public/`.

                Not the fonts.gstatic.com URL it ships as: this page promises the
                resume never leaves the browser, the fonts are already self-hosted
                by next/font, and an icon fetched from a third party would be the
                only outbound request the editor makes. The file is also rebuilt
                at 64px and half the frame rate — 24KB rather than the 188KB
                original, for a mark that renders at sixteen pixels.

                A raster cannot take `currentColor`, so the dimming that says
                "nothing here works" is done with a filter instead.

                The spinner takes its place rather than joining it, the same swap
                the download button makes. */}
            {downloading ? (
              <LoadingSpinner className="size-3.5" />
            ) : (
              <picture>
                {/* No JS needed to respect the setting: <source media> takes any
                    media query, and the still frame is the same artwork. */}
                <source srcSet="/sparkles.svg" media="(prefers-reduced-motion: reduce)" />
                {/* eslint-disable-next-line @next/next/no-img-element -- an
                    animated WebP inside <picture>; next/image cannot serve either. */}
                <img
                  src="/sparkles.webp"
                  alt=""
                  width={16}
                  height={16}
                  className={cn("size-4", allUnavailable && "opacity-40 grayscale")}
                />
              </picture>
            )}
          </Button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent align="end" collisionPadding={16} className="w-72 p-0">
        <p className="border-b px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          On-device AI
        </p>

        <div className="divide-y">
          <CapabilityRow
            icon={<FaRobot className="size-3.5" />}
            title="Browser agent"
            state={mcpRowState(mcpStatus)}
            detail={mcpDetail(mcpStatus, mcpToolCount)}
          />

          <CapabilityRow
            icon={<Languages className="size-3.5" />}
            title="Translation"
            state={TRANSLATOR_ROW_STATE[translator.state]}
            detail={translationDetail(translator, pairLabel, !!pair)}
            progress={translator.progress}
            action={
              canEnable
                ? {
                    label: translator.state === "error" ? "Try again" : "Enable",
                    // This click is the user activation. Nothing may be awaited
                    // before it reaches Translator.create().
                    onClick: () => {
                      void translator.enable().catch(() => {
                        // The failure is already on the row; rethrowing here
                        // would only surface an unhandled rejection.
                      });
                    },
                  }
                : undefined
            }
          />
        </div>

        <p className="border-t px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          Both models run inside your browser. Nothing in this resume is sent anywhere.
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default OnDeviceAiButton;
