import { UseFormReturn } from "react-hook-form";

import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { LANG_NAME_EN } from "@/lib/resume-doc";
import { buildAgentReport } from "@/lib/resume-score/agent-report";
import { AgentReview, MAX_REVIEW_NOTES, ReviewNote } from "@/lib/resume-score/review";
import { defineTool, toolError, toolText, WebMcpTool, WebMcpToolInit } from "@/lib/webmcp";
import { normaliseSectionOrder } from "@/lib/resume-sections";
import {
  Education,
  EmploymentHistory,
  Project,
  Resume,
  SECTION_IDS,
  SectionId,
  SocialLink,
  Timeline,
  Visibility,
} from "@/types/resume";
import { ResumeLang } from "@/types/resume-doc";

/** The same six the form and the templates work from, so a tool cannot drift from
 *  what the product actually has. */
const SECTIONS = SECTION_IDS;

/**
 * What the tools have to know about the multi-language document they are editing.
 * Read fresh on every call: all three change while the tools stay registered.
 */
export interface ResumeMcpContext {
  activeLang: ResumeLang;
  primaryLang: ResumeLang;
  /** False while the active locale is still an empty slot no translation has filled. */
  hasActiveLocale: boolean;
}

const monthSchema = (description: string) => ({
  type: "string",
  description: `${description} Format "YYYY-MM". Use an empty string for "Present".`,
});

/** The month picker stores full ISO dates but only ever renders month + year. */
const toIsoMonth = (value: string | undefined | null) => {
  const match = /^(\d{4})-(\d{2})/.exec((value ?? "").trim());

  return match ? `${match[1]}-${match[2]}-01` : "";
};

const toIsoMonthOr = (value: string | undefined, fallback: string | null) =>
  value === undefined ? fallback : toIsoMonth(value);

/** Ongoing entries are stored as `null`, which the agent sees as `""`. */
const toAgentMonth = (value: string | null) => (value ?? "").slice(0, 7);

/** Bullet lines live in one string joined by SPLIT_TEXT — see LabeledBulletTextAreaField. */
const toBulletText = (bullets: string[]) => bullets.join(SPLIT_TEXT);

const fromBulletText = (value: string) => value.split(SPLIT_TEXT);

/**
 * The stored shape is awkward to reason about — timelines are full ISO dates and
 * job descriptions are one delimited string — so the agent gets a flattened view
 * that matches the arguments the write tools accept, plus the entry indexes.
 *
 * The `language` block is the agent's only way to tell one locale from another:
 * the form holds a single `Resume`, so without it a Chinese resume and an English
 * translation of the same document are indistinguishable.
 */
const toAgentView = (resume: Resume, context: ResumeMcpContext) => ({
  language: {
    active: context.activeLang,
    primary: context.primaryLang,
    /** True when edits land in a translation rather than the source of truth. */
    isTranslation: context.activeLang !== context.primaryLang,
    /** False means this locale has not been created yet and cannot be written to. */
    exists: context.hasActiveLocale,
  },
  ...resume,
  /* Normalised on the way out, so what the agent reads back is always the six
     sections `set-section-layout` expects — not whatever an older release or a
     hand-edited storage entry happens to hold. */
  sectionOrder: normaliseSectionOrder(resume.sectionOrder),
  employmentHistory: resume.employmentHistory.map((job, index) => ({
    index,
    company: job.company,
    jobTitle: job.jobTitle,
    from: toAgentMonth(job.timeline.from),
    to: toAgentMonth(job.timeline.to),
    bullets: fromBulletText(job.description),
  })),
  educations: resume.educations.map((education, index) => ({
    index,
    school: education.school,
    degree: education.degree,
    major: education.major,
    from: toAgentMonth(education.timeline.from),
    to: toAgentMonth(education.timeline.to),
  })),
  projects: (resume.projects ?? []).map((project, index) => ({
    index,
    name: project.name,
    url: project.url,
    bullets: fromBulletText(project.description),
  })),
  skills: resume.skills.map((skill) => skill.name),
});

const describeTimeline = ({ from, to }: Timeline) =>
  `${toAgentMonth(from) || "?"} — ${toAgentMonth(to) || "Present"}`;

