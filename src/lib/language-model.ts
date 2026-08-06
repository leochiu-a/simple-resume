/**
 * The Prompt API, wrapped so the rest of the app can treat "is on-device
 * rewriting ready?" as one observable value.
 *
 * This is `lib/translator.ts` applied to a second API, and the reasons for the
 * module-scope store are the same ones: a download has to survive the popover
 * that started it being closed, and every rewrite trigger in the form has to
 * show the same answer. The difference is that there is no pair to key by — one
 * general-purpose model serves every section — so this holds a single session
 * rather than a map.
 *
 * Types come from `@types/dom-chromium-ai`, which declares `LanguageModel` as a
 * global class with static `create`/`availability`. That is why this reads the
 * global by name rather than off `window` the way the translator does — but the
 * name is only present in browsers that implement the API, so every read still
 * has to be guarded (see `factory`).
 */

export type LanguageModelState =
  /** `availability()` has not answered yet. */
  | "checking"
  | "unsupported"
  /** The model is not on the device and fetching it needs a user activation. */
  | "downloadable"
  | "downloading"
  | "ready"
  | "error";

export interface LanguageModelStatus {
  state: LanguageModelState;
  /** 0–1 while downloading; null when the download is not ours to measure. */
  progress: number | null;
  error?: string;
}

// Frozen singletons: useSyncExternalStore compares snapshots by identity and
// will loop forever if getSnapshot keeps handing back fresh objects.
const CHECKING: LanguageModelStatus = Object.freeze({ state: "checking", progress: null });
const UNSUPPORTED: LanguageModelStatus = Object.freeze({ state: "unsupported", progress: null });

/**
 * The global, or undefined where it does not exist.
 *
 * `typeof` rather than a bare reference: reading an undeclared binding throws a
 * ReferenceError, and TypeScript believes the class is always there.
 */
const factory = () =>
  typeof LanguageModel === "undefined" ? undefined : (LanguageModel as typeof LanguageModel);

export const isLanguageModelSupported = () => !!factory();

/**
 * The instruction every session is created with.
 *
 * Kept here rather than glued onto each prompt so it is stated once and the
 * session can be reused across rewrites. The rules are the ones a résumé
 * rewrite gets wrong without being told: inventing employers and metrics that
 * were never in the input, and answering conversationally when the caller needs
 * the replacement text and nothing else.
 */
const SYSTEM_PROMPT = [
  "You rewrite sections of a résumé.",
  "Return only the rewritten text — no preamble, no commentary, no quotation marks around it, and no markdown fences.",
  "Never invent facts. Do not add employers, job titles, dates, technologies, team sizes or metrics that are not already in the text you are given.",
  "If the text has no numbers, do not make any up; rewrite what is there instead.",
  "Keep the language of the original: text written in Chinese stays in Chinese, text written in English stays in English.",
].join(" ");

/** A promise, not a session, so two callers racing to enable share one download. */
let pending: Promise<LanguageModel> | null = null;
let status: LanguageModelStatus = CHECKING;
const listeners = new Set<() => void>();

const setStatus = (next: LanguageModelStatus) => {
  // `downloadprogress` fires far more often than the percentage changes, and
  // every emit re-renders every mounted trigger.
  if (
    status.state === next.state &&
    status.progress === next.progress &&
    status.error === next.error
  ) {
    return;
  }

  status = next;
  listeners.forEach((listener) => listener());
};

export const subscribeLanguageModel = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getLanguageModelStatus = (): LanguageModelStatus =>
  isLanguageModelSupported() ? status : UNSUPPORTED;

/** Server snapshots must be one stable object, hence the singleton. */
export const getServerLanguageModelStatus = () => CHECKING;

const POLL_INTERVAL_MS = 2000;
const POLL_LIMIT = 150; // ~5 minutes, then stop asking.

/**
 * `availability()` hangs on a Chromium that exposes the API without the model
 * service behind it — the same trap `lib/translator.ts` documents. Without this
 * the trigger would sit on "Checking" for the life of the page and never offer
 * the by-hand fallback.
 */
const PROBE_TIMEOUT_MS = 5000;

const TIMED_OUT = Symbol("language-model-availability-timeout");

const withTimeout = <T>(promise: Promise<T>) =>
  new Promise<T | typeof TIMED_OUT>((resolve, reject) => {
    const timer = setTimeout(() => resolve(TIMED_OUT), PROBE_TIMEOUT_MS);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error as Error);
      },
    );
  });

