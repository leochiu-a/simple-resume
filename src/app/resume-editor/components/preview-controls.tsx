import { FaPalette } from "react-icons/fa6";
import { Sketch as SketchPicker } from "@uiw/react-color";

import { Resume } from "@/types/resume";
import { Button } from "@/components/ui/button";

import type useTemplateOptions from "../hooks/useTemplateOptions";
import TemplatePicker from "./template/template-picker";
import DownloadPDFButton from "./template/download-pdf-button";
import DownloadHTMLButton from "./template/download-html-button";

/**
 * Everything you can do to the preview without editing the resume: pick a
 * template, tint it, take it away as a file.
 *
 * It lives in the nav on desktop and in the dialog header on mobile, which is why
 * it takes its state rather than owning it — both places have to drive the same
 * preview.
 */
const PreviewControls = ({
  resume,
  options,
}: {
  resume: Resume;
  options: ReturnType<typeof useTemplateOptions>;
}) => {
  const {
    template,
    selectTemplate,
    displayColorPicker,
    backgroundColor,
    toggleColorPicker,
    changeBackgroundColor,
  } = options;

  return (
    <div className="flex items-center gap-3">
      <TemplatePicker template={template} onSelect={selectTemplate} />

      <div className="relative">
        <Button variant="outline" type="button" onClick={toggleColorPicker}>
          <FaPalette />
        </Button>
        {displayColorPicker && (
          // Opens downwards: the button sits at the top of the page, not the bottom.
          <div className="absolute top-12 z-20">
            <div className="fixed inset-0" onClick={toggleColorPicker} />
            <SketchPicker color={backgroundColor} onChange={changeBackgroundColor} />
          </div>
        )}
      </div>

      <DownloadHTMLButton resume={resume} backgroundColor={backgroundColor} template={template} />
      <DownloadPDFButton resume={resume} backgroundColor={backgroundColor} template={template} />
    </div>
  );
};

export default PreviewControls;