/**
 * The three sections that hold a list of entries, and so are edited by index
 * rather than replaced wholesale.
 *
 * They share one add/update/remove trio instead of having nine tools between
 * them: the three differ only in which fields an entry carries, and the loop an
 * agent runs — read indexes, edit one, re-read — is identical for all of them.
 * What is genuinely per-section lives in `ENTRY_SPECS` below, so the tools stay
 * a dispatch and the sections stay separable.
 *
 * Skills and social links are not here: they have no per-entry identity worth
 * an index, so `update-resume` replaces those lists outright.
 */
const ENTRY_SECTIONS = ["employmentHistory", "educations", "projects"] as const;

type EntrySection = (typeof ENTRY_SECTIONS)[number];

type Entry = EmploymentHistory | Education | Project;

/** Every field the entry tools accept, across all three sections. */
interface EntryArgs {
  section: EntrySection;
  index?: number;
  company?: string;
  jobTitle?: string;
  school?: string;
  degree?: string;
  major?: string;
  name?: string;
  url?: string;
  from?: string;
  to?: string;
  bullets?: string[];
}

type EntryField = Exclude<keyof EntryArgs, "section" | "index">;

interface EntrySpec<T extends Entry> {
  /** Used in results and in the out-of-range message. */
  label: string;
  /** What this section accepts. Anything else passed with it is rejected. */
  fields: readonly EntryField[];
  /** What `add-entry` insists on, since a new entry has nothing to fall back to. */
  required: readonly EntryField[];
  read: (resume: Resume) => T[];
  write: (resume: Resume, entries: T[]) => Resume;
  /** Builds the stored entry. With `current`, unpassed fields keep its values. */
  build: (args: EntryArgs, current?: T) => T;
  describe: (entry: T) => string;
}

/** Erases the entry type at the declaration site, as `defineTool` does for args. */
const defineEntry = <T extends Entry>(spec: EntrySpec<T>) => spec as unknown as EntrySpec<Entry>;

const ENTRY_SPECS: Record<EntrySection, EntrySpec<Entry>> = {
  employmentHistory: defineEntry<EmploymentHistory>({
    label: "job",
    fields: ["company", "jobTitle", "from", "to", "bullets"],
    required: ["company", "jobTitle", "from"],
    read: (resume) => resume.employmentHistory,
    write: (resume, employmentHistory) => ({ ...resume, employmentHistory }),
    build: (args, current) => ({
      company: args.company ?? current?.company ?? "",
      jobTitle: args.jobTitle ?? current?.jobTitle ?? "",
      timeline: {
        from: current ? toIsoMonthOr(args.from, current.timeline.from) : toIsoMonth(args.from),
        to: current ? toIsoMonthOr(args.to, current.timeline.to) : toIsoMonth(args.to),
      },
      description: args.bullets ? toBulletText(args.bullets) : (current?.description ?? ""),
    }),
    describe: (entry) =>
      `"${entry.jobTitle} at ${entry.company}" (${describeTimeline(entry.timeline)})`,
  }),

  educations: defineEntry<Education>({
    label: "education entry",
    fields: ["school", "degree", "major", "from", "to"],
    required: ["school", "degree", "major", "from"],
    read: (resume) => resume.educations,
    write: (resume, educations) => ({ ...resume, educations }),
    build: (args, current) => ({
      school: args.school ?? current?.school ?? "",
      degree: args.degree ?? current?.degree ?? "",
      major: args.major ?? current?.major ?? "",
      timeline: {
        from: current ? toIsoMonthOr(args.from, current.timeline.from) : toIsoMonth(args.from),
        to: current ? toIsoMonthOr(args.to, current.timeline.to) : toIsoMonth(args.to),
      },
    }),
    describe: (entry) =>
      `"${entry.degree} in ${entry.major}, ${entry.school}" (${describeTimeline(entry.timeline)})`,
  }),

  projects: defineEntry<Project>({
    label: "project",
    fields: ["name", "url", "bullets"],
    required: ["name"],
    /* `projects` is optional on older stored resumes, so every read defaults. */
    read: (resume) => resume.projects ?? [],
    write: (resume, projects) => ({ ...resume, projects }),
    build: (args, current) => ({
      name: args.name ?? current?.name ?? "",
      url: args.url ?? current?.url ?? "",
      description: args.bullets ? toBulletText(args.bullets) : (current?.description ?? ""),
    }),
    describe: (entry) => `"${entry.name}"`,
  }),
};

