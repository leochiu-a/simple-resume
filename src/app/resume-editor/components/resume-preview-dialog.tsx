import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LangPair } from "@/lib/translator";
import { WebMcpStatus } from "@/lib/webmcp";
import { Resume } from "@/types/resume";

import type useTemplateOptions from "../hooks/useTemplateOptions";
import ResumeIframeCSR from "./template/resume-iframe";
import PreviewControls from "./preview-controls";
import AppearancePanel from "./template/appearance-panel";

/**
 * The mobile preview. The header has no room for the controls at this width, so
 * they ride in the dialog's own header instead.
 */
const ResumePreviewDialog = ({
  resume,
  options,
  mcpStatus,
  mcpToolCount,
  pair,
  pairLabel,
  onImport,
}: {
  resume: Resume;
  options: ReturnType<typeof useTemplateOptions>;
  mcpStatus: WebMcpStatus;
  mcpToolCount: number;
  pair: LangPair | null;
  pairLabel: string | null;
  /** Reaches the Share menu in the dialog's toolbar, which is where importing
   *  lives at mobile widths. */
  onImport: () => void;
}) => {
  const [open, setOpen] = useState(false);
  /* The dialog has no second column to swap, so the appearance panel takes over
     the dialog's body instead — the same mode, scaled to the space available. */
  const [showAppearance, setShowAppearance] = useState(false);
  const { template, backgroundColor } = options;

  const handleChangeOpen = (open: boolean) => {
    setOpen(open);
    // Never reopen onto the appearance panel: the button says "Preview", so the
    // preview is what it has to show.
    if (!open) setShowAppearance(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleChangeOpen}>
        {/*
          `DialogTitle` and `DialogDescription` name the dialog for assistive
          technology; they are not layout. This used to hang the whole preview off
          `DialogDescription` and the toolbar off `DialogTitle`, which worked by
          accident — until the body became a real element and `asChild` handed
          Radix's description props to it. That broke the dialog's own wiring:
          Escape stopped closing it and the body kept `data-scroll-locked`, which
          is precisely the freeze preview-dialog.mobile.spec.ts exists to catch.

          Both are screen-reader labels now, and the visible structure is plain
          elements beside them.
        */}
        <DialogContent className="max-h-[100dvh] max-w-screen h-screen p-0 border-0 gap-0 flex flex-col">
          <DialogTitle className="sr-only">Resume preview</DialogTitle>
          <DialogDescription className="sr-only">
            A preview of your resume, with controls to change its appearance and download it.
          </DialogDescription>

          <div className="flex h-16 shrink-0 items-center justify-center gap-3 border-b">
            <PreviewControls
              resume={resume}
              options={options}
              mcpStatus={mcpStatus}
              mcpToolCount={mcpToolCount}
              pair={pair}
              pairLabel={pairLabel}
              onImport={onImport}
              onOpenAppearance={() => setShowAppearance(true)}
            />
          </div>

          <div className="scrollbar-overlay min-h-0 flex-1 overflow-auto">
            {showAppearance ? (
              <AppearancePanel
                resume={resume}
                options={options}
                onClose={() => setShowAppearance(false)}
              />
            ) : (
              // The sheet scales itself to the box it is given, so this only has
              // to be that box. `h-full` rather than a margin: at this width the
              // sheet is the whole point of the screen.
              <div className="h-full p-4">
                <ResumeIframeCSR>{template.render({ resume, backgroundColor })}</ResumeIframeCSR>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-4 right-4 z-50">
        <Button size="lg" type="button" onClick={() => handleChangeOpen(true)}>
          Preview & Download
        </Button>
      </div>
    </>
  );
};

export default ResumePreviewDialog;
