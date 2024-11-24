"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";
import debounce from "lodash/debounce";

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
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useLocalStorage("resume", DEFAULT_RESUME);
  const formMethods = useForm<Resume>({
    defaultValues: value,
  });
  const { control } = formMethods;
  const resume = useWatch({ control }) as Resume;

  const saveResume = useMemo(
    () =>
      debounce((resume: Resume) => {
        setValue(resume);
      }, 300),
    [setValue]
  );

  useEffect(() => {
    saveResume(resume);
  }, [resume, saveResume]);

  // prevent hydration error caused by getting value from local storage on server side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <nav className="border-b sticky top-0 bg-white">
        <div className="flex h-12 items-center px-12">
          <Link href="/">
            <h1 className="text-xl font-bold">Simple Resume</h1>
          </Link>
          <div className="ml-auto flex gap-4 items-center">
            <Link
              href="https://github.com/leochiu-a/simple-resume"
              target="_blank"
            >
              <Image
                src="/github-mark.png"
                alt="github-mark"
                width={36}
                height={36}
              />
            </Link>
          </div>
        </div>
      </nav>
      <main>
        <FormProvider {...formMethods}>
          {/* "handleSubmit" will validate your inputs before invoking "onSubmit" */}
          <form id="resume-form">
            <div className="flex">
              <div className="w-1/2 mx-12 my-8">
                <ResumeForm />
              </div>
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
            </div>
          </form>
        </FormProvider>
      </main>
    </>
  );
};

export default ResumeEditorPage;
