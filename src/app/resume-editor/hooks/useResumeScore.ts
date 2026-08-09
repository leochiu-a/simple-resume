import { useMemo } from "react";

import { measureResume } from "@/lib/resume-score/metrics";
import { scoreResume, ScoreReport } from "@/lib/resume-score/rules";
import { Resume } from "@/types/resume";
import { ResumeLang } from "@/types/resume-doc";

/**
 * The score for the resume as it currently stands.
 *
 * Memoised on the watched `resume` object, which react-hook-form gives a new
 * identity on every keystroke — so this recomputes per character typed. That is
 * affordable and it is what the feature is: the number has to move while you fix
 * the thing it complained about, or the "+6%" is a promise the panel never
 * visibly keeps. The whole pass is string splitting over a few hundred words.
 *
 * `lang` is the *active* locale, not the primary: the rules that read text —
 * action verbs above all — have to judge the words on screen, and scoring an
 * English translation with the Chinese verb list would flag every line.
 */
export const useResumeScore = (resume: Resume, lang: ResumeLang): ScoreReport =>
  useMemo(() => scoreResume(measureResume(resume, lang), resume), [resume, lang]);
