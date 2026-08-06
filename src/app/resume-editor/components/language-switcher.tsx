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
 * Which language of the resume is being edited.
 *
 * Still the document's own control and not a tool — that has not changed — but it
 * no longer needs a bar to say so. It sits in the centre slot of the single
 * header, and being centred is what now carries the meaning the separate bar used
 * to: the tools are on the right, the identity is on the left, and the one thing
 * in the middle is what you are looking at.
 *
 * A filled segmented control rather than the old underlined tabs. Underlines want
 * a rule to sit on — that is what made them read as tabs, and the rule they sat
 * on was the second header's. Inside a bar with no rule of its own, a pill is
 * what reads as selected. The dot still marks the original, the one everything
 * else is translated from, because that is what the rest of the editor's
 * behaviour hangs off.
 */
const LanguageSwitcher: FC<LanguageSwitcherProps> = ({ activeLang, primaryLang, onSwitch }) => (
  <div
    role="tablist"
    aria-label="Resume language"
    className="flex items-center gap-0.5 rounded-md bg-muted p-0.5"
  >
    {RESUME_LANGS.map((lang) => {
      const active = lang === activeLang;

      return (
        <button
          key={lang}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onSwitch(lang)}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-[3px] px-3 text-sm transition-colors",
            active
              ? // The raised paper, not the accent: this is a selected segment,
                // not a primary action, and a filled-green pill in the middle of
                // the bar would outrank the download button beside it.
                "bg-card font-medium text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LANG_LABEL[lang]}
          {lang === primaryLang && (
            <>
              <span
                aria-hidden
                className={cn("size-1 rounded-full", active ? "bg-brand" : "bg-current")}
              />
              <span className="sr-only">(original)</span>
            </>
          )}
        </button>
      );
    })}
  </div>
);

export default LanguageSwitcher;
