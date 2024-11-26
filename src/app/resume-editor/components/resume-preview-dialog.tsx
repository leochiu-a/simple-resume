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
import ResumeIframeCSR from "./template/resume-iframe";
import ResumeTemplate from "./template/resume-template";
import DownloadPDFButton from "./template/download-pdf-button";

const ResumePreviewDialog = ({ resume }: { resume: Resume }) => {
  const [open, setOpen] = useState(false);

  const handleChangeOpen = (open: boolean) => {
    setOpen(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleChangeOpen}>
        <DialogContent className="max-h-[calc(100dvh)] max-w-screen h-screen p-0 border-0">
          <DialogHeader>
            <DialogTitle className="grid place-items-center sticky top-0 h-16">
              <DownloadPDFButton resume={resume} />
            </DialogTitle>
            <DialogDescription className="overflow-auto h-[calc(100dvh-64px)]">
              <div className="m-4 flex justify-center">
                <ResumeIframeCSR>
                  <ResumeTemplate resume={resume} />
                </ResumeIframeCSR>
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
