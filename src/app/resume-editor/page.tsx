"use client";

import { FormProvider, useForm } from "react-hook-form";
import ResumeForm from "./components/form/resume-form";
import ResumeIframeCSR from "./components/template/resume-iframe";
import ResumeTemplate from "./components/template/resume-template";
import dynamic from "next/dynamic";
import { Resume } from "@/types/resume";

const DownloadPDFButton = dynamic(
  () => import("./components/template/download-pdf-button"),
  {
    ssr: false,
  }
);

const ResumeEditorPage = () => {
  const formMethods = useForm<Resume>({
    defaultValues: {
      name: "My Name",
      wantedJob: "Senior job",
      email: "good@gmail.com",
      phone: "0123456789",
      city: "Taipei",
      profile:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
      socialLinks: [
        {
          name: "Github",
          url: "https://github.com",
        },
        {
          name: "Medium",
          url: "https://medium.com",
        },
        {
          name: "Threads",
          url: "https://threads.net",
        },
      ],
    },
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
