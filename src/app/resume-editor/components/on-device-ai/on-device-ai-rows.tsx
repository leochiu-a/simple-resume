"use client";

import { FC } from "react";
import { FaRobot } from "react-icons/fa6";
import { Languages } from "lucide-react";

import { LangPair, TranslatorStatus } from "@/lib/translator";
import { cn } from "@/lib/utils";
import { WebMcpStatus } from "@/lib/webmcp";
import { useTranslatorCapability } from "../../hooks/useTranslatorCapability";
import CapabilityRow, { CapabilityState } from "./capability-row";

interface OnDeviceAiRowsProps {
  mcpStatus: WebMcpStatus;
  mcpToolCount: number;
  /** null until a second language is chosen — nothing is probed before then. */
  pair: LangPair | null;
  /** Human-readable direction for the row, e.g. "Chinese → English". */
  pairLabel: string | null;
  /**
   * Draws the rows as a bordered card. On inside the header's overflow menu,
   * where the group needs an edge of its own to separate it from the menu's other
   * sections; off inside the mobile dialog's popover, which is already a card and
   * would otherwise nest one inside another.
   */
  framed?: boolean;
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
 * The status readout for both browser-side AI capabilities this editor uses, and
 * the place the translation model is turned on.
 *
 * Deliberately trigger-less and surface-less. It is rendered inline in the
 * editor header's overflow menu and inside the mobile preview dialog's popover,
 * and those two showed the same information for long enough to drift apart while
 * each owned its own copy. Whatever hosts it supplies the panel chrome; this
 * supplies only the content.
 *
 * Nothing in here is a `menuitem`, and callers must not make it one. The panel
 * holds a progress bar and a real button, which `role="menu"` misdescribes; a
 * Radix menu item closes its menu on select, and the download has to stay on
 * screen after the click that starts it; and a menu's roving tabindex would take
 * the Enable button out of the tab order entirely.
 */
const OnDeviceAiRows: FC<OnDeviceAiRowsProps> = ({
  mcpStatus,
  mcpToolCount,
  pair,
  pairLabel,
  framed = false,
}) => {
  const translator = useTranslatorCapability(pair);
  const canEnable = translator.state === "downloadable" || translator.state === "error";

  return (
    /*
      A bordered card, not a run of full-bleed rows.

      Inside the header's overflow menu the old edge-to-edge dividers were the
      same line the menu draws between its own sections, so these two capability
      rows read as loose siblings of Light/Dark/System rather than as one group
      with a heading. Boxing them and insetting the box from the menu's padding
      makes the grouping structural rather than something the label alone has to
      imply.
    */
    <div className={cn(framed && "mx-1 my-1 overflow-hidden rounded-sm border bg-muted/30")}>
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
    </div>
  );
};

export default OnDeviceAiRows;
