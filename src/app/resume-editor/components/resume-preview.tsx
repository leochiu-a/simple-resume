import { FaPalette } from "react-icons/fa6";
import { Sketch as SketchPicker } from "@uiw/react-color";

import { Resume } from "@/types/resume";
import { Button } from "@/components/ui/button";

import useColorPicker from "../hooks/useColorPicker";
import ResumeIframeCSR from "./template/resume-iframe";
import ResumeTemplate from "./template/resume-template";
import DownloadPDFButton from "./template/download-pdf-button";

const ResumePreview = ({ resume }: { resume: Resume }) => {
  const {
    displayColorPicker,
    backgroundColor,
    toggleColorPicker,
    changeBackgroundColor,
  } = useColorPicker();

  return (
    <div className="sticky top-[calc(48px+32px)] h-[calc(100vh-48px-32px)] w-1/2">
      <div className="m-8 mt-0">
        <div className="flex origin-top justify-center flex-col	items-center gap-4">
          <ResumeIframeCSR>
            <ResumeTemplate resume={resume} backgroundColor={backgroundColor} />
          </ResumeIframeCSR>

          <div className="flex gap-3">
            <div className="relative">
              <Button
                variant="outline"
                type="button"
                onClick={toggleColorPicker}
              >
                <FaPalette />
              </Button>
              {displayColorPicker && (
                <div className="absolute bottom-12">
                  <div className="fixed inset-0" onClick={toggleColorPicker} />
                  <SketchPicker
                    color={backgroundColor}
                    onChange={changeBackgroundColor}
                  />
                </div>
              )}
            </div>

            <DownloadPDFButton
              resume={resume}
              backgroundColor={backgroundColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
