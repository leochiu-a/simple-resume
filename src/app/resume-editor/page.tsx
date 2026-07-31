"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import debounce from "lodash/debounce";

import { Resume } from "@/types/resume";
import { Separator } from "@/components/ui/separator";
import ResumeForm from "./components/form/resume-form";
import ResumePreviewDialog from "./components/resume-preview-dialog";
import ResumePreview from "./components/resume-preview";
import PreviewControls from "./components/preview-controls";
import { ModeToggle } from "./components/mode-toggle";
import WebMcpStatusBadge from "./components/webmcp-status";
import { useResumeMcp } from "./hooks/useResumeMcp";
import useTemplateOptions from "./hooks/useTemplateOptions";
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
  const { status: mcpStatus, toolCount: mcpToolCount } = useResumeMcp(formMethods);
  // Held here rather than in the preview: on desktop the controls that drive it
  // sit in the nav, which is outside the preview entirely.
  const templateOptions = useTemplateOptions();

  const saveResume = useMemo(
    () =>
      debounce((resume: Resume) => {
        setValue(resume);
      }, 300),
    [setValue],
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
      {/* Same bar as the landing page's, with the tools added: wordmark in the
          display face, a hairline underneath, nothing with a fill of its own.

          Solid paper, and no `backdrop-blur`: a backdrop-filter would make this a
          containing block for fixed positioning, and the colour picker's
          full-screen click-catcher is a `fixed inset-0` inside this nav. Blurring
          here shrinks that overlay to the height of the bar, and the picker stops
          closing when you click the page. */}
      <nav className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-14 items-center gap-4 px-4 md:px-12">
          <Link href="/" className="font-display text-xl font-semibold tracking-[-0.02em]">
            <h1>Simple Resume</h1>
          </Link>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground lg:inline">
            Saved in this browser
          </span>

          <div className="ml-auto flex items-center gap-3">
            {/* Only on desktop: at mobile widths the nav has no room, so these
                ride in the preview dialog's header instead. */}
            {matches && (
              <>
                <PreviewControls resume={resume} options={templateOptions} />
                <Separator orientation="vertical" className="h-6" />
              </>
            )}

            <WebMcpStatusBadge status={mcpStatus} toolCount={mcpToolCount} />
            <ModeToggle />
            <Link
              href="https://github.com/leochiu-a/simple-resume"
              target="_blank"
              aria-label="Source on GitHub"
              className="flex size-9 items-center justify-center border transition-colors hover:border-foreground/40"
            >
              <Image
                src={resolvedTheme === "dark" ? "/github-mark-white.png" : "/github-mark.png"}
                alt="github-mark"
                width={16}
                height={16}
              />
            </Link>
          </div>
        </div>
      </nav>
      <main>
        <FormProvider {...formMethods}>
          {/*
            Nothing here is ever submitted: the form element groups the fields and
            gives react-hook-form something to own, and every change is saved to
            local storage as you type. There is no action, no method and no handler,
            so the guard costs nothing and closes off the one thing this form could
            otherwise do — navigate.

            It is worth closing off. A button inside a form with no `type` is a
            submit button, and eleven of the icon buttons in here had none. A real
            click does not reach the default action (react-hook-form has already
            re-rendered the button out from under it), but a programmatic one does,
            and it serialises every field into the query string — name, phone,
            profile — where it reaches the server in the request line and stays in
            history. For an app whose promise is that the resume stays in the
            browser, that is the one navigation that must not be possible. The
            buttons carry `type="button"` now as well; this is the backstop.
          */}
          <form id="resume-form" onSubmit={(event) => event.preventDefault()}>
            <div className="lg:flex">
              <div className="mx-4 my-10 lg:mx-12 lg:w-1/2">
                <ResumeForm />
              </div>

              {matches ? (
                <ResumePreview resume={resume} options={templateOptions} />
              ) : (
                <ResumePreviewDialog resume={resume} options={templateOptions} />
              )}
            </div>
          </form>
        </FormProvider>
      </main>
    </>
  );
};

export default ResumeEditorPage;
