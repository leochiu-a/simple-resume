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
 * One paragraph, no typed breaks, taller than a page.
 *
 * The preview cannot give this one the page's margins — see `use-pagination`: a
 * run of text longer than a page has to split inside itself, and a margin moves
 * every line of an element together. The PDF splits it properly, so it is here to
 * hold the PDF to that, and to make the limit visible rather than forgotten.
 */
export const UNBROKEN: SeedResume = { ...BASE, profile: lorem(7, " ") };

/** Every seed the layout suites run through, by the name they report under. */
export const LONG_SEEDS = {
  "typed lines": TYPED_LINES,
  paragraphs: PARAGRAPHS,
  mixed: MIXED,
  "many entries": MANY_ENTRIES,
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
