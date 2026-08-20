import { DEFAULT_SECTION_ORDER } from "@/lib/resume-sections";
import { Resume } from "@/types/resume";
import { ResumeDoc, ResumeLang } from "@/types/resume-doc";

export const RESUME_LANGS: readonly ResumeLang[] = ["zh-Hant", "en"] as const;

/** In the language itself — a switcher that says "Chinese" in English is no help. */
export const LANG_LABEL: Record<ResumeLang, string> = {
  "zh-Hant": "中文",
  en: "English",
};

/** For prose: "translate from Chinese to English". */
export const LANG_NAME_EN: Record<ResumeLang, string> = {
  "zh-Hant": "Chinese",
  en: "English",
};

/** With two languages the other one is the secondary. */
export const otherLang = (lang: ResumeLang): ResumeLang => (lang === "zh-Hant" ? "en" : "zh-Hant");

export const DOC_STORAGE_KEY = "resume-doc";
/** Pre-v2. Left in place after migrating so one release can still roll back. */
export const LEGACY_STORAGE_KEY = "resume";

const isResume = (value: unknown): value is Resume =>
  typeof value === "object" && value !== null && "name" in value && "employmentHistory" in value;

const readLegacyResume = (): Resume | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    return isResume(parsed) ? parsed : null;
  } catch {
    // A corrupt or unreadable entry is not worth failing the editor over: the
    // caller falls back to the default resume.
    return null;
  }
};

/**
 * `en` because that is what `DEFAULT_RESUME` is written in, and this is the label
 * on it. It was `zh-Hant` for long enough to ship an English sample resume that
 * the header called Chinese and then offered to translate *into* English.
 *
 * Still a guess for anyone who clears it and types their own, which is why the
 * label is not final: a document with one language says which in the header, and
 * `setSoleLang` moves it. A default that can be corrected in one click is a
 * starting point; one that cannot is a decision made on the user's behalf.
 */
export const createResumeDoc = (resume: Resume, lang: ResumeLang = "en"): ResumeDoc => ({
  version: 2,
  primaryLang: lang,
  activeLang: lang,
  locales: { [lang]: resume },
  translation: {},
});

/**
 * The initial value for the `resume-doc` key. Passed to `useLocalStorage` as a
 * lazy initialiser so the legacy read only happens when there is no v2 document.
 *
 * The old key held a bare `Resume`, which by definition was the only version the
 * user had — so it becomes the primary locale. It takes the same default label as
 * a fresh document, and for the same reason it is only a label: guessing wrong
 * would make the primary a translation, so the header lets it be corrected.
 */
export const buildInitialDoc = (fallback: Resume) => (): ResumeDoc =>
  createResumeDoc(readLegacyResume() ?? fallback);

/** A locale that exists but has nothing in it, for a form that must stay mounted. */
export const createEmptyResume = (): Resume => ({
  name: "",
  wantedJob: "",
  city: "",
  phone: "",
  email: "",
  profile: "",
  socialLinks: [],
  skills: [],
  educations: [],
  employmentHistory: [],
  projects: [],
  customSections: [],
  visibility: {
    profile: true,
    socialLinks: true,
    skills: true,
    educations: true,
    employmentHistory: true,
    projects: true,
  },
  sectionOrder: [...DEFAULT_SECTION_ORDER],
});
