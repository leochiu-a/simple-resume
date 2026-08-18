import { SHOWCASE_RESUME } from "@/components/landing/showcase-resume";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { measureResume } from "@/lib/resume-score/metrics";
import { scoreResume } from "@/lib/resume-score/rules";
import { Resume } from "@/types/resume";

/**
 * The two resumes the score storyboard runs the real scorer over.
 *
 * "After" is the showcase resume the hero already renders, unchanged. "Before" is
 * the same person's earlier draft, expressed as a diff against it so the page can
 * only ever show a difference the reader could actually make: the numbers come out
 * of the bullets, the thin role out of a role with one line, the short profile out
 * of a short profile. Nothing here is a score target — the figures in the panel are
 * whatever `scoreResume` says about these two objects, which is the point of
 * rendering the real panel instead of a screenshot of one.
 */

const bullets = (...lines: string[]) => lines.join(SPLIT_TEXT);

export const AFTER_RESUME = SHOWCASE_RESUME;

export const BEFORE_RESUME: Resume = {
  ...SHOWCASE_RESUME,

  /* Under 25 words, where the profile rule stops giving full credit. */
  profile: "Frontend engineer. I have worked on design systems and performance for a while now.",

  employmentHistory: [
    {
      ...SHOWCASE_RESUME.employmentHistory[0],
      description: bullets(
        // Same work, told as duties with the numbers taken out — which is the
        // draft the agent is rewriting, not a strawman.
        "Responsible for the checkout rewrite onto React Server Components",
        "Worked on making the storefront pages lighter",
        "Was involved in the team's component library, which is now something that several of the other product teams here have adopted for their own work as well, in one form or another",
        "Helped out",
      ),
    },
    {
      ...SHOWCASE_RESUME.employmentHistory[1],
      description: bullets(
        "Owned the analytics dashboard",
        "Introduced visual regression testing to the team",
        "Rebuilt the charting layer",
      ),
    },
    {
      ...SHOWCASE_RESUME.employmentHistory[2],
      /* Never written up, which is what the "every role is described" rule calls
         a gap — and the reason that row is the one hard failure in the panel. */
      description: "",
    },
  ],

  projects: SHOWCASE_RESUME.projects.map((project, index) => ({
    ...project,
    description: [
      bullets(
        "An offline-first tide chart for small-boat sailors",
        "Does the maths in the browser",
      ),
      bullets(
        "A CSS grid inspector that overlays the implied grid on any page",
        "On the web store",
      ),
    ][index],
  })),
};

/** Pure, so both reports are computed once at module load rather than per render. */
const report = (resume: Resume) => scoreResume(measureResume(resume), resume);

export const BEFORE_REPORT = report(BEFORE_RESUME);
export const AFTER_REPORT = report(AFTER_RESUME);
