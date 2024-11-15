export interface Resume {
  name: string;
  wantedJob: string;
  city: string;
  phone: string;
  email: string;
  profile: string;
  socialLinks: SocialLink[];
}

export interface SocialLink {
  name: string;
  url: string;
}
