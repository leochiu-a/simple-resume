import { useState } from "react";
import { Sketch as SketchPicker } from "@uiw/react-color";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Resume } from "@/types/resume";

import useTemplateOptions from "../hooks/useTemplateOptions";
import ResumeIframeCSR from "./template/resume-iframe";
import TemplatePicker from "./template/template-picker";
import DownloadPDFButton from "./template/download-pdf-button";
import DownloadHTMLButton from "./template/download-html-button";
import { FaPalette } from "react-icons/fa6";

const ResumePreviewDialog = ({ resume }: { resume: Resume }) => {
  const [open, setOpen] = useState(false);
  const {
    template,
    selectTemplate,
    displayColorPicker,
    backgroundColor,
    toggleColorPicker,
    changeBackgroundColor,
  } = useTemplateOptions();

  const handleChangeOpen = (open: boolean) => {
    setOpen(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleChangeOpen}>
        <DialogContent className="max-h-[calc(100dvh)] max-w-screen h-screen p-0 border-0">
          <DialogHeader>
            <DialogTitle className="flex justify-center items-center gap-3 sticky top-0 h-16 border-b z-10">
              <TemplatePicker template={template} onSelect={selectTemplate} />

              <div className="relative">
                <Button variant="outline" type="button" onClick={toggleColorPicker}>
                  <FaPalette />
                </Button>
                {displayColorPicker && (
                  <div className="absolute top-12">
                    <div className="fixed inset-0" onClick={toggleColorPicker} />
                    <SketchPicker color={backgroundColor} onChange={changeBackgroundColor} />
                  </div>
                )}
              </div>

              <DownloadHTMLButton
                resume={resume}
                backgroundColor={backgroundColor}
                template={template}
              />
              <DownloadPDFButton
                resume={resume}
                backgroundColor={backgroundColor}
                template={template}
              />
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
