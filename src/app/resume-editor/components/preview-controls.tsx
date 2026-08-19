import { Resume } from "@/types/resume";

import type useTemplateOptions from "../hooks/useTemplateOptions";
import AppearanceTrigger from "./template/appearance-trigger";
import DownloadButton from "./template/download-button";
import OnDeviceAiButton from "./on-device-ai/on-device-ai-button";
import { LangPair } from "@/lib/translator";
import { WebMcpStatus } from "@/lib/webmcp";

/**
 * The mobile preview dialog's header.
 *
 * On desktop these controls are split by where they belong — download in the
 * header, appearance on the sheet. The dialog is the whole screen and the sheet
 * fills it, so there is nowhere for a floating control to float that is not on
 * top of the resume; here they sit in a row instead. The appearance panel keeps
 * its own trigger and popover, just without the hover reveal, which a touch
 * device would never fire anyway.
 */
const PreviewControls = ({
  resume,
  options,
  mcpStatus,
  mcpToolCount,
  pair,
  pairLabel,
  onOpenAppearance,
  onImport,
}: {
  resume: Resume;
  options: ReturnType<typeof useTemplateOptions>;
  mcpStatus: WebMcpStatus;
  mcpToolCount: number;
  pair: LangPair | null;
  pairLabel: string | null;
  onOpenAppearance: () => void;
  onImport: () => void;
}) => {
  const { template, backgroundColor } = options;

  return (
    <div className="flex items-center gap-3">
      <AppearanceTrigger
        onOpen={onOpenAppearance}
        // The fade is a desktop affordance keyed off hovering the preview pane,
        // and there is no such pane here — `reveal={false}` rather than an
        // `opacity-100` class, because the reveal also removes pointer events.
        reveal={false}
        // `size-9` to match the row it sits in.
        className="size-9 shadow-none"
        // A tooltip here would swallow the Escape that should close the dialog —
        // see the note on the prop itself.
        tooltip={false}
      />

      <DownloadButton
        resume={resume}
        backgroundColor={backgroundColor}
        template={template}
        onImport={onImport}
      />

      <OnDeviceAiButton
        mcpStatus={mcpStatus}
        mcpToolCount={mcpToolCount}
        pair={pair}
        pairLabel={pairLabel}
        tooltip={false}
      />
    </div>
  );
};

export default PreviewControls;
