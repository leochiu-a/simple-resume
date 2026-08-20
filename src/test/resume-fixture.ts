import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { DEFAULT_SECTION_ORDER } from "@/lib/resume-sections";
import { Resume } from "@/types/resume";

/**
 * A resume with nothing in it, for the unit suite to fill one field of.
 *
 * The rules read `visibility` before anything else — a hidden section is skipped
 * rather than scored — so the fixture starts with every section on. A test about
 * a hidden section then says so in its own overrides, which is the one place a
 * reader of that test should have to look.
 *
 * Not `DEFAULT_RESUME`: that one is the sample document the editor opens on, so
 * it carries placeholder prose. A rule tested against it would be scored on
 * whatever the sample happens to say today, and the test would fail the next time
 * someone rewrites a line of it.
 */
export const emptyResume = (overrides: Partial<Resume> = {}): Resume => ({
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
  visibility: {
    profile: true,
    employmentHistory: true,
    projects: true,
    educations: true,
    skills: true,
    socialLinks: true,
  },
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  ...overrides,
});

/** Bullet lines as the form stores them — see LabeledBulletTextAreaField. */
export const bullets = (...lines: string[]) => lines.join(SPLIT_TEXT);

/** One job carrying the given bullets, with the fields no rule reads left empty. */
export const jobWith = (company: string, ...lines: string[]) => ({
  company,
  jobTitle: "",
  timeline: { from: null, to: null },
  description: bullets(...lines),
});

export const projectWith = (name: string, url: string, ...lines: string[]) => ({
  name,
  url,
  description: bullets(...lines),
});

/** `count` words that no rule reads as anything but words. */
export const words = (count: number) => Array.from({ length: count }, () => "word").join(" ");
