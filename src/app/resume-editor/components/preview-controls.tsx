import { Sketch as SketchPicker } from "@uiw/react-color";

import { Resume } from "@/types/resume";

import type useTemplateOptions from "../hooks/useTemplateOptions";
import AppearanceMenu from "./template/appearance-menu";
import DownloadButton from "./template/download-button";

/**
 * Everything you can do to the preview without editing the resume, in two
 * controls: how it looks, and taking it away as a file.
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
    selectColor,
    toggleColorPicker,
    changeBackgroundColor,
  } = options;

  return (
    <div className="relative flex items-center gap-3">
      <AppearanceMenu
        template={template}
        color={backgroundColor}
        onSelectTemplate={selectTemplate}
        onSelectColor={selectColor}
        onOpenColorPicker={toggleColorPicker}
      />

      <DownloadButton resume={resume} backgroundColor={backgroundColor} template={template} />

      {displayColorPicker && (
        // The presets in the menu cover most cases; this is the escape hatch for
        // an exact colour, reached from "Custom colour…" rather than its own button.
        <div className="absolute right-0 top-12 z-20">
          <div className="fixed inset-0" onClick={toggleColorPicker} />
          <SketchPicker color={backgroundColor} onChange={changeBackgroundColor} />
        </div>
      )}
    </div>
  );
};

export default PreviewControls;