/**
 * One flat schema covering all three sections rather than a discriminated union.
 *
 * A union would be more precise, but models handle `anyOf` over a discriminator
 * poorly, and the price of the flat shape is only that a wrong field reaches
 * `execute` — where `rejectStrayFields` names it and the section it belongs to,
 * which is a better error than a schema violation would have produced anyway.
 */
const ENTRY_FIELD_SCHEMA = {
  company: { type: "string", description: "employmentHistory: the employer." },
  jobTitle: {
    type: "string",
    description: "employmentHistory: the role held.",
  },
  school: { type: "string", description: "educations: the institution." },
  degree: {
    type: "string",
    description: 'educations: e.g. "Bachelor", "Master".',
  },
  major: { type: "string", description: "educations: the field of study." },
  name: { type: "string", description: "projects: the project's name." },
  url: { type: "string", description: "projects: a repo, a demo, a write-up." },
  from: monthSchema("employmentHistory, educations: month this started."),
  to: monthSchema("employmentHistory, educations: month this ended."),
  bullets: {
    type: "array",
    items: { type: "string" },
    description:
      "employmentHistory, projects: one achievement or line per item, each rendered as its own bullet.",
  },
};

const SECTION_FIELD_LIST = ENTRY_SECTIONS.map(
  (section) => `${section} takes ${ENTRY_SPECS[section].fields.join(", ")}`,
).join("; ");

/**
 * Builds the tool set the agent uses to fill in the resume.
 *
 * Every mutation goes through `form.reset` rather than `setValue`: the section
 * lists are rendered by `useFieldArray`, which keeps its own copy of the rows
 * and does not pick up a `setValue` on the whole array. `reset` re-seeds the
 * field arrays (and remounts the contentEditable bullet fields, which only read
 * their value on mount), so agent edits show up in the form and the preview.
 */
