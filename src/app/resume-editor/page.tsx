"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import debounce from "lodash/debounce";

import { Resume } from "@/types/resume";
import ResumeForm from "./components/form/resume-form";
import ResumePreviewDialog from "./components/resume-preview-dialog";
import ResumePreview from "./components/resume-preview";
import { ModeToggle } from "./components/mode-toggle";
import { DEFAULT_RESUME } from "./constants";

const ResumeEditorPage = () => {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useLocalStorage("resume", DEFAULT_RESUME);
  const formMethods = useForm<Resume>({
    defaultValues: value,
  });
  const { control } = formMethods;
  const resume = useWatch({ control }) as Resume;

  const matches = useMediaQuery("(min-width: 1024px)");
  const { resolvedTheme } = useTheme();

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
      <nav className="border-b sticky top-0 bg-white dark:bg-inherit z-10">
        <div className="flex h-12 items-center md:px-12 px-4">
          <Link href="/">
            <h1 className="text-xl font-bold">Simple Resume</h1>
          </Link>
          <div className="ml-auto flex gap-4 items-center">
            <ModeToggle />
            <Link
              href="https://github.com/leochiu-a/simple-resume"
              target="_blank"
            >
              <Image
                src={
                  resolvedTheme === 'dark' ? "/github-mark-white.png" : "/github-mark.png"
                }
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
            <div className="lg:flex">
              <div className="lg:w-1/2 lg:mx-12 mx-4 my-8">
                <ResumeForm />
              </div>

              {matches ? (
                <ResumePreview resume={resume} />
              ) : (
                <ResumePreviewDialog resume={resume} />
              )}
            </div>
          </form>
        </FormProvider>
      </main>
    </>
  );
};

export default ResumeEditorPage;
