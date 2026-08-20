import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { DEFAULT_SECTION_ORDER } from "@/lib/resume-sections";
import { Resume } from "@/types/resume";

/**
 * The resume the landing page's sheet shows.
 *
 * Not `DEFAULT_RESUME`: the editor starts you on placeholder names and lorem
 * ipsum, which is the right thing for a form you are about to overwrite and the
 * wrong thing for a page whose whole argument is "look at the typesetting".
 * Everyone and everything here is invented.
 */

/** A job's bullets live in one string, joined the way the textarea joins them. */
const bullets = (...lines: string[]) => lines.join(SPLIT_TEXT);

export const SHOWCASE_RESUME: Resume = {
  name: "Iris Halloran",
  wantedJob: "Senior Frontend Engineer",
  email: "iris@halloran.dev",
  phone: "+886 912 345 678",
  city: "Taipei",
  profile:
    "Frontend engineer with nine years spent on design systems and the rendering side of the browser. I like the unglamorous parts: bringing a 4MB bundle down to 400KB, making a component library that designers actually reach for, and writing the documentation nobody asked for until they needed it. Most recently I led the migration of a twelve-year-old checkout onto React Server Components without a freeze on feature work.",
  socialLinks: [
    { name: "GitHub", url: "https://github.com/iris" },
    { name: "Website", url: "https://halloran.dev" },
    { name: "LinkedIn", url: "https://linkedin.com/in/iris" },
  ],
  skills: [
    { name: "TypeScript" },
    { name: "React" },
    { name: "Next.js" },
    { name: "Design systems" },
    { name: "Web performance" },
    { name: "Accessibility" },
  ],
  educations: [
    {
      school: "National Taiwan University",
      degree: "B.Sc.",
      major: "Computer Science",
      timeline: { from: "2012-09-01", to: "2016-06-01" },
    },
  ],
  employmentHistory: [
    {
      company: "Northsail",
      jobTitle: "Staff Frontend Engineer",
      timeline: { from: "2021-03-01", to: null },
      description: bullets(
        "Led the checkout rewrite onto React Server Components",
        "Cut median page weight by 62% across the storefront",
        "Built the component library now used by four product teams",
        "Mentored three engineers through their first design system contributions",
      ),
    },
    {
      company: "Lumen Labs",
      jobTitle: "Senior Frontend Engineer",
      timeline: { from: "2018-01-01", to: "2021-02-01" },
      description: bullets(
        "Owned the analytics dashboard from prototype to 40k weekly users",
        "Introduced visual regression testing to a team of eleven",
        "Rebuilt the charting layer to render 100k points without dropping frames",
      ),
    },
    {
      company: "Kite & Co.",
      jobTitle: "Frontend Engineer",
      timeline: { from: "2016-07-01", to: "2017-12-01" },
      description: bullets(
        "Shipped the first responsive rebuild of the marketing site",
        "Set up the CI pipeline the team still runs today",
      ),
    },
  ],
  projects: [
    {
      name: "Tideline",
      url: "https://github.com/tideline",
      description: bullets(
        "An offline-first tide chart for small-boat sailors, 3k monthly users",
        "Renders a year of predictions client-side from a 40kb harmonic table",
      ),
    },
    {
      name: "Gridpaper",
      url: "https://github.com/gridpaper",
      description: bullets(
        "A CSS grid inspector that overlays the implied grid on any page",
        "Published as a browser extension with 12k installs",
      ),
    },
  ],
  customSections: [],
  visibility: {
    profile: true,
    socialLinks: true,
    skills: true,
    educations: true,
    employmentHistory: true,
    projects: true,
  },
  sectionOrder: [...DEFAULT_SECTION_ORDER],
};
