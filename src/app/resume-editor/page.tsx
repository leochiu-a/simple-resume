"use client";

import { Button } from "@/components/ui/button";

const ResumeEditorPage = () => {
  return (
    <>
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-bold">Simple Resume</h1>
          <Button className="ml-auto" variant="outline">
            Download
          </Button>
        </div>
      </div>
      <main>
        <form id="resume-form">
          <div className="flex">
            <div className="w-1/2 p-12">ResumeForm</div>
            <div className="sticky top-0 mb-[-220px] h-screen w-1/2 overflow-auto [scrollbar-width:none]">
              <div className="m-8">
                <div className="flex origin-top justify-center">
                  ResumePreviewer
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
