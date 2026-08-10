import type { Page } from "@playwright/test";

import { DOC_STORAGE_KEY } from "./helpers";

/**
 * Resumes to put in front of the editor, and the one way of getting them there.
 *
 * Layout bugs live at the sizes real resumes reach, and typing a two-page resume
 * through the form in a test is both slow and beside the point. Seeding storage
 * before the first paint puts the editor in the state under test in one step,
 * which is also how a returning user arrives: the document is read from
 * `localStorage` on mount.
 *
 * The long fixtures below are deliberately different *shapes* of long, not just
 * different lengths — prose with typed line breaks, prose with none, and bulk
 * carried by many short entries all break differently, and a fix for one of them
 * is not a fix for the others.
 */

const LOREM =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

const lorem = (count: number, separator: string) =>
  Array.from({ length: count }, () => LOREM).join(separator);

export interface SeedResume {
  name: string;
  wantedJob: string;
  email: string;
  phone: string;
  city: string;
  profile: string;
  socialLinks: { name: string; url: string }[];
  skills: { name: string }[];
  educations: {
    school: string;
    degree: string;
    major: string;
    timeline: { from: string; to: string };
  }[];
  employmentHistory: {
    company: string;
    jobTitle: string;
    timeline: { from: string; to: string };
    description: string;
  }[];
  projects: { name: string; description: string }[];
  visibility: Record<string, boolean>;
}

const BASE: SeedResume = {
  name: "Ada Lovelace",
  wantedJob: "Frontend Engineer",
  email: "ada@example.com",
  phone: "0975812267",
  city: "Taipei",
  profile: "Frontend engineer with 5+ years building production web applications.",
  socialLinks: [
    { name: "Medium", url: "https://medium.com" },
    { name: "GitHub", url: "https://github.com" },
  ],
  skills: ["TypeScript", "React", "Next.js", "Vue", "GraphQL", "AWS"].map((name) => ({ name })),
  educations: [
    {
      school: "Providence University",
      degree: "Bachelor",
      major: "Computer Science",
      timeline: { from: "2014-09-01", to: "2018-07-01" },
    },
  ],
  employmentHistory: [],
  projects: [],
  visibility: {
    profile: true,
    socialLinks: true,
    skills: true,
    educations: true,
    employmentHistory: true,
    projects: true,
  },
};

const jobs = (count: number, bullets: number) =>
  Array.from({ length: count }, (_, n) => ({
    company: `Company ${n + 1}`,
    jobTitle: "Frontend Engineer",
    timeline: { from: "2020-10-01", to: "2024-11-01" },
    description: Array.from(
      { length: bullets },
      (_, i) =>
        `Achievement ${i + 1} at company ${n + 1}, written long enough that the line has to wrap onto a second line in every one of the four templates.`,
    ).join("|"),
  }));

/**
 * Prose the writer broke into lines themselves — the common shape of a long
 * profile, and the one a single `Text` per paragraph used to turn into one
 * indivisible slab taller than a page.
 */
export const TYPED_LINES: SeedResume = { ...BASE, profile: lorem(7, "\n") };

/** The same bulk as separate paragraphs, which are separate blocks already. */
export const PARAGRAPHS: SeedResume = { ...BASE, profile: lorem(7, "\n\n") };

/** Long prose *and* a long history, so the two kinds of break meet on one sheet. */
export const MIXED: SeedResume = {
  ...BASE,
  profile: lorem(3, "\n"),
  employmentHistory: jobs(4, 6),
  projects: [
    { name: "Design system", description: lorem(1, "\n") },
    { name: "Build pipeline", description: lorem(1, "\n") },
  ],
};

/** Bulk carried entirely by entries that must not be split across a break. */
export const MANY_ENTRIES: SeedResume = { ...BASE, employmentHistory: jobs(6, 8) };

/**
 * Bulk in the sidebar rather than the main column.
 *
 * Two of the four templates put skills and links in a tinted panel beside the
 * content, so a long enough list is the one way to make that panel — the thing
 * pulled out over the page's margin to bleed — be what runs onto page two.
 */
export const SIDEBAR_HEAVY: SeedResume = {
  ...BASE,
  skills: Array.from({ length: 40 }, (_, i) => ({
    name: `Skill ${i + 1} with a name long enough to wrap`,
  })),
  socialLinks: Array.from({ length: 12 }, (_, i) => ({
    name: `Profile ${i + 1}`,
    url: `https://example.com/profile-${i + 1}`,
  })),
};

/** Entries whose bulk is in one long description rather than in their number. */
export const LONG_DESCRIPTIONS: SeedResume = {
  ...BASE,
  profile: "",
  employmentHistory: Array.from({ length: 3 }, (_, n) => ({
    company: `Company ${n + 1}`,
    jobTitle: "Staff Frontend Engineer",
    timeline: { from: "2018-01-01", to: "2024-11-01" },
    description: Array.from({ length: 4 }, () => LOREM).join("|"),
  })),
};

/**
 * A single entry taller than a page.
 *
 * `wrap={false}` cannot be honoured by either renderer here — there is no page it
 * fits on — so it splits, and what is being checked is that it splits with the
 * page's margins rather than through them.
 */
