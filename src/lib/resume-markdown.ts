import { format, parseISO } from "date-fns";

import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { Education, EmploymentHistory, Project, Resume, SectionId, Timeline } from "@/types/resume";

import { normaliseSectionOrder } from "./resume-sections";

/**
 * Renders a resume as Markdown.
 *
 * The PDF and the HTML export are both layouts — a model reading them has to
 * recover the structure from position and type size. Markdown carries the same
 * content as headings, lists and links, which is the shape an agent (or any
 * chat box you paste into) can read without a parser, so this is the export for
 * "here is my resume, tailor it to this job".
 *
 * It follows the preview: the sections come out in the order they are laid out
 * in, hidden ones are left out, and empty fields never become empty headings.
 *
 * Deliberately independent of the templates: there is one Markdown rendering,
 * not one per template. Adding a template does not add a builder here.
 */

/** Templates render dates as month + year; nothing finer is ever entered. */
const formatMonth = (value: string | null) => {
  if (!value) return "";

  const date = parseISO(value);

  return Number.isNaN(date.getTime()) ? "" : format(date, "MMM yyyy");
};

const formatTimeline = ({ from, to }: Timeline) => {
  const start = formatMonth(from);
  const end = formatMonth(to);

  if (!start && !end) return "";

  return `${start || "?"} — ${end || "Present"}`;
};

/** Markdown is line-based, so a section is a list of lines and blanks join them. */
const paragraphs = (blocks: string[]) => blocks.filter(Boolean).join("\n\n");

/** Bullet lines as the form stores them — see LabeledBulletTextAreaField. */
const toBulletLines = (description: string | undefined) =>
  description ? description.split(SPLIT_TEXT) : [];

const bulletList = (items: string[]) =>
  items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n");

const contactLine = (resume: Resume) =>
  [resume.city, resume.phone, resume.email]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");

const socialLine = (resume: Resume) =>
  resume.socialLinks
    .filter((link) => link.name?.trim() || link.url?.trim())
    .map((link) => (link.url?.trim() ? `[${link.name || link.url}](${link.url})` : link.name))
    .join(" · ");

const employmentEntry = (job: EmploymentHistory) => {
  const heading = [job.jobTitle, job.company]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" — ");
  const timeline = formatTimeline(job.timeline);
  const bullets = bulletList(toBulletLines(job.description));

  return paragraphs([heading ? `### ${heading}` : "", timeline, bullets]);
};

const projectEntry = (project: Project) => {
  const name = project.name?.trim();
  const url = project.url?.trim();
  // The name carries the link when both are present, so the URL is never twice.
  const heading = name && url ? `[${name}](${url})` : name || url;
  const bullets = bulletList(toBulletLines(project.description));

  return paragraphs([heading ? `### ${heading}` : "", bullets]);
};

const educationEntry = (education: Education) => {
  const heading = education.school?.trim();
  const detail = [education.degree, education.major]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  const timeline = formatTimeline(education.timeline);

  return paragraphs([
    heading ? `### ${heading}` : "",
    [detail, timeline].filter(Boolean).join("\n"),
  ]);
};

/** A section with no entries prints nothing at all, heading included. */
const section = (title: string, body: string) => (body ? `## ${title}\n\n${body}` : "");

export const buildResumeMarkdown = (resume: Resume): string => {
  /*
    Each of the six, ready to render but not yet rendered — the order decides
    which of them run and in what sequence, and it is the resume's order rather
    than one written down here. A fixed sequence would mean the clipboard
    disagreeing with the sheet for anyone who has rearranged their sections,
    which is the one thing this export is not allowed to do: it is the copy an
    agent reads back as "my resume".

    `socialLinks` is in the order like everything else and prints nothing, because
    the links are already in the header block above — they are contact details in
    Markdown, not a section with a heading.
  */
  const blocks: Record<SectionId, () => string> = {
    profile: () => section("Profile", resume.profile?.trim() ?? ""),
    skills: () =>
      section(
        "Skills",
        resume.skills
          .map((skill) => skill.name?.trim())
          .filter(Boolean)
          .join(", "),
      ),
    employmentHistory: () =>
      section(
        "Employment History",
        resume.employmentHistory.map(employmentEntry).filter(Boolean).join("\n\n"),
      ),
    projects: () =>
      section("Projects", (resume.projects ?? []).map(projectEntry).filter(Boolean).join("\n\n")),
    educations: () =>
      section("Education", resume.educations.map(educationEntry).filter(Boolean).join("\n\n")),
    socialLinks: () => "",
  };

  const sections = normaliseSectionOrder(resume.sectionOrder).map((id) =>
    resume.visibility[id] ? blocks[id]() : "",
  );

  return `${paragraphs([
    resume.name?.trim() ? `# ${resume.name.trim()}` : "",
    resume.wantedJob?.trim(),
    contactLine(resume),
    resume.visibility.socialLinks ? socialLine(resume) : "",
    ...sections,
  ])}\n`;
};
