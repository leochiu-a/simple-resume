"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";
import debounce from "lodash/debounce";

import {
  buildInitialDoc,
  createEmptyResume,
  DOC_STORAGE_KEY,
  otherLang,
  RESUME_LANGS,
} from "@/lib/resume-doc";
import { seedProvenance } from "@/lib/translation/status";
import { Resume } from "@/types/resume";
import { ResumeDoc, ResumeLang, TranslationMeta } from "@/types/resume-doc";
import { DEFAULT_RESUME } from "../constants";

export interface UseResumeDocResult {
  doc: ResumeDoc;
  activeLang: ResumeLang;
  primaryLang: ResumeLang;
  secondaryLang: ResumeLang;
  /** True when the active locale has a resume; false while it is still an empty slot. */
  hasActiveLocale: boolean;
  /** The languages the document is actually written in — one until a second is added. */
  presentLangs: readonly ResumeLang[];
  /** The primary locale, which is the only thing a translation is ever made from. */
  primaryResume: Resume;
  activeMeta: TranslationMeta | undefined;
  switchLang: (lang: ResumeLang) => void;
  setPrimaryLang: (lang: ResumeLang) => void;
  /** Debounced; always writes to the locale that was active when it was called. */
  saveActiveLocale: (resume: Resume) => void;
  /** Used by the translation run to create or replace a whole locale at once. */
  writeLocale: (lang: ResumeLang, resume: Resume, meta: TranslationMeta) => void;
  /** Replaces the active locale with an imported resume, clearing its provenance. */
  importIntoActiveLocale: (resume: Resume) => void;
  /** Drops a secondary locale and returns to the original. Never touches the primary. */
  removeLocale: (lang: ResumeLang) => void;
  /** Relabels a single-language document. Refused once a second language exists. */
  setSoleLang: (lang: ResumeLang) => void;
}

/**
 * Owns the multi-language document and keeps the form in step with it.
 *
 * The one invariant worth stating out loud: a write only ever lands in the
 * locale that was active when it was requested. `saveActiveLocale` captures the
 * language at call time and the pending write is flushed before any switch, so
 * text typed in English cannot end up in the Chinese locale — and, since the
 * translated locale is never the primary, corrections made there never reach the
 * source of truth.
 */
