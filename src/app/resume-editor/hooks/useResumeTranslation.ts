"use client";

import { useCallback, useMemo, useState } from "react";

import { LangPair } from "@/lib/translator";
import { countStale, listFieldStatuses } from "@/lib/translation/status";
import { translateResume, TranslateProgress } from "@/lib/translation/translate-resume";
import { FieldPath } from "@/types/resume-doc";
import { UseResumeDocResult } from "./useResumeDoc";
import { useTranslatorCapability } from "./useTranslatorCapability";

export interface UseResumeTranslationResult {
  translator: ReturnType<typeof useTranslatorCapability>;
  pair: LangPair;
  running: boolean;
  progress: TranslateProgress | null;
  error: string | null;
  /** How many fields the primary has changed under since the last translation. */
  staleCount: number;
  /**
   * Enables the model if it is not on the device yet and then translates.
   * Must be called straight from a click: the enable path needs that activation.
   */
  run: (overwrite?: readonly FieldPath[]) => Promise<void>;
}

/**
 * Drives one translation of the primary locale into the secondary one.
 *
 * The direction is fixed — primary to secondary, never back — which is what
 * makes "corrections in the translation stay in the translation" a property of
 * the code rather than a rule someone has to remember.
 */
export const useResumeTranslation = (doc: UseResumeDocResult): UseResumeTranslationResult => {
  const { primaryLang, secondaryLang, primaryResume } = doc;

  const pair = useMemo<LangPair>(
    () => ({ source: primaryLang, target: secondaryLang }),
    [primaryLang, secondaryLang],
  );

  const translator = useTranslatorCapability(pair);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<TranslateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const secondaryResume = doc.doc.locales[secondaryLang];
  const secondaryMeta = doc.doc.translation[secondaryLang];

  const staleCount = useMemo(
    () =>
      secondaryResume
        ? countStale(listFieldStatuses(primaryResume, secondaryResume, secondaryMeta))
        : 0,
    [primaryResume, secondaryResume, secondaryMeta],
  );

  const run = useCallback(
    async (overwrite: readonly FieldPath[] = []) => {
      setError(null);
      setRunning(true);
      setProgress(null);

      try {
        const { resume, meta } = await translateResume({
          source: primaryResume,
          target: secondaryResume,
          meta: secondaryMeta,
          pair,
          overwrite,
          onProgress: setProgress,
        });

        doc.writeLocale(secondaryLang, resume, meta);
      } catch (cause) {
        setError(
          cause instanceof Error && cause.message
            ? cause.message
            : "The translation could not be finished.",
        );
      } finally {
        setRunning(false);
        setProgress(null);
      }
    },
    [doc, pair, primaryResume, secondaryLang, secondaryMeta, secondaryResume],
  );

  return { translator, pair, running, progress, error, staleCount, run };
};
