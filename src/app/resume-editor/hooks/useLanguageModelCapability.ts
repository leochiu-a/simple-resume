"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  ensureLanguageModel,
  getLanguageModelStatus,
  getServerLanguageModelStatus,
  LanguageModelStatus,
  probeLanguageModel,
  subscribeLanguageModel,
} from "@/lib/language-model";

export interface UseLanguageModelCapabilityResult extends LanguageModelStatus {
  /**
   * Starts the download. Call it straight from a click handler and do not await
   * anything first — this is the user activation the API asks for.
   */
  enable: () => Promise<LanguageModel>;
}

/**
 * Binds on-device rewriting status into React.
 *
 * Every trigger in the form sees the same value, because the state lives in a
 * module store rather than a provider — see `lib/language-model`. Unlike the
 * translator's hook there is no pair to pass: one model serves every section,
 * so the probe is unconditional and costs a single `availability()` per page.
 */
export const useLanguageModelCapability = (): UseLanguageModelCapabilityResult => {
  const status = useSyncExternalStore(
    subscribeLanguageModel,
    getLanguageModelStatus,
    getServerLanguageModelStatus,
  );

  useEffect(() => {
    void probeLanguageModel();
  }, []);

  return { ...status, enable: ensureLanguageModel };
};