let poll: ReturnType<typeof setTimeout> | null = null;

/** Watches a download somebody else started — another tab, or an earlier visit. */
const schedulePoll = (attempt: number) => {
  if (poll && attempt === 0) return;
  if (attempt >= POLL_LIMIT) {
    poll = null;

    return;
  }

  poll = setTimeout(() => {
    poll = null;
    void probeLanguageModel(attempt + 1);
  }, POLL_INTERVAL_MS);
};

/**
 * Asks whether the model is already on the device. Needs no user activation, so
 * it is safe to run on mount.
 */
export const probeLanguageModel = async (attempt = 0): Promise<void> => {
  const languageModel = factory();
  if (!languageModel) return;
  // Once we own a create() its monitor is the better source of truth.
  if (pending) return;

  try {
    const availability = await withTimeout(languageModel.availability());

    // A create() may have started while we were awaiting; it knows more.
    if (pending) return;

    if (availability === TIMED_OUT) {
      // Mid-poll a silence means the download is still going, not that the API
      // has gone away — only the first ask gets to declare the model unusable.
      if (attempt > 0) {
        schedulePoll(attempt);

        return;
      }

      setStatus({
        state: "unsupported",
        progress: null,
        error: "This browser's language model did not respond.",
      });

      return;
    }

    if (availability === "downloading") {
      setStatus({ state: "downloading", progress: null });
      schedulePoll(attempt);

      return;
    }

    setStatus({
      state:
        availability === "available"
          ? "ready"
          : availability === "downloadable"
            ? "downloadable"
            : "unsupported",
      progress: availability === "available" ? 1 : null,
    });
  } catch {
    setStatus({
      state: "error",
      progress: null,
      error: "Could not check whether the model is available.",
    });
  }
};

/**
 * Downloads the model if needed and returns the session.
 *
 * Must be reached synchronously from a click: transient user activation does not
 * survive an await, so there is deliberately none before `create()`. This is
 * also why the function is not `async` — an async body resumes in a microtask,
 * which is enough to lose the activation on some paths.
 *
 * No `temperature` or `topK`: both are deprecated on the web and restricted to
 * extension contexts, and passing them alongside anything else is a TypeError.
 * The default sampling is what a rewrite wants anyway.
 */
export const ensureLanguageModel = (): Promise<LanguageModel> => {
  if (pending) return pending;

  const languageModel = factory();
  if (!languageModel) {
    setStatus({ state: "unsupported", progress: null });

    return Promise.reject(new Error("The Prompt API is not available in this browser."));
  }

  setStatus({ state: "downloading", progress: 0 });

  const created = languageModel
    .create({
      initialPrompts: [{ role: "system", content: SYSTEM_PROMPT }],
      monitor: (monitor) => {
        monitor.addEventListener("downloadprogress", (event) => {
          setStatus({
            state: "downloading",
            progress: Math.min(1, Math.max(0, event.loaded)),
          });
        });
      },
    })
    .then((session) => {
      setStatus({ state: "ready", progress: 1 });
      registerTeardown();

      return session;
    })
    .catch((error: unknown) => {
      // Drop the rejected promise first, or every retry re-awaits this same
      // failure and the button never works again.
      pending = null;

      const name = error instanceof DOMException ? error.name : "";
      setStatus({
        state: name === "NotSupportedError" ? "unsupported" : "error",
        progress: null,
        error:
          name === "NotAllowedError"
            ? "Needs a click to start — try again."
            : "The model could not be started. Check your connection and try again.",
      });

      throw error;
    });

  pending = created;

  return created;
};

let teardownRegistered = false;

/**
 * The session is a cheap handle over a model already on disk, so it outlives the
 * popover that created it — closing and reopening one would otherwise pay for a
 * new session each time. It only goes on the way out of the page.
 */
const registerTeardown = () => {
  if (teardownRegistered || typeof window === "undefined") return;
  teardownRegistered = true;

  window.addEventListener("pagehide", () => {
    void pending?.then((session) => session.destroy()).catch(() => {});
  });
};

/** Test seam: drops the cached session, status and timer. */
export const resetLanguageModel = () => {
  if (poll) clearTimeout(poll);
  poll = null;
  pending = null;
  status = CHECKING;
  listeners.forEach((listener) => listener());
};
