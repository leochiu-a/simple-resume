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
}

export interface SocialLink {
  name: string;
  url: string;
}

export interface Skill {
  name: string;
}

export interface Education {
  school: string;
  degree: string;
  major: string;
  timeline: {
    from: string;
    to: string;
  };
}

export interface EmploymentHistory {
  company: string;
  jobTitle: string;
  timeline: {
    from: string;
    to: string;
  };
  description: string;
}