import { useMemo } from "react";

import { measureResume } from "@/lib/resume-score/metrics";
import { scoreResume, ScoreReport } from "@/lib/resume-score/rules";
import { Resume } from "@/types/resume";

/**
 * The score for the resume as it currently stands.
 *
 * Memoised on the watched `resume` object, which react-hook-form gives a new
 * identity on every keystroke — so this recomputes per character typed. That is
 * affordable and it is what the feature is: the number has to move while you fix
 * the thing it complained about, or the "+6%" is a promise the panel never
 * visibly keeps. The whole pass is string splitting over a few hundred words.
 *
 * No locale is passed in. The rules that read text — action verbs above all —
 * judge each line by the script it is written in, so an English resume typed
 * into the zh-Hant slot is measured against the English list, as is a single
 * English bullet in an otherwise Chinese resume. See `classifyOpener`.
 */
export const useResumeScore = (resume: Resume): ScoreReport =>
  useMemo(() => scoreResume(measureResume(resume), resume), [resume]);
