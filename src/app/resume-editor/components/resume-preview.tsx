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
    <div className="sticky top-[calc(48px+32px)] h-[calc(100vh-48px-32px)] w-1/2">
      {/* The sheet and its pager scroll together if the viewport is too short for
          them, rather than being clipped. */}
      <div className="m-8 mt-0 flex h-full justify-center overflow-y-auto">
        <ResumeIframeCSR>{template.render({ resume, backgroundColor })}</ResumeIframeCSR>
      </div>
    </div>
  );
};

export default ResumePreview;
