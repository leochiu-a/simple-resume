/**
 * The parts of a resume that are a section on the sheet — everything except the
 * name, job title and contact details, which are the header of every template.
 *
 * Declared as a tuple rather than as a union so the same list can be a runtime
 * value: it is what a stored order is validated against, what the reorder list
 * renders, and what the agent tool advertises as its enum.
 */
export const SECTION_IDS = [
  "profile",
  "employmentHistory",
  "projects",
  "educations",
  "skills",
  "socialLinks",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/**
 * A section the user made up: "Certifications", "Awards", "Languages",
 * "Volunteering", "Talks". The product ships six sections and there is no end to
 * the seventh, so the seventh is theirs to name.
 *
 * The prefix is what keeps `sectionOrder` a single list without a tagged union:
 * an id either is one of the six or reads `custom:…`, and both a type guard and
 * a stored-value check are one `startsWith` away.
 */
export type CustomSectionId = `custom:${string}`;

/** What can name a section anywhere the layout is decided — the order, a slot. */
export type SectionKey = SectionId | CustomSectionId;

export const CUSTOM_SECTION_PREFIX = "custom:";

export const isCustomSectionId = (value: unknown): value is CustomSectionId =>
  typeof value === "string" && value.startsWith(CUSTOM_SECTION_PREFIX);

export interface CustomSection {
  id: CustomSectionId;
  /** The heading, as typed. Empty while it is being named. */
  title: string;
  /** Bullet lines joined by SPLIT_TEXT, as in `EmploymentHistory`. */
  description: string;
  /**
   * Whether it is on the sheet.
   *
   * A flag on the section rather than an entry in `visibility`, which is keyed by
   * the six ids that always exist. A record would keep the entry after the
   * section was deleted, and a document that accumulates settings for things that
   * are gone is one nobody can reason about — this way the flag is destroyed with
   * what it describes.
   */
  visible: boolean;
}

export interface Resume {
  name: string;
  wantedJob: string;
  city: string;
  phone: string;
  email: string;
  profile: string;
  socialLinks: SocialLink[];
  skills: Skill[];
  educations: Education[];
  employmentHistory: EmploymentHistory[];
  projects: Project[];
  /**
   * The sections the user added themselves, in no particular order — where each
   * one sits on the page is `sectionOrder`'s business, exactly as it is for the
   * six built-in ones.
   *
   * Optional at runtime the way `projects` is: a document written by an older
   * release, or one that arrived through a share link from one, does not have the
   * field at all. Read it through `customSectionsOf`, never directly.
   */
  customSections: CustomSection[];
  visibility: Visibility;
  /**
   * Top to bottom, the order the sections are laid out in.
   *
   * Part of the resume rather than of the appearance settings, even though it is
   * a layout decision: a share link carries a `Resume` and nothing else, and an
   * order that did not travel with it would mean the page someone is sent is not
   * the page that was sent. It is stored per locale for the same reason
   * `visibility` is — a translation is a copy, so it inherits the order and can
   * then diverge.
   *
   * Holds custom ids as well as the six built-in ones, which is why a stored
   * order can name a section that no longer exists — deleting a custom section
   * leaves its id behind here until the next read drops it.
   *
   * Never trust one that came out of storage or a link; run it through
   * `normaliseSectionOrder` first.
   */
  sectionOrder: SectionKey[];
}

export interface SocialLink {
  name: string;
  url: string;
}

export interface Skill {
  name: string;
}

/** `null` is what the date picker stores for an ongoing entry — see LabeledDatePickerField. */
export interface Timeline {
  from: string | null;
  to: string | null;
}

export interface Education {
  school: string;
  degree: string;
  major: string;
  timeline: Timeline;
}

export interface EmploymentHistory {
  company: string;
  jobTitle: string;
  timeline: Timeline;
  description: string;
}

/**
 * A side project or piece of work worth showing on its own. No timeline: a
 * project is judged by what it is and what it links to, and the date a hobby
 * repo started says little — the employment section already carries the
 * chronology.
 */
export interface Project {
  name: string;
  /** Where to see it: a repo, a demo, a write-up. Never translated. */
  url: string;
  /** Bullet lines joined by SPLIT_TEXT, as in `EmploymentHistory`. */
  description: string;
}

export type Visibility = Record<SectionId, boolean>;
