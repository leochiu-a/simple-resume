import { FC } from "react";
import { ChevronDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANG_LABEL, LANG_NAME_EN, otherLang, RESUME_LANGS } from "@/lib/resume-doc";
import { cn } from "@/lib/utils";
import { ResumeLang } from "@/types/resume-doc";

interface LanguageSwitcherProps {
  activeLang: ResumeLang;
  primaryLang: ResumeLang;
  /** The languages the document actually has. One of them, usually. */
  presentLangs: readonly ResumeLang[];
  onSwitch: (lang: ResumeLang) => void;
  /** Relabels the document when it has only one language — see `setSoleLang`. */
  onSetSoleLang: (lang: ResumeLang) => void;
}

/**
 * What the one language of a single-language document is, when there is nothing
 * to switch between.
 *
 * A tablist with one tab is not a control, and the tab it renders is a statement
 * the user has never been asked to agree with: the document is labelled 中文
 * because a constant said so, and the resume it ships with is in English. So the
 * lone chip is the place to correct it — the language is the only thing it can
 * be about, which is what makes a menu of exactly the two languages read as an
 * answer rather than a navigation.
 *
 * It disappears the moment a second language exists. With two, saying which is
 * which is `setPrimaryLang` — a different question, with provenance behind it,
 * asked from the translation panel where the consequences are on screen.
 */
const SoleLanguage: FC<{ lang: ResumeLang; onChange: (lang: ResumeLang) => void }> = ({
  lang,
  onChange,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        aria-label={`Written in ${LANG_NAME_EN[lang]}`}
        className="flex h-9 items-center gap-1.5 rounded-md bg-muted px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
      >
        {LANG_LABEL[lang]}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="center" className="w-48">
      <DropdownMenuLabel>Written in</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={lang} onValueChange={(value) => onChange(value as ResumeLang)}>
        {RESUME_LANGS.map((candidate) => (
          <DropdownMenuRadioItem key={candidate} value={candidate}>
            {LANG_LABEL[candidate]}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

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
 *
 * A language the document does not have gets a dashed `＋` slot instead of a
 * segment. Both were solid before, which said the second version exists and is
 * merely elsewhere — so the majority who write one language read a half-empty
 * control, clicked the other half, and landed in an empty document. Dashed, it
 * reads as what it is: an offer. The border is the whole message, so the slot is
 * outside the tablist rather than a third tab; adding a language is an action,
 * not one of the views this control switches between.
 */
const LanguageSwitcher: FC<LanguageSwitcherProps> = ({
  activeLang,
  primaryLang,
  presentLangs,
  onSwitch,
  onSetSoleLang,
}) => (
  <div className="flex items-center gap-1.5">
    {/* Not while an empty second slot is open: the tabs are what gets back out
        of it, and there are two of them to render then. */}
    {presentLangs.length === 1 && presentLangs[0] === activeLang ? (
      <SoleLanguage lang={activeLang} onChange={onSetSoleLang} />
    ) : (
      <div
        role="tablist"
        aria-label="Resume language"
        className="flex items-center gap-0.5 rounded-md bg-muted p-0.5"
      >
        {/*
          The original leads and the translation follows it.

          Not `RESUME_LANGS` order, which is a constant: with English as the
          original that put the source of truth on the right, behind the language
          made from it, and the dot was the only thing saying otherwise. Ordering
          by role is just as stable — `primaryLang` is stored — and it is the
          order the two languages are actually in.
        */}
        {[primaryLang, otherLang(primaryLang)]
          .filter(
            // The active language belongs here even before it has any content: the
            // empty slot is on screen, and it needs a lit segment to get back from.
            (lang) => presentLangs.includes(lang) || lang === activeLang,
          )
          .map((lang) => {
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
    )}

    {RESUME_LANGS.filter((lang) => !presentLangs.includes(lang) && lang !== activeLang).map(
      (lang) => (
        <button
          key={lang}
          type="button"
          // The visible label is the language alone, which beside a tab of the
          // same name says nothing about what pressing it does.
          aria-label={`Add ${LANG_NAME_EN[lang]} version`}
          onClick={() => onSwitch(lang)}
          className="flex h-9 items-center gap-1 whitespace-nowrap rounded-md border border-dashed px-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <Plus className="size-3.5" />
          {LANG_LABEL[lang]}
        </button>
      ),
    )}
  </div>
);

export default LanguageSwitcher;
