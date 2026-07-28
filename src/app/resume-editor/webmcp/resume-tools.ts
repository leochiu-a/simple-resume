import { UseFormReturn } from "react-hook-form";

import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { defineTool, toolError, toolText, WebMcpTool } from "@/lib/webmcp";
import { Education, EmploymentHistory, Resume, SocialLink, Visibility } from "@/types/resume";

const SECTIONS = ["profile", "socialLinks", "skills", "educations", "employmentHistory"] as const;

const monthSchema = (description: string) => ({
  type: "string",
  description: `${description} Format "YYYY-MM". Use an empty string for "Present".`,
});

/** The month picker stores full ISO dates but only ever renders month + year. */
const toIsoMonth = (value: string | undefined | null) => {
  const match = /^(\d{4})-(\d{2})/.exec((value ?? "").trim());

  return match ? `${match[1]}-${match[2]}-01` : "";
};

const toIsoMonthOr = (value: string | undefined, fallback: string) =>
  value === undefined ? fallback : toIsoMonth(value);

/** Bullet lines live in one string joined by SPLIT_TEXT — see LabeledBulletTextAreaField. */
const toBulletText = (bullets: string[]) => bullets.join(SPLIT_TEXT);

const fromBulletText = (value: string) => value.split(SPLIT_TEXT);

/**
 * The stored shape is awkward to reason about — timelines are full ISO dates and
 * job descriptions are one delimited string — so the agent gets a flattened view
 * that matches the arguments the write tools accept, plus the entry indexes.
 */
const toAgentView = (resume: Resume) => ({
  ...resume,
  employmentHistory: resume.employmentHistory.map((job, index) => ({
    index,
    company: job.company,
    jobTitle: job.jobTitle,
    from: job.timeline.from.slice(0, 7),
    to: job.timeline.to.slice(0, 7),
    bullets: fromBulletText(job.description),
  })),
  educations: resume.educations.map((education, index) => ({
    index,
    school: education.school,
    degree: education.degree,
    major: education.major,
    from: education.timeline.from.slice(0, 7),
    to: education.timeline.to.slice(0, 7),
  })),
  skills: resume.skills.map((skill) => skill.name),
});

const describeTimeline = ({ from, to }: { from: string; to: string }) =>
  `${from.slice(0, 7) || "?"} — ${to.slice(0, 7) || "Present"}`;

/**
 * Builds the tool set the agent uses to fill in the resume.
 *
 * Every mutation goes through `form.reset` rather than `setValue`: the section
 * lists are rendered by `useFieldArray`, which keeps its own copy of the rows
 * and does not pick up a `setValue` on the whole array. `reset` re-seeds the
 * field arrays (and remounts the contentEditable bullet fields, which only read
 * their value on mount), so agent edits show up in the form and the preview.
 */
