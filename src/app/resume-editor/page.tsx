"use client";

import ResumeIframeCSR from "./components/template/resume-iframe";
import ResumeTemplate from "./components/template/resume-template";
import dynamic from "next/dynamic";

const DownloadPDFButton = dynamic(
  () => import("./components/template/download-pdf-button"),
  {
    ssr: false,
  }
);

const ResumeEditorPage = () => {
  return (
    <>
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-bold">Simple Resume</h1>
          <DownloadPDFButton />
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
