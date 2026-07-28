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

export interface Visibility {
  profile: boolean;
  socialLinks: boolean;
  skills: boolean;
  educations: boolean;
  employmentHistory: boolean;
}
