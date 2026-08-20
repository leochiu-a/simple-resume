import { afterEach, describe, expect, it } from "vitest";

import { emptyResume } from "@/test/resume-fixture";
import { SECTION_IDS } from "@/types/resume";

import {
  buildInitialDoc,
  createEmptyResume,
  createResumeDoc,
  LEGACY_STORAGE_KEY,
} from "./resume-doc";
import { DEFAULT_SECTION_ORDER } from "./resume-sections";

/**
 * The read path out of storage.
 *
 * Everything here fails in the same direction when it fails at all — the user
 * opens the editor and their resume is not in it — and none of it throws on the
 * way. That is what makes it worth testing without a browser: the cases are all
 * about malformed input, and there are more of them than any e2e run would sit
 * through.
 */

/** A `window.localStorage` with nothing behind it but a Map. */
const stubStorage = (entries: Record<string, string> = {}) => {
  const map = new Map(Object.entries(entries));

  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: {
        getItem: (key: string) => map.get(key) ?? null,
        setItem: (key: string, value: string) => void map.set(key, value),
        removeItem: (key: string) => void map.delete(key),
      },
    },
    configurable: true,
    writable: true,
  });
};

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("buildInitialDoc", () => {
  const fallback = emptyResume({ name: "Fallback" });

  it("starts a fresh document from the fallback resume", () => {
    stubStorage();
    const doc = buildInitialDoc(fallback)();

    expect(doc.version).toBe(2);
    expect(doc.primaryLang).toBe("en");
    expect(doc.activeLang).toBe("en");
    expect(doc.locales.en).toEqual(fallback);
    expect(doc.translation).toEqual({});
  });

  it("carries a pre-v2 resume across as the primary locale, field for field", () => {
    const legacy = emptyResume({
      name: "Ada Lovelace",
      email: "ada@example.com",
      profile: "Analytical engine, mostly.",
      skills: [{ name: "Punch cards" }],
    });
    stubStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(legacy) });

    const doc = buildInitialDoc(fallback)();

    expect(doc.version).toBe(2);
    expect(doc.locales.en).toEqual(legacy);
    expect(doc.locales["zh-Hant"]).toBeUndefined();
  });

  it("falls back rather than throwing when the legacy entry is not JSON", () => {
    stubStorage({ [LEGACY_STORAGE_KEY]: "{ not json" });

    expect(buildInitialDoc(fallback)().locales.en).toEqual(fallback);
  });

  it("falls back when the legacy entry is JSON but not a resume", () => {
    stubStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify({ hello: "world" }) });
    expect(buildInitialDoc(fallback)().locales.en).toEqual(fallback);

    stubStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify([1, 2, 3]) });
    expect(buildInitialDoc(fallback)().locales.en).toEqual(fallback);

    stubStorage({ [LEGACY_STORAGE_KEY]: "null" });
    expect(buildInitialDoc(fallback)().locales.en).toEqual(fallback);
  });

  it("does not reach for storage when there is no window to read it from", () => {
    // The initialiser runs during render, and the first one is on the server.
    expect(() => buildInitialDoc(fallback)()).not.toThrow();
    expect(buildInitialDoc(fallback)().locales.en).toEqual(fallback);
  });

  it("leaves the legacy entry in place, so one release can still roll back", () => {
    const legacy = emptyResume({ name: "Ada Lovelace" });
    stubStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(legacy) });

    buildInitialDoc(fallback)();

    expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).not.toBeNull();
  });
});

describe("createResumeDoc", () => {
  it("labels the document with the language it was told", () => {
    const doc = createResumeDoc(emptyResume(), "zh-Hant");

    expect(doc.primaryLang).toBe("zh-Hant");
    expect(doc.activeLang).toBe("zh-Hant");
    expect(doc.locales["zh-Hant"]).toBeDefined();
    expect(doc.locales.en).toBeUndefined();
  });
});

describe("createEmptyResume", () => {
  it("is a resume with every section present, visible and in the default order", () => {
    const resume = createEmptyResume();

    expect(resume.sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
    expect(Object.values(resume.visibility).every(Boolean)).toBe(true);
    expect(SECTION_IDS.every((id) => id in resume.visibility)).toBe(true);
  });

  it("hands out a fresh order array rather than the shared default", () => {
    const resume = createEmptyResume();
    resume.sectionOrder.reverse();

    expect(DEFAULT_SECTION_ORDER).toEqual([
      "profile",
      "employmentHistory",
      "projects",
      "educations",
      "skills",
      "socialLinks",
    ]);
  });
});
