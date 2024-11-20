export const DEFAULT_RESUME = {
  name: "My Name",
  wantedJob: "Senior job",
  email: "good@gmail.com",
  phone: "0123456789",
  city: "Taipei",
  profile:
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
  socialLinks: [
    {
      name: "Github",
      url: "https://github.com",
    },
    {
      name: "Medium",
      url: "https://medium.com",
    },
    {
      name: "Threads",
      url: "https://threads.net",
    },
  ],
  skills: [
    { name: "TypeScript" },
    { name: "React" },
    { name: "Next.js" },
    { name: "GraphQL" },
    { name: "Redux" },
  ],
  educations: [
    {
      school: "University of California",
      degree: "Bachelor",
      major: "Computer Science",
      timeline: {
        from: "2014-01-01",
        to: "2018-01-01",
      },
    },
    {
      school: "University of California",
      degree: "Bachelor",
      major: "Computer Science",
      timeline: {
        from: "2014-01-01",
        to: "2018-01-01",
      },
    },
  ],
  employmentHistory: [
    {
      company: "Google",
      jobTitle: "Senior Engineer",
      timeline: {
        from: "2018-01-01",
        to: "2020-01-01",
      },
      description: "A,B,C,D",
    },
  ],
  visibility: {
    profile: true,
    socialLinks: true,
    skills: true,
    educations: true,
    employmentHistory: true,
  },
};