export const OVERSIZED_ENTRY: SeedResume = {
  ...BASE,
  profile: "",
  employmentHistory: [
    {
      company: "Company with one very long entry",
      jobTitle: "Frontend Engineer",
      timeline: { from: "2020-10-01", to: "2024-11-01" },
      description: Array.from(
        { length: 26 },
        (_, i) =>
          `Achievement ${i + 1}, written long enough that the line has to wrap onto a second line in every one of the four templates.`,
      ).join("|"),
    },
  ],
};

/** The sections that usually run short, made to carry the overflow instead. */
export const PROJECTS_AND_STUDY: SeedResume = {
  ...BASE,
  profile: lorem(1, "\n"),
  projects: Array.from({ length: 6 }, (_, i) => ({
    name: `Project ${i + 1}`,
    description: Array.from(
      { length: 3 },
      (_, line) =>
        `Outcome ${line + 1} of project ${i + 1}, described at the length a real entry runs to.`,
    ).join("|"),
  })),
  educations: Array.from({ length: 5 }, (_, i) => ({
    school: `University of Somewhere ${i + 1}`,
    degree: i % 2 === 0 ? "Bachelor" : "Master",
    major: "Computer Science and Information Engineering",
    timeline: { from: `${2010 + i}-09-01`, to: `${2012 + i}-07-01` },
  })),
};

/**
 * The same resume in Chinese, which is the editor's default language.
 *
 * Worth its own seed rather than trusting the Latin ones: CJK wraps between
 * characters instead of between words, so the lines fall in different places and
 * a break that is safe in English is not evidence about one here.
 */
export const CHINESE: SeedResume = {
  name: "王小明",
  wantedJob: "前端工程師",
  email: "ming@example.com",
  phone: "0912345678",
  city: "臺北市",
  profile: Array.from(
    { length: 6 },
    () =>
      "五年以上前端開發經驗，熟悉 React 與 TypeScript，負責過設計系統的建置與維護，並將團隊的建置時間縮短四成。曾主導跨團隊的技術規劃，導入自動化測試與持續整合流程，讓每週的發布次數提高到三倍，同時把線上事故的平均修復時間壓到半小時以內。",
  ).join("\n"),
  socialLinks: [{ name: "GitHub", url: "https://github.com" }],
  skills: ["TypeScript", "React", "效能優化", "設計系統"].map((name) => ({ name })),
  educations: [
    {
      school: "國立中央大學",
      degree: "碩士",
      major: "資訊工程學系",
      timeline: { from: "2018-08-01", to: "2020-08-01" },
    },
  ],
  employmentHistory: Array.from({ length: 3 }, (_, n) => ({
    company: `第 ${n + 1} 家公司`,
    jobTitle: "前端工程師",
    timeline: { from: "2020-10-01", to: "2024-11-01" },
    description: Array.from(
      { length: 5 },
      (_, i) =>
        `第 ${i + 1} 項成果，寫得夠長，讓這一行在四個版型裡都必須換行到第二行以上，才能測到分頁真正會發生的地方。`,
    ).join("|"),
  })),
  projects: [],
  visibility: BASE.visibility,
};

/** Everything long at once, which is the resume that actually gets reported. */
export const EVERYTHING: SeedResume = {
  ...PROJECTS_AND_STUDY,
  profile: lorem(3, "\n"),
  employmentHistory: jobs(4, 6),
  skills: SIDEBAR_HEAVY.skills,
  socialLinks: SIDEBAR_HEAVY.socialLinks,
};

/**
 * One paragraph, no typed breaks, taller than a page.
 *
 * The preview cannot give this one the page's margins — see `use-pagination`: a
 * run of text longer than a page has to split inside itself, and a margin moves
 * every line of an element together. The PDF splits it properly, so it is here to
 * hold the PDF to that, and to make the limit visible rather than forgotten.
 */
export const UNBROKEN: SeedResume = { ...BASE, profile: lorem(7, " ") };

/**
 * Every seed the layout suites run through, by the name they report under.
 *
 * One per shape rather than one per section: what decides where a break can go is
 * whether the overflow is prose, a list of unbreakable entries, one entry too big
 * for any page, or a column the page's margin does not apply to the same way — and
 * a template can get one of those right while getting the next one wrong.
 */
export const LONG_SEEDS = {
  "typed lines": TYPED_LINES,
  paragraphs: PARAGRAPHS,
  mixed: MIXED,
  "many entries": MANY_ENTRIES,
  "sidebar heavy": SIDEBAR_HEAVY,
  "long descriptions": LONG_DESCRIPTIONS,
  "oversized entry": OVERSIZED_ENTRY,
  "projects and study": PROJECTS_AND_STUDY,
  chinese: CHINESE,
  everything: EVERYTHING,
} satisfies Record<string, SeedResume>;

/**
 * Writes the document the editor reads on mount, before the page's own scripts
 * run. `addInitScript` rather than `evaluate` because the editor hydrates from
 * storage once and never looks again.
 */
export const seedResume = (page: Page, resume: SeedResume) =>
  page.addInitScript(([key, doc]) => window.localStorage.setItem(key, doc), [
    DOC_STORAGE_KEY,
    JSON.stringify({
      version: 2,
      primaryLang: "zh-Hant",
      activeLang: "zh-Hant",
      locales: { "zh-Hant": resume },
      translation: {},
    }),
  ] as const);