export const createResumeTools = (
  getForm: () => UseFormReturn<Resume>,
  getContext: () => ResumeMcpContext,
  submitReview: (review: AgentReview) => void,
): WebMcpTool[] => {
  const read = () => getForm().getValues();

  const write = (update: (previous: Resume) => Resume) => {
    const form = getForm();
    form.reset(update(form.getValues()));
  };

  /**
   * Wraps every mutating tool in the two things the multi-language document adds.
   *
   * A write lands in whichever locale the editor is showing, and that locale may
   * not exist yet: until the translation panel creates it, `useResumeDoc` drops
   * every save, so the form would accept the write and storage would ignore it.
   * Reporting success there is the one lie the tool set can tell, so the write is
   * refused instead.
   *
   * When the active locale does exist but is a translation the write is allowed —
   * hand-correcting a translation is what that locale is for — and the result says
   * where it landed, because those edits never travel back to the primary.
   */
  const defineWriteTool = <Args>(tool: WebMcpToolInit<Args>) =>
    defineTool<Args>({
      ...tool,
      execute: async (args) => {
        const { activeLang, primaryLang, hasActiveLocale } = getContext();

        if (!hasActiveLocale) {
          return toolError(
            `There is no ${LANG_NAME_EN[activeLang]} version of this resume yet, so nothing can be written to it. Ask the user to create it from the translation panel, or to switch the editor back to ${LANG_NAME_EN[primaryLang]}.`,
          );
        }

        const result = await tool.execute(args);
        if (result.isError || activeLang === primaryLang) return result;

        return {
          ...result,
          content: [
            ...result.content,
            {
              type: "text" as const,
              text: `This landed in the ${LANG_NAME_EN[activeLang]} translation, not the primary ${LANG_NAME_EN[primaryLang]} version: the edited fields are now marked as hand-corrected and will not flow back to the primary.`,
            },
          ],
        };
      },
    });

  const outOfRange = (label: string, index: number, length: number) =>
    toolError(
      `No ${label} at index ${index}. There ${length === 1 ? "is" : "are"} ${length} entr${
        length === 1 ? "y" : "ies"
      }, so valid indexes are 0–${length - 1}.`,
    );

  const unknownSection = (section: string, valid: readonly string[]) =>
    toolError(`Unknown section "${section}". Valid sections: ${valid.join(", ")}.`);

  /**
   * The flat entry schema lets `school` reach `add-entry` on a project, which
   * would otherwise be dropped in silence — the agent would read its entry back
   * missing the field it just passed and have no idea why. Naming the section
   * each stray field does belong to turns that into a one-call correction.
   */
  const rejectStrayFields = (section: EntrySection, args: EntryArgs) => {
    const accepted = ENTRY_SPECS[section].fields;
    const stray = (Object.keys(args) as (keyof EntryArgs)[]).filter(
      (key) =>
        key !== "section" &&
        key !== "index" &&
        args[key] !== undefined &&
        !accepted.includes(key as EntryField),
    );

    if (stray.length === 0) return undefined;

    return toolError(
      `${stray.map((key) => `"${key}"`).join(", ")} ${stray.length > 1 ? "are not fields" : "is not a field"} of ${section}, which takes ${accepted.join(", ")}. ${SECTION_FIELD_LIST}.`,
    );
  };

  return [
    defineTool({
      name: "get-resume",
      title: "Read the resume",
      description:
        "Returns the resume currently in the editor as JSON, including the index of every employment and education entry. Also reports which language the editor is showing, whether that language is a translation of the primary version, and whether it exists yet — writes are refused while it does not. Call this before updating or removing an entry.",
      annotations: { readOnlyHint: true },
      execute: () => toolText(JSON.stringify(toAgentView(read(), getContext()), null, 2)),
    }),

    /*
      The one tool here that answers "is this resume any good" rather than "what
      does it say". Without it an agent writing a resume has no feedback: it
      calls get-resume, reads its own prose back, and has to decide from taste
      alone whether to keep going. Scoring gives it a signal it can re-measure,
      so "keep editing until this stops improving" becomes a condition it can
      actually check rather than a feeling.

      Read-only, and deliberately not wrapped in `defineWriteTool`: it mutates
      nothing, so it should be free to call between every edit — which is the
      loop it exists to support.
    */
    defineTool({
      name: "score-resume",
      title: "Score the resume",
      description:
        "Grades the resume in the editor against twelve rules — quantified results, action verbs, bullet and overall length, section completeness, contact details — and returns the score out of 100 with every failing check, what it is worth, and the exact entry and bullet indexes the check is complaining about. Those indexes are the same ones get-resume reports. Runs entirely in the browser and changes nothing, so it is safe to call after each edit to see whether the score moved. Reports findings only; deciding what to do about them is yours.",
      annotations: { readOnlyHint: true },
      execute: () =>
        toolText(JSON.stringify(buildAgentReport(read(), getContext().activeLang), null, 2)),
    }),

    /*
      The counterpart to `score-resume`, and the one tool that carries judgement
      rather than measurement.

      `score-resume` is exact about shape and blind to meaning: "Increased
      synergy by 200%" satisfies every rule and says nothing, and no word list
      separates 管理團隊 from 管理層. That is the gap this fills — an agent reads
      the content and writes its notes back into the panel.

      It carries no score, and that is the point. The header number is a property
      of the resume: same document, same 55, computed from fixed weights whether
      or not an agent ever visits. A model-supplied number would make it a
      property of one conversation instead — different on every run, absent for
      the visitors who have no agent at all, and unable to move as you type.
      Notes compose with the rules; a second, rival score would not.

      Not wrapped in `defineWriteTool`: that guard exists because writes land in
      whichever locale is showing and a missing translation would silently
      swallow them. A review is commentary held in memory for this session, not
      a document edit, so neither concern applies.
    */
    defineTool<{ summary?: string; notes?: unknown }>({
      name: "submit-review",
      title: "Submit a review of the resume",
      description:
        "Publishes your qualitative review of the resume into the editor's score panel, where the user sees it under a heading that credits it to their assistant. Use it for the judgements the rules cannot make: whether a bullet is specific enough to survive a follow-up question, whether a claim is vague or unsupported, whether the profile matches the target job. Each note may point at a section and entry index — the same indexes get-resume reports — and may carry a suggested rewrite. Submitting replaces any previous review. This does not change the resume and does not affect the score, which stays rule-based; call the update tools separately if the user wants a suggestion applied.",
      inputSchema: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "One or two sentences on the resume as a whole.",
          },
          notes: {
            type: "array",
            description: `Specific observations, at most ${MAX_REVIEW_NOTES}.`,
            items: {
              type: "object",
              properties: {
                comment: { type: "string", description: "What is wrong or worth changing." },
                section: {
                  type: "string",
                  enum: ["employmentHistory", "projects", "profile", "skills"],
                  description: "Where this applies. Omit for a whole-document note.",
                },
                entryIndex: { type: "number", description: "Zero-based index from get-resume." },
                bulletIndex: { type: "number", description: "Zero-based index within the entry." },
                quote: { type: "string", description: "The text being commented on." },
                suggestion: {
                  type: "string",
                  description: "A concrete replacement, if you have one.",
                },
              },
              required: ["comment"],
            },
          },
        },
        required: ["summary"],
      },
      execute: ({ summary, notes }) => {
        /* Arguments arrive as untrusted JSON that only nominally matches the
           schema above — see `WebMcpTool`. Everything below narrows it rather
           than trusting it, because these strings are rendered into the panel. */
        const text = typeof summary === "string" ? summary.trim() : "";
        if (text === "") {
          return toolError("A review needs a summary: one or two sentences on the resume overall.");
        }

        const rawNotes = Array.isArray(notes) ? notes : [];
        const clean: ReviewNote[] = [];

        for (const item of rawNotes) {
          if (typeof item !== "object" || item === null) continue;

          const note = item as Record<string, unknown>;
          const comment = typeof note.comment === "string" ? note.comment.trim() : "";
          if (comment === "") continue;

          const section = note.section;
          const asIndex = (value: unknown) =>
            typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
          const asText = (value: unknown) =>
            typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

          clean.push({
            comment,
            section:
              section === "employmentHistory" ||
              section === "projects" ||
              section === "profile" ||
              section === "skills"
                ? section
                : undefined,
            entryIndex: asIndex(note.entryIndex),
            bulletIndex: asIndex(note.bulletIndex),
            quote: asText(note.quote),
            suggestion: asText(note.suggestion),
          });
        }

        // Capped so one submission cannot turn the drawer into an endless scroll.
        const kept = clean.slice(0, MAX_REVIEW_NOTES);
        const dropped = clean.length - kept.length;

        submitReview({ summary: text, notes: kept, submittedAt: Date.now() });

        return toolText(
          `Review published to the score panel: ${kept.length} ${
            kept.length === 1 ? "note" : "notes"
          }.${dropped > 0 ? ` ${dropped} beyond the ${MAX_REVIEW_NOTES}-note limit were dropped.` : ""} The user can see it under "From your assistant". The score itself is unchanged — it stays rule-based.`,
        );
      },
    }),

    /*
      Everything on the resume that is not an indexed list: the header, the
      profile paragraph, and the two flat lists.

      One tool rather than four because the agent's decision is the same for all
      of them — "set this field to that" — and splitting it only made the agent
      pick a tool name before it could act. The two list fields keep replace
      semantics, which the schema says outright, since a patch that appended
      would leave no way to remove a skill.
    */
    defineWriteTool<{
      name?: string;
      wantedJob?: string;
      city?: string;
      phone?: string;
      email?: string;
      profile?: string;
      skills?: string[];
      socialLinks?: SocialLink[];
    }>({
      name: "update-resume",
      title: "Update the resume's fields",
      description:
        "Updates the parts of the resume that are single fields rather than lists of entries: the header (name, target job, contact details), the profile summary, the skill list and the social links. Only the fields you pass are changed, so this is safe to call with one field. Note that skills and socialLinks replace their whole list — pass every item that should appear, in display order. For jobs, schools and projects use add-entry, update-entry and remove-entry instead.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name." },
          wantedJob: {
            type: "string",
            description: "The job title being applied for.",
          },
          city: { type: "string", description: "City the person is based in." },
          phone: { type: "string" },
          email: { type: "string" },
          profile: {
            type: "string",
            description:
              "The whole summary paragraph at the top of the resume. Replaces the existing one.",
          },
          skills: {
            type: "array",
            items: { type: "string" },
            description:
              'Replaces the entire skill list, in display order, e.g. ["TypeScript", "React"].',
          },
          socialLinks: {
            type: "array",
            description: "Replaces the entire list of links shown under the contact details.",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: 'Label, e.g. "GitHub".' },
                url: {
                  type: "string",
                  description: "Full URL including the scheme.",
                },
              },
              required: ["name", "url"],
            },
          },
        },
      },
      execute: (args) => {
        const changed = (Object.keys(args) as (keyof typeof args)[]).filter(
          (key) => args[key] !== undefined,
        );

        if (changed.length === 0) {
          return toolError(
            "No fields were passed, so there is nothing to update. Pass at least one of name, wantedJob, city, phone, email, profile, skills or socialLinks.",
          );
        }

        write((previous) => ({
          ...previous,
          name: args.name ?? previous.name,
          wantedJob: args.wantedJob ?? previous.wantedJob,
          city: args.city ?? previous.city,
          phone: args.phone ?? previous.phone,
          email: args.email ?? previous.email,
          profile: args.profile ?? previous.profile,
          skills: args.skills ? args.skills.map((name) => ({ name })) : previous.skills,
          socialLinks: args.socialLinks ?? previous.socialLinks,
        }));

        /* The list fields report their new contents: they replaced rather than
           patched, so "updated skills" alone would not say what survived. */
        const detail = [
          args.skills && `skills are now ${args.skills.join(", ") || "empty"}`,
          args.socialLinks &&
            `social links are now ${args.socialLinks.map((link) => link.name).join(", ") || "empty"}`,
        ].filter(Boolean);

        return toolText(
          `Updated ${changed.join(", ")}.${detail.length > 0 ? ` ${detail.join("; ")}.` : ""}`,
        );
      },
    }),

    /*
      One trio for all three list sections, dispatched on `section`.

      The nine tools this replaces differed only in which fields an entry
      carries — the index handling, the out-of-range error and the re-read rule
      were copied three times over. `ENTRY_SPECS` holds the part that is really
      per-section, so adding a fourth list section is a spec, not three tools.
    */
    defineWriteTool<EntryArgs>({
      name: "add-entry",
      title: "Add a job, school or project",
      description: `Appends one entry to a list section of the resume. Which fields you pass depends on the section: ${SECTION_FIELD_LIST}. Returns the index the entry landed at, which update-entry and remove-entry take. For the header, profile, skills or social links use update-resume instead.`,
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: [...ENTRY_SECTIONS],
            description: "Which list to append to.",
          },
          ...ENTRY_FIELD_SCHEMA,
        },
        required: ["section"],
      },
      execute: (args) => {
        const spec = ENTRY_SPECS[args.section];
        if (!spec) return unknownSection(args.section, ENTRY_SECTIONS);

        const stray = rejectStrayFields(args.section, args);
        if (stray) return stray;

        /* Checked here rather than in `required` on the schema, because what is
           required depends on the section and the flat schema cannot say so. */
        const missing = spec.required.filter((field) => args[field] === undefined);
        if (missing.length > 0) {
          return toolError(
            `A new ${spec.label} needs ${missing.join(", ")}. ${args.section} takes ${spec.fields.join(", ")}.`,
          );
        }

        const entry = spec.build(args);

        let index = 0;
        write((previous) => {
          const entries = spec.read(previous);
          index = entries.length;

          return spec.write(previous, [...entries, entry]);
        });

        return toolText(`Added the ${spec.label} ${spec.describe(entry)} at index ${index}.`);
      },
    }),

    defineWriteTool<EntryArgs & { index: number }>({
      name: "update-entry",
      title: "Edit a job, school or project",
      description: `Updates one entry already in a list section. Get the index from get-resume. Only the fields you pass are changed, except bullets, which replaces every bullet on the entry. Which fields apply depends on the section: ${SECTION_FIELD_LIST}.`,
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: [...ENTRY_SECTIONS],
            description: "Which list the entry is in.",
          },
          index: {
            type: "number",
            description: "Zero-based index from get-resume.",
          },
          ...ENTRY_FIELD_SCHEMA,
        },
        required: ["section", "index"],
      },
      execute: (args) => {
        const spec = ENTRY_SPECS[args.section];
        if (!spec) return unknownSection(args.section, ENTRY_SECTIONS);

        const stray = rejectStrayFields(args.section, args);
        if (stray) return stray;

        const { index } = args;
        const entries = spec.read(read());
        const current = entries[index];
        if (!current) return outOfRange(spec.label, index, entries.length);

        const entry = spec.build(args, current);

        write((previous) =>
          spec.write(
            previous,
            spec.read(previous).map((item, itemIndex) => (itemIndex === index ? entry : item)),
          ),
        );

        return toolText(`Updated the ${spec.label} at index ${index}: ${spec.describe(entry)}.`);
      },
    }),

    defineWriteTool<{ section: EntrySection; index: number }>({
      name: "remove-entry",
      title: "Remove a job, school or project",
      description:
        "Deletes one entry from a list section. Get the index from get-resume — indexes shift after a removal, so re-read before removing another.",
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: [...ENTRY_SECTIONS],
            description: "Which list the entry is in.",
          },
          index: {
            type: "number",
            description: "Zero-based index from get-resume.",
          },
        },
        required: ["section", "index"],
      },
      execute: ({ section, index }) => {
        const spec = ENTRY_SPECS[section];
        if (!spec) return unknownSection(section, ENTRY_SECTIONS);

        const entries = spec.read(read());
        const current = entries[index];
        if (!current) return outOfRange(spec.label, index, entries.length);

        write((previous) =>
          spec.write(
            previous,
            spec.read(previous).filter((_, itemIndex) => itemIndex !== index),
          ),
        );

        return toolText(`Removed the ${spec.label} ${spec.describe(current)}.`);
      },
    }),

    /*
      Order and visibility are one tool because they are one decision. "Lead
      with education and drop the links" was two calls that both rewrote the
      shape of the sheet, and an agent that made only the first left the resume
      in a state it had not intended.
    */
    defineWriteTool<{ order?: SectionId[]; visibility?: Partial<Visibility> }>({
      name: "set-section-layout",
      title: "Reorder or hide sections",
      description:
        "Sets how the sections are laid out: the order they run in, top to bottom, and which of them are shown. Pass either or both. Sections left out of `order` keep their relative position behind the ones named, so promoting one section only needs that one named. Hiding keeps the section's content — it is a toggle, not a delete. Two-column templates draw skills and links in a sidebar and ignore their position in the order, though it is still recorded and applies on a single-column template.",
      inputSchema: {
        type: "object",
        properties: {
          order: {
            type: "array",
            items: { type: "string", enum: [...SECTIONS] },
            description: "Section ids, in the order they should appear. May be partial.",
          },
          visibility: {
            type: "object",
            description: "Per-section show/hide. Only the sections you name change.",
            properties: Object.fromEntries(
              SECTIONS.map((id) => [id, { type: "boolean" }] as const),
            ),
          },
        },
      },
      execute: ({ order, visibility }) => {
        if (order === undefined && visibility === undefined) {
          return toolError(
            `Pass "order", "visibility" or both. Valid sections: ${SECTIONS.join(", ")}.`,
          );
        }

        const unknown = [...(order ?? []), ...Object.keys(visibility ?? {})].filter(
          (id) => !SECTIONS.includes(id as SectionId),
        );

        if (unknown.length > 0) {
          return toolError(
            `Unknown section${unknown.length > 1 ? "s" : ""} ${unknown.map((id) => `"${id}"`).join(", ")}. Valid sections: ${SECTIONS.join(", ")}.`,
          );
        }

        // Normalised rather than written through: a partial list is the useful way
        // to call this, and it is what keeps the six-section invariant the
        // templates rely on from depending on the agent getting it right.
        const next = order ? normaliseSectionOrder(order) : undefined;

        write((previous) => ({
          ...previous,
          sectionOrder: next ?? previous.sectionOrder,
          visibility: visibility ? { ...previous.visibility, ...visibility } : previous.visibility,
        }));

        const said = [
          next && `Sections are now ordered: ${next.join(", ")}`,
          visibility &&
            `Now ${Object.entries(visibility)
              .map(([id, shown]) => `${id} is ${shown ? "visible" : "hidden"}`)
              .join(", ")}`,
        ].filter(Boolean);

        return toolText(`${said.join(". ")}.`);
      },
    }),
  ];
};
