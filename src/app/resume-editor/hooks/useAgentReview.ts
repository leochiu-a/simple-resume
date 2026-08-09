"use client";

import { useCallback, useState } from "react";

import { AgentReview } from "@/lib/resume-score/review";

export interface UseAgentReviewResult {
  review: AgentReview | null;
  /** Called by the `submit-review` tool. Replaces whatever was there. */
  submit: (review: AgentReview) => void;
  clear: () => void;
}

/**
 * Holds the review an agent last submitted.
 *
 * Deliberately **not** persisted to local storage, unlike the resume itself. A
 * review is a comment on one version of the document, and the document changes
 * every keystroke — restoring last week's review next to today's text would
 * present stale judgements as current ones. It lives for the session, and the
 * panel says when it arrived so a reader can weigh it.
 */
export const useAgentReview = (): UseAgentReviewResult => {
  const [review, setReview] = useState<AgentReview | null>(null);

  const submit = useCallback((next: AgentReview) => setReview(next), []);
  const clear = useCallback(() => setReview(null), []);

  return { review, submit, clear };
};
