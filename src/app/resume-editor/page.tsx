"use client";

import dynamic from "next/dynamic";
import { FormProvider, useForm } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";

import { Resume } from "@/types/resume";
import ResumeForm from "./components/form/resume-form";
import ResumeIframeCSR from "./components/template/resume-iframe";
import ResumeTemplate from "./components/template/resume-template";
import { DEFAULT_RESUME } from "./constants";

const DownloadPDFButton = dynamic(
  () => import("./components/template/download-pdf-button"),
  {
    ssr: false,
  }
);

const ResumeEditorPage = () => {
  const [value] = useLocalStorage("resume", DEFAULT_RESUME);
  const formMethods = useForm<Resume>({
    defaultValues: value,
  });
  const { handleSubmit, watch } = formMethods;

  const resume = watch();

  const submitForm = (data: Resume) => {
    console.log(data);
  };

  return (
    <>
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-bold">Simple Resume</h1>
          <DownloadPDFButton resume={resume} />
        </div>
      </div>
      <main>
        <FormProvider {...formMethods}>
          {/* "handleSubmit" will validate your inputs before invoking "onSubmit" */}
          <form id="resume-form" onSubmit={handleSubmit(submitForm)}>
            <div className="flex">
              <div className="w-1/2 p-12">
                <ResumeForm />
              </div>
              <div className="sticky top-0 mb-[-220px] h-screen w-1/2">
                <div className="m-8">
                  <div className="flex origin-top justify-center">
                    <ResumeIframeCSR>
                      <ResumeTemplate resume={resume} />
                    </ResumeIframeCSR>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </FormProvider>
      </main>
    </>
  );
};

export default ResumeEditorPage;
