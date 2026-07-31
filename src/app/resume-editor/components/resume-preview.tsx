import { Resume } from "@/types/resume";

import type useTemplateOptions from "../hooks/useTemplateOptions";
import ResumeIframeCSR from "./template/resume-iframe";

/**
 * The desktop preview: the sheet and its page pager, nothing else. The controls
 * that drive it live in the nav — see `preview-controls.tsx`.
 */
const ResumePreview = ({
  resume,
  options,
}: {
  resume: Resume;
  options: ReturnType<typeof useTemplateOptions>;
}) => {
  const { template, backgroundColor } = options;

  return (
    // A wash one step off the paper, so the sheet reads as a sheet lying on a desk
    // rather than as white on white.
    <div className="sticky top-[calc(56px+32px)] h-[calc(100vh-56px-32px)] w-1/2 border-l bg-muted/40">
      {/* The sheet and its pager scroll together if the viewport is too short for
          them, rather than being clipped. */}
      {/* px-6 is CROP_MARK_GUTTER: this box scrolls, so it clips, and the marks
          live outside the sheet. */}
      <div className="m-8 mt-0 flex h-full justify-center overflow-y-auto px-6 pt-8">
        <ResumeIframeCSR>{template.render({ resume, backgroundColor })}</ResumeIframeCSR>
      </div>
    </div>
  );
};

export default ResumePreview;
