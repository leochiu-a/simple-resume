import { Resume } from "@/types/resume";
import ResumeIframeCSR from "./template/resume-iframe";
import ResumeTemplate from "./template/resume-template";
import DownloadPDFButton from "./template/download-pdf-button";

const ResumePreview = ({ resume }: { resume: Resume }) => {
  return (
    <div className="sticky top-[calc(48px+32px)] h-[calc(100vh-48px-32px)] w-1/2">
      <div className="m-8 mt-0">
        <div className="flex origin-top justify-center flex-col	items-center gap-4">
          <ResumeIframeCSR>
            <ResumeTemplate resume={resume} />
          </ResumeIframeCSR>

          <DownloadPDFButton resume={resume} />
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
