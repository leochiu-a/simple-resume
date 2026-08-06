import { FC } from "react";

import { LANG_LABEL, RESUME_LANGS } from "@/lib/resume-doc";
import { cn } from "@/lib/utils";
import { ResumeLang } from "@/types/resume-doc";

interface LanguageSwitcherProps {
  activeLang: ResumeLang;
  primaryLang: ResumeLang;
  onSwitch: (lang: ResumeLang) => void;
}

/**
 * Which language of the resume is being edited, as tabs over the form.
 *
 * Not in the nav: the theme, the download and the on-device AI button up there
 * are tools, and this is not one — it says which document you are looking at, so
 * it belongs on the document. The dot marks the original, the one everything
 * else is translated from, because that is what the rest of the editor's
 * behaviour hangs off.
 *
 * Sticky under the nav rather than scrolling away with the form: it is a mode,
 * and a mode you cannot see is a mode you forget you are in. It sits in the form
 * column only, so the preview — a sticky sibling of its own — keeps its full
 * height.
 */
const LanguageSwitcher: FC<LanguageSwitcherProps> = ({ activeLang, primaryLang, onSwitch }) => (
  // z-9, under the nav's z-10, so this slides beneath it rather than over it.
  <div className="sticky top-14 z-[9] border-b bg-background">
    <div className="mx-4 flex items-end gap-6 lg:mx-12">
      {RESUME_LANGS.map((lang) => {
        const active = lang === activeLang;

        return (
          <button
            key={lang}
            type="button"
            onClick={() => onSwitch(lang)}
            aria-current={active ? "page" : undefined}
            className={cn(
              // -mb-px pulls the underline onto the container's rule, so the
              // active tab reads as a sheet in front of the others.
              "-mb-px flex h-11 items-center gap-1.5 border-b-2 text-sm transition-colors",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {LANG_LABEL[lang]}
            {lang === primaryLang && (
              <>
                <span aria-hidden className="size-1 rounded-full bg-current" />
                <span className="sr-only">(original)</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default LanguageSwitcher;
