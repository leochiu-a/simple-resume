import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Resume } from "@/types/resume";

import type useTemplateOptions from "../hooks/useTemplateOptions";
import ResumeIframeCSR from "./template/resume-iframe";
import PreviewControls from "./preview-controls";

/**
 * The mobile preview. The nav has no room for the controls at this width, so they
 * ride in the dialog's own header instead.
 */
const ResumePreviewDialog = ({
  resume,
  options,
}: {
  resume: Resume;
  options: ReturnType<typeof useTemplateOptions>;
}) => {
  const [open, setOpen] = useState(false);
  const { template, backgroundColor } = options;

  const handleChangeOpen = (open: boolean) => {
    setOpen(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleChangeOpen}>
        <DialogContent className="max-h-[calc(100dvh)] max-w-screen h-screen p-0 border-0">
          <DialogHeader>
            <DialogTitle className="flex justify-center items-center gap-3 sticky top-0 h-16 border-b z-10">
              <PreviewControls resume={resume} options={options} />
            </DialogTitle>
            <DialogDescription className="overflow-auto h-[calc(100dvh-64px)]">
              <div className="m-4 flex justify-center">
                <ResumeIframeCSR>{template.render({ resume, backgroundColor })}</ResumeIframeCSR>
              </div>
            </DialogDescription>
          </DialogHeader>
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
