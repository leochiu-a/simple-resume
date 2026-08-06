/**
 * The Translator API, wrapped so the rest of the app can treat "is on-device
 * translation ready?" as one observable value.
 *
 * Everything here lives at module scope rather than in React state, for three
 * reasons that are all load-bearing:
 *
 * 1. A model download has to survive the panel that started it being unmounted.
 * 2. `translateResume` is a plain function and needs the instance without a hook.
 * 3. The nav panel and the editor's translate button read the same map keyed by
 *    the same string, so they cannot show different answers. A context could
 *    drift if it were ever mounted twice or memoised wrongly; a module cannot.
 */

export interface LangPair {
  source: string;
  target: string;
}

export const pairKey = (pair: LangPair) => `${pair.source}->${pair.target}`;

export type TranslatorState =
  /** `availability()` has not answered yet, or there is no pair to ask about. */
  | "checking"
  | "unsupported"
  /** The model is not on the device and fetching it needs a user activation. */
  | "downloadable"
  | "downloading"
  | "ready"
  | "error";

export interface TranslatorStatus {
  state: TranslatorState;
  /** 0–1 while downloading; null when the download is not ours to measure. */
  progress: number | null;
  error?: string;
}

// Frozen singletons: useSyncExternalStore compares snapshots by identity and
// will loop forever if getSnapshot keeps handing back fresh objects.
const CHECKING: TranslatorStatus = Object.freeze({ state: "checking", progress: null });
const UNSUPPORTED: TranslatorStatus = Object.freeze({ state: "unsupported", progress: null });

const factory = () => (typeof window === "undefined" ? undefined : window.Translator);

export const isTranslatorSupported = () => !!factory();

/** Promises, not instances, so two callers racing to enable share one download. */
const pool = new Map<string, Promise<TranslatorInstance>>();
const statuses = new Map<string, TranslatorStatus>();
const polls = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();

const setStatus = (key: string, next: TranslatorStatus) => {
  const prev = statuses.get(key);
  // `downloadprogress` fires far more often than the percentage changes, and
  // every emit re-renders both consumers.
  if (
    prev &&
    prev.state === next.state &&
    prev.progress === next.progress &&
    prev.error === next.error
  ) {
    return;
  }

  statuses.set(key, next);
  listeners.forEach((listener) => listener());
};

export const subscribeTranslators = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getTranslatorStatus = (key: string | null): TranslatorStatus => {
  if (!key) return CHECKING;
  if (!isTranslatorSupported()) return UNSUPPORTED;

  return statuses.get(key) ?? CHECKING;
};

/** Server snapshots must be one stable object, hence the singleton. */
export const getServerTranslatorStatus = () => CHECKING;

const POLL_INTERVAL_MS = 2000;
const POLL_LIMIT = 150; // ~5 minutes, then stop asking.

/**
 * `availability()` is documented to resolve and undocumented to ever hang, but
 * it does: a Chromium that exposes the API without the model service behind it
 * returns a promise that never settles. Without this the panel would sit on
 * "Checking" for the life of the page and never offer the manual fallback.
 */
const PROBE_TIMEOUT_MS = 5000;

const TIMED_OUT = Symbol("translator-availability-timeout");

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

/**
 * Watches a download somebody else started — another tab, or an earlier visit.
 * We have no monitor for it, so the only way to learn it finished is to ask.
 */
const schedulePoll = (pair: LangPair, attempt = 0) => {
  const key = pairKey(pair);
  if (polls.has(key) && attempt === 0) return;
  if (attempt >= POLL_LIMIT) {
    polls.delete(key);

    return;
  }

  polls.set(
    key,
    setTimeout(() => {
      polls.delete(key);
      void probeAvailability(pair, attempt + 1);
    }, POLL_INTERVAL_MS),
  );
};

/**
 * Asks whether the model is already on the device. Needs no user activation, so
 * it is safe to run on mount — which is what lets the panel say "Enable" rather
 * than "Enable (probably)".
 */
