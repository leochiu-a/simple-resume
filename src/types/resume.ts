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

export interface Visibility {
  profile: boolean;
  socialLinks: boolean;
  skills: boolean;
  educations: boolean;
  employmentHistory: boolean;
  projects: boolean;
}
