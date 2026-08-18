"use client";

import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useMediaQuery } from "usehooks-ts";

import { LANG_NAME_EN } from "@/lib/resume-doc";
import { cn } from "@/lib/utils";
import { Resume } from "@/types/resume";
import ResumeForm from "./components/form/resume-form";
import ResumePreviewDialog from "./components/resume-preview-dialog";
import ResumePreview from "./components/resume-preview";
import EditorHeader from "./components/editor-header";
import ImportLinkDialog from "./components/import-link-dialog";
import TranslationPanel from "./components/translation-panel";
import AppearancePanel from "./components/template/appearance-panel";
import { useResumeMcp } from "./hooks/useResumeMcp";
import { useResumeDoc } from "./hooks/useResumeDoc";
import { useResumeTranslation } from "./hooks/useResumeTranslation";
import { useResumeScore } from "./hooks/useResumeScore";
import { useAgentReview } from "./hooks/useAgentReview";
import useTemplateOptions from "./hooks/useTemplateOptions";
import { DEFAULT_RESUME } from "./constants";

const ResumeEditorPage = () => {
  const [mounted, setMounted] = useState(false);
  const formMethods = useForm<Resume>({
    defaultValues: DEFAULT_RESUME,
  });
  const { control } = formMethods;
  const resume = useWatch({ control }) as Resume;

  const doc = useResumeDoc(formMethods);
  const translation = useResumeTranslation(doc);
  const viewingTranslation = doc.activeLang !== doc.primaryLang;

  const matches = useMediaQuery("(min-width: 1024px)");
  /* Holds whatever an agent last submitted through `submit-review`. Declared
     before the tools are registered, because one of them writes to it. */
  const agentReview = useAgentReview();
  // `doc` carries the language context the tools need: which locale the form is
  // bound to, which one is the source of truth, and whether the active one exists.
  const { status: mcpStatus, toolCount: mcpToolCount } = useResumeMcp(
    formMethods,
    doc,
    agentReview.submit,
  );
  // Held here rather than in the preview because two places drive it: the
  // appearance panel floating over the desktop preview, and the mobile dialog's
  // header. Both have to move the same sheet.
  const templateOptions = useTemplateOptions();
  // The rules read the words on screen: each line is judged by the script it is
  // written in, so no locale is passed. See `classifyOpener`.
  const score = useResumeScore(resume);
  /* Which of the two things the editing column is showing. A mode rather than a
     route: the form is never unmounted, so nothing it holds is lost while the
     appearance panel is up. */
  const [showAppearance, setShowAppearance] = useState(false);
  /* Owned here rather than in the header, because importing writes to the document
     and the header has no business holding that. */
  const [showImport, setShowImport] = useState(false);

  const pairLabel = useMemo(
    () => `${LANG_NAME_EN[doc.primaryLang]} → ${LANG_NAME_EN[doc.secondaryLang]}`,
    [doc.primaryLang, doc.secondaryLang],
  );

  const { saveActiveLocale } = doc;
  useEffect(() => {
    saveActiveLocale(resume);
  }, [resume, saveActiveLocale]);

  // prevent hydration error caused by getting value from local storage on server side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    /*
      The editor is a fixed-height column, not a scrolling page.

      This is what separates the two scrollbars. Before, the page scrolled and the
      preview was `sticky` — so dragging anywhere moved the form and the preview
      just held its position, which is why they felt joined. Pinning the shell to
      the viewport and letting each column own an `overflow-y-auto` region gives
      them one scrollbar each, genuinely independent.

      `h-dvh` rather than `h-screen`: on mobile browsers `100vh` is the *largest*
      viewport, so the bottom of the page sits behind the address bar until it
      retracts. dvh tracks the visible height instead.
    */
    <div data-editor-shell className="flex h-dvh flex-col overflow-hidden">
      <EditorHeader
        resume={resume}
        options={templateOptions}
        activeLang={doc.activeLang}
        primaryLang={doc.primaryLang}
        onSwitchLang={doc.switchLang}
        mcpStatus={mcpStatus}
        mcpToolCount={mcpToolCount}
        pair={translation.pair}
        pairLabel={pairLabel}
        score={score}
        review={agentReview.review}
        onClearReview={agentReview.clear}
        onImport={() => setShowImport(true)}
        showTools={matches}
      />

      <ImportLinkDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImport={doc.importIntoActiveLocale}
      />
      <main className="min-h-0 flex-1">
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
          <form id="resume-form" onSubmit={(event) => event.preventDefault()} className="h-full">
            <div className="flex h-full">
              {/* The form column scrolls on its own. `min-w-0` because a flex item
                  defaults to min-content width, and the form's long inputs would
                  otherwise push this wider than half the shell. */}
              <div
                data-editor-column
                className="scrollbar-overlay min-w-0 flex-1 overflow-y-auto lg:w-1/2 lg:flex-none"
              >
                {showAppearance && (
                  <AppearancePanel
                    resume={resume}
                    options={templateOptions}
                    onClose={() => setShowAppearance(false)}
                  />
                )}

                {/* Hidden rather than unmounted while the appearance panel is up.
                    These are live react-hook-form fields: unmounting them would
                    drop focus, scroll position and any in-progress edit, and
                    `hidden` costs nothing to keep around. */}
                <div className={cn("mx-4 my-10 lg:mx-12", showAppearance && "hidden")}>
                  {viewingTranslation && (
                    <TranslationPanel
                      primaryLang={doc.primaryLang}
                      secondaryLang={doc.secondaryLang}
                      hasLocale={doc.hasActiveLocale}
                      translation={translation}
                      onMakePrimary={() => doc.setPrimaryLang(doc.activeLang)}
                    />
                  )}

                  {/* Until the translation exists there is nothing to edit, and
                      the panel above is the whole screen. */}
                  {/* The form needs the template to say which of its sections the
                      sheet lays out in a sidebar, where reordering has no effect. */}
                  {doc.hasActiveLocale && <ResumeForm template={templateOptions.template} />}
                </div>
              </div>

              {matches ? (
                <ResumePreview
                  resume={resume}
                  options={templateOptions}
                  onOpenAppearance={() => setShowAppearance(true)}
                />
              ) : (
                <ResumePreviewDialog
                  resume={resume}
                  options={templateOptions}
                  mcpStatus={mcpStatus}
                  mcpToolCount={mcpToolCount}
                  pair={translation.pair}
                  pairLabel={pairLabel}
                  onImport={() => setShowImport(true)}
                />
              )}
            </div>
          </form>
        </FormProvider>
      </main>
    </div>
  );
};

export default ResumeEditorPage;
