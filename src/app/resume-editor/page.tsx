"use client";

import { Button } from "@/components/ui/button";
import ResumeIframeCSR from "./components/resume-iframe";
import ResumeTemplate from "./components/resume-template";

import { usePDF } from "@react-pdf/renderer";

const ResumeEditorPage = () => {
  const [instance] = usePDF({ document: <ResumeTemplate /> });

  return (
    <>
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-bold">Simple Resume</h1>
          <Button className="ml-auto" variant="outline" asChild>
            <a href={instance.url!} download>
              {instance.loading ? "Loading" : "Download"}
            </a>
          </Button>
        </div>
      </div>
      <main>
        <form id="resume-form">
          <div className="flex">
            <div className="w-1/2 p-12">ResumeForm</div>
            <div className="sticky top-0 mb-[-220px] h-screen w-1/2">
              <div className="m-8">
                <div className="flex origin-top justify-center">
                  <ResumeIframeCSR>
                    <ResumeTemplate />
                  </ResumeIframeCSR>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  );
};

export default ResumeEditorPage;