export const probeAvailability = async (pair: LangPair, attempt = 0): Promise<void> => {
  const key = pairKey(pair);
  const translator = factory();
  if (!translator) return;
  // Once we own a create() its monitor is the better source of truth.
  if (pool.has(key)) return;

  try {
    const availability = await withTimeout(
      translator.availability({
        sourceLanguage: pair.source,
        targetLanguage: pair.target,
      }),
    );

    // A create() may have started while we were awaiting; it knows more.
    if (pool.has(key)) return;

    if (availability === TIMED_OUT) {
      // Mid-poll a silence means the download is still going, not that the API
      // has gone away — only the first ask gets to declare the pair unusable.
      if (attempt > 0) {
        schedulePoll(pair, attempt);

        return;
      }

      setStatus(key, {
        state: "unsupported",
        progress: null,
        error: "This browser's translator did not respond.",
      });

      return;
    }

    if (availability === "downloading") {
      setStatus(key, { state: "downloading", progress: null });
      schedulePoll(pair, attempt);

      return;
    }

    setStatus(key, {
      state:
        availability === "available"
          ? "ready"
          : availability === "downloadable"
            ? "downloadable"
            : "unsupported",
      progress: availability === "available" ? 1 : null,
    });
  } catch {
    setStatus(key, {
      state: "error",
      progress: null,
      error: "Could not check whether the model is available.",
    });
  }
};

/**
 * Downloads the model if needed and returns the translator.
 *
 * Must be reached synchronously from a click: transient user activation does not
 * survive an await, so there is deliberately none before `create()`. This is
 * also why the function is not `async` — an async function body resumes in a
 * microtask, which is enough to lose the activation on some paths.
 */
export const ensureTranslator = (pair: LangPair): Promise<TranslatorInstance> => {
  const key = pairKey(pair);

  const pending = pool.get(key);
  if (pending) return pending;

  const translator = factory();
  if (!translator) {
    setStatus(key, { state: "unsupported", progress: null });

    return Promise.reject(new Error("The Translator API is not available in this browser."));
  }

  setStatus(key, { state: "downloading", progress: 0 });

  const created = translator
    .create({
      sourceLanguage: pair.source,
      targetLanguage: pair.target,
      monitor: (monitor) => {
        monitor.addEventListener("downloadprogress", (event) => {
          setStatus(key, {
            state: "downloading",
            progress: Math.min(1, Math.max(0, event.loaded)),
          });
        });
      },
    })
    .then((instance) => {
      setStatus(key, { state: "ready", progress: 1 });
      registerTeardown();

      return instance;
    })
    .catch((error: unknown) => {
      // Drop the rejected promise first, or every retry re-awaits this same
      // failure and the button never works again.
      pool.delete(key);

      const name = error instanceof DOMException ? error.name : "";
      setStatus(key, {
        // A pair the model does not cover is permanently out; a lost activation
        // or a dropped connection is not. Never generalise either to the whole
        // API — one pair failing says nothing about the next.
        state: name === "NotSupportedError" ? "unsupported" : "error",
        progress: null,
        error:
          name === "NotAllowedError"
            ? "Needs a click to start — try again."
            : "Download failed. Check your connection and try again.",
      });

      throw error;
    });

  pool.set(key, created);

  return created;
};

/** The translation run's accessor: never starts a download of its own. */
export const peekTranslator = (pair: LangPair) => pool.get(pairKey(pair));

let teardownRegistered = false;

/**
 * Instances are cheap sessions over a model that is already on disk, so they are
 * not destroyed when a component unmounts — the panel closing would otherwise
 * force the editor's translate button to build another one moments later. They
 * only go on the way out of the page.
 */
const registerTeardown = () => {
  if (teardownRegistered || typeof window === "undefined") return;
  teardownRegistered = true;

  window.addEventListener("pagehide", () => {
    pool.forEach((promise) => {
      void promise.then((instance) => instance.destroy?.()).catch(() => {});
    });
  });
};

/** Test seam: drops every cached instance, status and timer. */
export const resetTranslators = () => {
  polls.forEach((timer) => clearTimeout(timer));
  polls.clear();
  pool.clear();
  statuses.clear();
  listeners.forEach((listener) => listener());
};