export const useResumeDoc = (formMethods: UseFormReturn<Resume>): UseResumeDocResult => {
  const [doc, setDoc] = useLocalStorage<ResumeDoc>(
    DOC_STORAGE_KEY,
    buildInitialDoc(DEFAULT_RESUME),
  );

  const { activeLang, primaryLang } = doc;
  const secondaryLang = otherLang(primaryLang);

  // Which languages exist, not what order to show them in — the switcher orders
  // its tabs by role, so the original leads whichever language that turns out to be.
  const presentLangs = useMemo(
    () => RESUME_LANGS.filter((lang) => !!doc.locales[lang]),
    [doc.locales],
  );

  // The form is read through a ref for the same reason useResumeMcp does it: the
  // callbacks below must not be rebuilt on every keystroke.
  const formRef = useRef(formMethods);
  useEffect(() => {
    formRef.current = formMethods;
  }, [formMethods]);

  const activeLangRef = useRef(activeLang);
  useEffect(() => {
    activeLangRef.current = activeLang;
  }, [activeLang]);

  // Read by the callbacks below so they can look at the current document without
  // reaching for it inside a state updater — those run twice under StrictMode,
  // and resetting a form twice is not free.
  const docRef = useRef(doc);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  // The form is created before this hook can tell it what is in storage, so the
  // stored locale is pushed in once on mount. It runs before the page's own save
  // effect — hooks fire in declaration order — so the defaults it replaces are
  // never written back over the document.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const stored = doc.locales[doc.activeLang];
    if (stored) formRef.current.reset(stored);
    // Mount only: later changes go through switchLang and writeLocale.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const write = useMemo(
    () =>
      debounce((lang: ResumeLang, resume: Resume) => {
        setDoc((prev) => {
          // The slot is empty until a translation fills it. Anything the form
          // emits in the meantime is the reset value, not the user's work.
          if (!prev.locales[lang]) return prev;

          return { ...prev, locales: { ...prev.locales, [lang]: resume } };
        });
      }, 300),
    [setDoc],
  );

  const saveActiveLocale = useCallback(
    (resume: Resume) => write(activeLangRef.current, resume),
    [write],
  );

  const switchLang = useCallback(
    (lang: ResumeLang) => {
      if (lang === activeLangRef.current) return;

      // Commit whatever is still in the debounce window *before* the language
      // changes, or the last 300ms of typing is written to the wrong locale.
      write.flush();

      formRef.current.reset(docRef.current.locales[lang] ?? createEmptyResume());
      setDoc((prev) => ({ ...prev, activeLang: lang }));
    },
    [setDoc, write],
  );

  const setPrimaryLang = useCallback(
    (lang: ResumeLang) => {
      write.flush();

      setDoc((prev) => {
        const demoted = otherLang(lang);
        const promotedResume = prev.locales[lang];
        const demotedResume = prev.locales[demoted];

        return {
          ...prev,
          primaryLang: lang,
          translation: {
            // The promoted locale is the source of truth now, so the bookkeeping
            // that described it as a translation no longer applies.
            [lang]: undefined,
            // The demoted one is recorded as an up-to-date translation of it.
            // Leaving it blank would mark every field stale and invite an
            // "update" that translates the original back over itself.
            [demoted]:
              promotedResume && demotedResume
                ? seedProvenance(promotedResume, demotedResume)
                : prev.translation[demoted],
          },
        };
      });
    },
    [setDoc, write],
  );

  /**
   * Replaces the active locale wholesale, as an import does.
   *
   * Distinct from `writeLocale`, which exists for the translation run and always
   * writes provenance with the text. An imported resume has no translation
   * history: it came from a share link, which carries one language and no record
   * of what it was translated from. Writing `undefined` there is the point —
   * leaving a previous locale's provenance in place would describe the new text as
   * a translation of something it has never seen, and mark every field stale.
   *
   * The pending debounce is flushed first for the same reason `switchLang` does it:
   * the last keystrokes before an import must not land on top of the imported
   * resume afterwards.
   */
  const importIntoActiveLocale = useCallback(
    (resume: Resume) => {
      write.flush();

      const lang = activeLangRef.current;
      formRef.current.reset(resume);
      setDoc((prev) => ({
        ...prev,
        locales: { ...prev.locales, [lang]: resume },
        translation: { ...prev.translation, [lang]: undefined },
      }));
    },
    [setDoc, write],
  );

  const writeLocale = useCallback(
    (lang: ResumeLang, resume: Resume, meta: TranslationMeta) => {
      write.flush();

      if (activeLangRef.current === lang) formRef.current.reset(resume);
      setDoc((prev) => ({
        ...prev,
        locales: { ...prev.locales, [lang]: resume },
        translation: { ...prev.translation, [lang]: meta },
      }));
    },
    [setDoc, write],
  );

  /**
   * Removes a secondary locale, leaving a single-language document.
   *
   * The counterpart to adding one: the second language is something you opt into,
   * and an option you cannot take back is not an option. The primary is refused
   * outright — it is the source of truth, and deleting it would leave every
   * remaining locale a translation of nothing.
   *
   * Also the way out of a slot that was opened and never filled, which is why it
   * does not require the locale to exist: deleting nothing and returning to the
   * original is exactly what "never mind" means there.
   */
  const removeLocale = useCallback(
    (lang: ResumeLang) => {
      // The pending write would otherwise land in the locale being deleted and,
      // worse, recreate it — `write` only skips slots that are empty *now*.
      write.flush();

      const { primaryLang: primary, locales } = docRef.current;
      if (lang === primary) return;

      formRef.current.reset(locales[primary] ?? createEmptyResume());
      setDoc((prev) => {
        const { [lang]: _removed, ...remaining } = prev.locales;
        const { [lang]: _meta, ...remainingMeta } = prev.translation;

        return {
          ...prev,
          activeLang: prev.primaryLang,
          locales: remaining,
          translation: remainingMeta,
        };
      });
    },
    [setDoc, write],
  );

  /**
   * Says what language the one locale is written in, when there is only one.
   *
   * Something has to name the language of a document nobody has told us about,
   * and until now that was a constant: `createResumeDoc` labels the starting
   * resume `zh-Hant`. `buildInitialDoc` already refuses to guess for a migrated
   * one, on the grounds that guessing wrong makes the primary a translation —
   * but a default is a guess with the same consequence, and the shipped sample
   * resume is in English, so it was wrong the moment it was read.
   *
   * A move, not a copy: there is one resume and this changes what it is called.
   * That is why it is refused once a second locale exists — with two, changing
   * which is which is `setPrimaryLang`, and that has provenance to reseed.
   */
  const setSoleLang = useCallback(
    (lang: ResumeLang) => {
      write.flush();

      setDoc((prev) => {
        const [only, ...rest] = RESUME_LANGS.filter((candidate) => !!prev.locales[candidate]);
        if (rest.length || !only || only === lang) return prev;

        return {
          ...prev,
          primaryLang: lang,
          activeLang: lang,
          locales: { [lang]: prev.locales[only] },
          // Nothing to carry: a document with one language has no translation to
          // describe, so there is no provenance to move with it.
          translation: {},
        };
      });
    },
    [setDoc, write],
  );

  useEffect(() => () => write.flush(), [write]);

  return {
    doc,
    activeLang,
    primaryLang,
    secondaryLang,
    hasActiveLocale: !!doc.locales[activeLang],
    presentLangs,
    primaryResume: doc.locales[primaryLang] ?? DEFAULT_RESUME,
    activeMeta: doc.translation[activeLang],
    switchLang,
    setPrimaryLang,
    saveActiveLocale,
    writeLocale,
    importIntoActiveLocale,
    removeLocale,
    setSoleLang,
  };
};
