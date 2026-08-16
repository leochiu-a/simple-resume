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
   * Never trust one that came out of storage or a link; run it through
   * `normaliseSectionOrder` first.
   */
  sectionOrder: SectionId[];
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
