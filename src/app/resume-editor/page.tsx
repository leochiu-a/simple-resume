"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";

import { Resume } from "@/types/resume";
import ResumeForm from "./components/form/resume-form";
import ResumeIframeCSR from "./components/template/resume-iframe";
import ResumeTemplate from "./components/template/resume-template";
import { DEFAULT_RESUME } from "./constants";
import Image from "next/image";

const DownloadPDFButton = dynamic(
  () => import("./components/template/download-pdf-button"),
  {
    ssr: false,
  }
);

const ResumeEditorPage = () => {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useLocalStorage("resume", DEFAULT_RESUME);
  const formMethods = useForm<Resume>({
    defaultValues: value,
  });
  const { control } = formMethods;
  const resume = useWatch({ control }) as Resume;

  useEffect(() => {
    setValue(resume);
  }, [resume, setValue]);

  // prevent hydration error caused by getting value from local storage on server side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className="border-b">
        <div className="flex h-16 items-center px-12">
          <Link href="/">
            <h1 className="text-xl font-bold">Simple Resume</h1>
          </Link>
          <div className="ml-auto flex gap-4 items-center">
            <DownloadPDFButton resume={resume} />
            <Link href="https://github.com/leochiu-a/simple-resume" target="_blank">
              <Image
                src="/github-mark.png"
                alt="github-mark"
                width={36}
                height={36}
              />
            </Link>
          </div>
        </div>
      </div>
      <main>
        <FormProvider {...formMethods}>
          {/* "handleSubmit" will validate your inputs before invoking "onSubmit" */}
          <form id="resume-form">
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
