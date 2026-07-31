import { FaPalette } from "react-icons/fa6";
import { Sketch as SketchPicker } from "@uiw/react-color";

import { Resume } from "@/types/resume";
import { Button } from "@/components/ui/button";

import useTemplateOptions from "../hooks/useTemplateOptions";
import ResumeIframeCSR from "./template/resume-iframe";
import TemplatePicker from "./template/template-picker";
import DownloadPDFButton from "./template/download-pdf-button";
import DownloadHTMLButton from "./template/download-html-button";

const ResumePreview = ({ resume }: { resume: Resume }) => {
  const {
    template,
    selectTemplate,
    displayColorPicker,
    backgroundColor,
    toggleColorPicker,
    changeBackgroundColor,
  } = useTemplateOptions();

  return (
    <div className="sticky top-[calc(48px+32px)] h-[calc(100vh-48px-32px)] w-1/2">
      <div className="m-8 mt-0 flex h-full flex-col items-center gap-4">
        {/* The sheet stack scrolls on its own so the controls below stay put once
            a resume runs onto a second page. */}
        <div className="flex min-h-0 w-full flex-1 justify-center overflow-y-auto">
          <ResumeIframeCSR>{template.render({ resume, backgroundColor })}</ResumeIframeCSR>
        </div>

        <div className="flex flex-none gap-3">
          <TemplatePicker template={template} onSelect={selectTemplate} />

          <div className="relative">
            <Button variant="outline" type="button" onClick={toggleColorPicker}>
              <FaPalette />
            </Button>
            {displayColorPicker && (
              <div className="absolute bottom-12">
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
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
