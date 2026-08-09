import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { toParagraphs } from "@/lib/paragraphs";
import { Resume } from "@/types/resume";
import { ResumeLang } from "@/types/resume-doc";

import { classifyOpener, OpenerKind } from "./verbs";

/**
 * One bullet, located well enough that a finding can name where it is.
 *
 * `section` and `entryIndex` are what let the panel say "Employment · Acme"
 * rather than "some bullet somewhere", which is the whole difference between a
 * score and a to-do list.
 */
export interface BulletMetric {
  section: "employmentHistory" | "projects";
  entryIndex: number;
  /** The company or project name, for labelling. May be empty while typing. */
  entryLabel: string;
  bulletIndex: number;
  text: string;
  opener: OpenerKind;
  hasNumber: boolean;
  wordCount: number;
}

/**
 * A resume reduced to the numbers the rules ask about. Computed once per change
 * so eleven rules do not each re-split the same strings.
 */
export interface ResumeMetrics {
  lang: ResumeLang;
  bullets: BulletMetric[];
  /** Entries with their bullets, so a rule can flag an entry with none. */
  entries: {
    section: "employmentHistory" | "projects";
    index: number;
    label: string;
    bulletCount: number;
  }[];
  profileWordCount: number;
  /** Total words across every visible section — the page-length proxy. */
  totalWordCount: number;
  skillCount: number;
  educationCount: number;
  socialLinkCount: number;
  employmentCount: number;
  projectCount: number;
}

/**
 * Words, for both scripts.
 *
 * Latin text is counted by whitespace runs. CJK is not spaced, so the same
 * count would read a 40-character Chinese line as one word — every length rule
 * would then fire on every Chinese resume. Han characters are therefore counted
 * individually and, since a Chinese word averages a shade under two characters,
 * halved. That approximation is good enough for "is this bullet too long",
 * which is the only question asked of it, and it degrades gracefully on the
 * mixed CJK/Latin lines this app's users actually write ("導入 Kubernetes").
 */
export const countWords = (text: string): number => {
  const han = text.match(/[一-鿿㐀-䶿]/g)?.length ?? 0;
  const latin = text
    .replace(/[一-鿿㐀-䶿]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.round(han / 2) + latin;
};

/**
 * Whether a line carries a quantified result.
 *
 * Any digit counts, and so do the Chinese numerals that appear in the shapes a
 * resume uses them in (「三倍」,「兩週」). Deliberately loose: the rule this feeds
 * is a nudge to add numbers, and a bullet containing "2019" while claiming no
 * measurement is a rarer and cheaper mistake than nagging a writer who already
 * wrote "reduced p99 by a third".
 */
const NUMBER_PATTERN = /[0-9]|[一二三四五六七八九十百千萬億兆]\s*[倍成％%個件次人天週月年小時分鐘]/;

const hasNumber = (text: string) => NUMBER_PATTERN.test(text);

/** Bullet fields are joined by SPLIT_TEXT — see LabeledBulletTextAreaField. */
const toBullets = (description: string): string[] =>
  description
    .split(SPLIT_TEXT)
    .map((bullet) => bullet.trim())
    .filter((bullet) => bullet !== "");

/**
 * Reads a resume into its metrics.
 *
 * Hidden sections are skipped throughout: `visibility` is what the templates
 * honour, so a section the reader will never see must not be scored — otherwise
 * turning off Projects would quietly cost points for empty projects.
 */
export const measureResume = (resume: Resume, lang: ResumeLang): ResumeMetrics => {
  const { visibility } = resume;
  const bullets: BulletMetric[] = [];
  const entries: ResumeMetrics["entries"] = [];

  const collect = (
    section: "employmentHistory" | "projects",
    items: { label: string; description: string }[],
  ) => {
    items.forEach((item, entryIndex) => {
      const lines = toBullets(item.description);
      entries.push({ section, index: entryIndex, label: item.label, bulletCount: lines.length });
      lines.forEach((text, bulletIndex) => {
        bullets.push({
          section,
          entryIndex,
          entryLabel: item.label,
          bulletIndex,
          text,
          opener: classifyOpener(text, lang),
          hasNumber: hasNumber(text),
          wordCount: countWords(text),
        });
      });
    });
  };

  if (visibility.employmentHistory) {
    collect(
      "employmentHistory",
      resume.employmentHistory.map((job) => ({
        label: job.company || job.jobTitle,
        description: job.description,
      })),
    );
  }

  if (visibility.projects) {
    collect(
      "projects",
      resume.projects.map((project) => ({
        label: project.name,
        description: project.description,
      })),
    );
  }

  const profileWordCount = visibility.profile
    ? toParagraphs(resume.profile).reduce((sum, paragraph) => sum + countWords(paragraph), 0)
    : 0;

  const headerWords = countWords(
    [resume.name, resume.wantedJob, resume.city, resume.phone, resume.email].join(" "),
  );
  const educationWords = visibility.educations
    ? resume.educations.reduce(
        (sum, education) =>
          sum + countWords(`${education.school} ${education.degree} ${education.major}`),
        0,
      )
    : 0;
  const skillWords = visibility.skills
    ? resume.skills.reduce((sum, skill) => sum + countWords(skill.name), 0)
    : 0;
  const entryHeadingWords = entries.reduce((sum, entry) => sum + countWords(entry.label), 0);
  const bulletWords = bullets.reduce((sum, bullet) => sum + bullet.wordCount, 0);

  return {
    lang,
    bullets,
    entries,
    profileWordCount,
    totalWordCount:
      headerWords +
      profileWordCount +
      educationWords +
      skillWords +
      entryHeadingWords +
      bulletWords,
    skillCount: visibility.skills ? resume.skills.filter((skill) => skill.name.trim()).length : 0,
    educationCount: visibility.educations
      ? resume.educations.filter((education) => education.school.trim()).length
      : 0,
    socialLinkCount: visibility.socialLinks
      ? resume.socialLinks.filter((link) => link.url.trim()).length
      : 0,
    employmentCount: visibility.employmentHistory ? resume.employmentHistory.length : 0,
    projectCount: visibility.projects ? resume.projects.length : 0,
  };
};
