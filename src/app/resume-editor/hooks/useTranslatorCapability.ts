"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { trackCapability } from "@/lib/analytics";
import {
  ensureTranslator,
  getServerTranslatorStatus,
  getTranslatorStatus,
  LangPair,
  pairKey,
  probeAvailability,
  subscribeTranslators,
  TranslatorStatus,
} from "@/lib/translator";

export interface UseTranslatorCapabilityResult extends TranslatorStatus {
  /**
   * Starts the download. Call it straight from a click handler and do not await
   * anything first — this is the user activation the API asks for.
   */
  enable: () => Promise<TranslatorInstance>;
}

/**
 * Binds a language pair's on-device translation status into React.
 *
 * Every consumer passing the same pair sees the same value, because the state
 * lives in a module store rather than a provider — see `lib/translator`. Pass
 * `null` when no second language has been chosen: nothing is probed and nothing
 * is downloaded, which matters when guessing wrong costs a few hundred MB.
 */
export const useTranslatorCapability = (pair: LangPair | null): UseTranslatorCapabilityResult => {
  // Destructured to primitives so the effect and the callback below can depend
  // on the pair honestly — the object itself is rebuilt on every render upstream.
  const source = pair?.source ?? null;
  const target = pair?.target ?? null;

  const status = useSyncExternalStore(
    subscribeTranslators,
    useCallback(
      () => getTranslatorStatus(source && target ? pairKey({ source, target }) : null),
      [source, target],
    ),
    getServerTranslatorStatus,
  );

  useEffect(() => {
    if (source && target) void probeAvailability({ source, target });
  }, [source, target]);

  useEffect(() => {
    trackCapability("translator", status.state);
  }, [status.state]);

  const enable = useCallback(
    () =>
      source && target
        ? ensureTranslator({ source, target })
        : Promise.reject(new Error("No target language has been chosen yet.")),
    [source, target],
  );

  return { ...status, enable };
};