export const createResumeTools = (getForm: () => UseFormReturn<Resume>): WebMcpTool[] => {
  const read = () => getForm().getValues();

  const write = (update: (previous: Resume) => Resume) => {
    const form = getForm();
    form.reset(update(form.getValues()));
  };

  const outOfRange = (label: string, index: number, length: number) =>
    toolError(
      `No ${label} at index ${index}. There ${length === 1 ? "is" : "are"} ${length} entr${
        length === 1 ? "y" : "ies"
      }, so valid indexes are 0–${length - 1}.`,
    );

  return [
    defineTool({
      name: "get-resume",
      title: "Read the resume",
      description:
        "Returns the resume currently in the editor as JSON, including the index of every employment and education entry. Call this before updating or removing an entry.",
      annotations: { readOnlyHint: true },
      execute: () => toolText(JSON.stringify(toAgentView(read()), null, 2)),
    }),

    defineTool<Partial<Pick<Resume, "name" | "wantedJob" | "city" | "phone" | "email">>>({
      name: "update-basic-info",
      title: "Update contact details",
      description:
        "Updates the header of the resume: the person's name, the job they are applying for, and their contact details. Only the fields you pass are changed.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name." },
          wantedJob: { type: "string", description: "The job title being applied for." },
          city: { type: "string", description: "City the person is based in." },
          phone: { type: "string" },
          email: { type: "string" },
        },
      },
      execute: (args) => {
        write((previous) => ({
          ...previous,
          name: args.name ?? previous.name,
          wantedJob: args.wantedJob ?? previous.wantedJob,
          city: args.city ?? previous.city,
          phone: args.phone ?? previous.phone,
          email: args.email ?? previous.email,
        }));

        const changed = Object.keys(args);

        return toolText(
          changed.length > 0
            ? `Updated ${changed.join(", ")}.`
            : "No fields were passed, so nothing changed.",
        );
      },
    }),

    defineTool<{ profile: string }>({
      name: "update-profile",
      title: "Write the profile summary",
      description:
        "Replaces the profile summary — the short paragraph at the top of the resume that pitches the candidate.",
      inputSchema: {
        type: "object",
        properties: {
          profile: { type: "string", description: "The full summary paragraph." },
        },
        required: ["profile"],
      },
      execute: ({ profile }) => {
        write((previous) => ({ ...previous, profile }));

        return toolText(`Profile summary set (${profile.length} characters).`);
      },
    }),

    defineTool<{ skills: string[] }>({
      name: "set-skills",
      title: "Set the skill list",
      description:
        "Replaces the entire skill list. Pass every skill that should appear, in the order they should be shown.",
      inputSchema: {
        type: "object",
        properties: {
          skills: {
            type: "array",
            items: { type: "string" },
            description: 'Skill names, e.g. ["TypeScript", "React"].',
          },
        },
        required: ["skills"],
      },
      execute: ({ skills }) => {
        write((previous) => ({ ...previous, skills: skills.map((name) => ({ name })) }));

        return toolText(`Skill list set to ${skills.length} skills: ${skills.join(", ")}.`);
      },
    }),

    defineTool<{ socialLinks: SocialLink[] }>({
      name: "set-social-links",
      title: "Set the social links",
      description:
        "Replaces the entire list of social links shown under the contact details (GitHub, LinkedIn, a personal site, and so on).",
      inputSchema: {
        type: "object",
        properties: {
          socialLinks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: 'Label, e.g. "GitHub".' },
                url: { type: "string", description: "Full URL including the scheme." },
              },
              required: ["name", "url"],
            },
          },
        },
        required: ["socialLinks"],
      },
      execute: ({ socialLinks }) => {
        write((previous) => ({ ...previous, socialLinks }));

        return toolText(
          `Social links set to: ${socialLinks.map((link) => link.name).join(", ") || "none"}.`,
        );
      },
    }),

    defineTool<{
      company: string;
      jobTitle: string;
      from: string;
      to?: string;
      bullets?: string[];
    }>({
      name: "add-employment",
      title: "Add a job",
      description:
        "Appends one job to the employment history. Describe the work as bullet points — each one becomes a separate bullet on the resume.",
      inputSchema: {
        type: "object",
        properties: {
          company: { type: "string" },
          jobTitle: { type: "string" },
          from: monthSchema("Month the job started."),
          to: monthSchema("Month the job ended."),
          bullets: {
            type: "array",
            items: { type: "string" },
            description: "One achievement or responsibility per item.",
          },
        },
        required: ["company", "jobTitle", "from"],
      },
      execute: ({ company, jobTitle, from, to, bullets }) => {
        const entry: EmploymentHistory = {
          company,
          jobTitle,
          timeline: { from: toIsoMonth(from), to: toIsoMonth(to) },
          description: toBulletText(bullets ?? []),
        };

        let index = 0;
        write((previous) => {
          index = previous.employmentHistory.length;

          return { ...previous, employmentHistory: [...previous.employmentHistory, entry] };
        });

        return toolText(
          `Added "${jobTitle} at ${company}" (${describeTimeline(entry.timeline)}) at index ${index}.`,
        );
      },
    }),

    defineTool<{
      index: number;
      company?: string;
      jobTitle?: string;
      from?: string;
      to?: string;
      bullets?: string[];
    }>({
      name: "update-employment",
      title: "Edit a job",
      description:
        "Updates one job already in the employment history. Get the index from get-resume. Only the fields you pass are changed; passing bullets replaces all of them.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "number", description: "Zero-based index from get-resume." },
          company: { type: "string" },
          jobTitle: { type: "string" },
          from: monthSchema("Month the job started."),
          to: monthSchema("Month the job ended."),
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["index"],
      },
      execute: ({ index, company, jobTitle, from, to, bullets }) => {
        const entries = read().employmentHistory;
        const current = entries[index];
        if (!current) return outOfRange("job", index, entries.length);

        const entry: EmploymentHistory = {
          company: company ?? current.company,
          jobTitle: jobTitle ?? current.jobTitle,
          timeline: {
            from: toIsoMonthOr(from, current.timeline.from),
            to: toIsoMonthOr(to, current.timeline.to),
          },
          description: bullets ? toBulletText(bullets) : current.description,
        };

        write((previous) => ({
          ...previous,
          employmentHistory: previous.employmentHistory.map((item, itemIndex) =>
            itemIndex === index ? entry : item,
          ),
        }));

        return toolText(
          `Updated the job at index ${index}: ${entry.jobTitle} at ${entry.company}.`,
        );
      },
    }),

    defineTool<{ index: number }>({
      name: "remove-employment",
      title: "Remove a job",
      description:
        "Deletes one job from the employment history. Get the index from get-resume — indexes shift after a removal, so re-read before removing another.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "number", description: "Zero-based index from get-resume." },
        },
        required: ["index"],
      },
      execute: ({ index }) => {
        const entries = read().employmentHistory;
        const current = entries[index];
        if (!current) return outOfRange("job", index, entries.length);

        write((previous) => ({
          ...previous,
          employmentHistory: previous.employmentHistory.filter(
            (_, itemIndex) => itemIndex !== index,
          ),
        }));

        return toolText(`Removed "${current.jobTitle} at ${current.company}".`);
      },
    }),

    defineTool<{ school: string; degree: string; major: string; from: string; to?: string }>({
      name: "add-education",
      title: "Add a school",
      description: "Appends one entry to the education section.",
      inputSchema: {
        type: "object",
        properties: {
          school: { type: "string" },
          degree: { type: "string", description: 'e.g. "Bachelor", "Master".' },
          major: { type: "string" },
          from: monthSchema("Month the studies started."),
          to: monthSchema("Month of graduation."),
        },
        required: ["school", "degree", "major", "from"],
      },
      execute: ({ school, degree, major, from, to }) => {
        const entry: Education = {
          school,
          degree,
          major,
          timeline: { from: toIsoMonth(from), to: toIsoMonth(to) },
        };

        let index = 0;
        write((previous) => {
          index = previous.educations.length;

          return { ...previous, educations: [...previous.educations, entry] };
        });

        return toolText(
          `Added "${degree} in ${major}, ${school}" (${describeTimeline(entry.timeline)}) at index ${index}.`,
        );
      },
    }),

    defineTool<{
      index: number;
      school?: string;
      degree?: string;
      major?: string;
      from?: string;
      to?: string;
    }>({
      name: "update-education",
      title: "Edit a school",
      description:
        "Updates one education entry. Get the index from get-resume. Only the fields you pass are changed.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "number", description: "Zero-based index from get-resume." },
          school: { type: "string" },
          degree: { type: "string" },
          major: { type: "string" },
          from: monthSchema("Month the studies started."),
          to: monthSchema("Month of graduation."),
        },
        required: ["index"],
      },
      execute: ({ index, school, degree, major, from, to }) => {
        const entries = read().educations;
        const current = entries[index];
        if (!current) return outOfRange("education entry", index, entries.length);

        const entry: Education = {
          school: school ?? current.school,
          degree: degree ?? current.degree,
          major: major ?? current.major,
          timeline: {
            from: toIsoMonthOr(from, current.timeline.from),
            to: toIsoMonthOr(to, current.timeline.to),
          },
        };

        write((previous) => ({
          ...previous,
          educations: previous.educations.map((item, itemIndex) =>
            itemIndex === index ? entry : item,
          ),
        }));

        return toolText(`Updated the education entry at index ${index}: ${entry.school}.`);
      },
    }),

    defineTool<{ index: number }>({
      name: "remove-education",
      title: "Remove a school",
      description:
        "Deletes one education entry. Get the index from get-resume — indexes shift after a removal.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "number", description: "Zero-based index from get-resume." },
        },
        required: ["index"],
      },
      execute: ({ index }) => {
        const entries = read().educations;
        const current = entries[index];
        if (!current) return outOfRange("education entry", index, entries.length);

        write((previous) => ({
          ...previous,
          educations: previous.educations.filter((_, itemIndex) => itemIndex !== index),
        }));

        return toolText(`Removed "${current.school}".`);
      },
    }),

    defineTool<{ section: keyof Visibility; visible: boolean }>({
      name: "set-section-visibility",
      title: "Show or hide a section",
      description:
        "Shows or hides a whole section in the resume preview and the exported PDF. The section's content is kept either way.",
      inputSchema: {
        type: "object",
        properties: {
          section: { type: "string", enum: [...SECTIONS] },
          visible: { type: "boolean" },
        },
        required: ["section", "visible"],
      },
      execute: ({ section, visible }) => {
        if (!SECTIONS.includes(section)) {
          return toolError(`Unknown section "${section}". Valid sections: ${SECTIONS.join(", ")}.`);
        }

        write((previous) => ({
          ...previous,
          visibility: { ...previous.visibility, [section]: visible },
        }));

        return toolText(`Section "${section}" is now ${visible ? "visible" : "hidden"}.`);
      },
    }),
  ];
};
