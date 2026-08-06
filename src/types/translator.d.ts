/**
 * Minimal ambient types for the Translator API.
 *
 * Spec: https://webmachinelearning.github.io/translation-api/ (W3C Web Machine
 * Learning Community Group). Shipped in Chrome 138+ and Edge 148+, desktop only.
 *
 * Two constraints the types cannot express but every caller has to respect:
 * `create()` needs transient user activation, and the API is unavailable in
 * workers — it exists on `Window` alone.
 */

type TranslatorAvailability = "unavailable" | "downloadable" | "downloading" | "available";

interface TranslatorLanguagePair {
  /** A BCP 47 tag from the supported set — note `zh` is Simplified, `zh-Hant` Traditional. */
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslatorCreateMonitor {
  /**
   * `downloadprogress` fires with `loaded` between 0 and 1. `total` is always 1,
   * so it carries no information — read `loaded` as the fraction directly.
   */
  addEventListener(
    type: "downloadprogress",
    listener: (event: ProgressEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: "downloadprogress",
    listener: (event: ProgressEvent) => void,
    options?: boolean | EventListenerOptions,
  ): void;
}

interface TranslatorCreateOptions extends TranslatorLanguagePair {
  signal?: AbortSignal;
  monitor?: (monitor: TranslatorCreateMonitor) => void;
}

interface TranslatorInstance {
  translate(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  translateStreaming(input: string, options?: { signal?: AbortSignal }): ReadableStream<string>;
  /** Not shipped everywhere the rest of the API is — check before calling. */
  destroy?(): void;
}

interface TranslatorFactory {
  availability(pair: TranslatorLanguagePair): Promise<TranslatorAvailability>;
  /** Requires transient user activation: reach it in the click's own task. */
  create(options: TranslatorCreateOptions): Promise<TranslatorInstance>;
}

interface Window {
  /**
   * Present only in browsers that implement the Translator API.
   *
   * Deliberately declared here and not as a bare `declare const Translator`:
   * reading an undeclared global by name throws a ReferenceError, and every
   * caller in this app has to go through a feature check anyway.
   */
  readonly Translator?: TranslatorFactory;
}
