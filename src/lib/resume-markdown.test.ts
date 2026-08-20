import { describe, expect, it } from "vitest";

import { emptyResume, jobWith, projectWith } from "@/test/resume-fixture";
import { Resume } from "@/types/resume";

import { buildResumeMarkdown } from "./resume-markdown";

/**
 * The export for "here is my resume, tailor it to this job".
 *
 * What is pinned here is the promise the README makes about it: it follows the
 * preview rather than the storage shape. Hidden sections are absent, empty fields
 * never become empty headings, and the dates read the way the sheet reads them.
 */

const dated = (from: string | null, to: string | null) => ({ from, to });

describe("what the reader sees", () => {
  const resume = emptyResume({
    name: "Ada Lovelace",
    wantedJob: "Staff Engineer",
    city: "Taipei",
    phone: "0900000000",
    email: "ada@example.com",
    profile: "Ten years of frontend work.",
    skills: [{ name: "TypeScript" }, { name: "React" }],
    socialLinks: [{ name: "GitHub", url: "https://github.com/ada" }],
    employmentHistory: [
      {
        ...jobWith("Acme", "Cut build time by 40%", "Rebuilt the scheduler"),
        jobTitle: "Staff Engineer",
        timeline: dated("2018-01-01", "2020-01-01"),
      },
    ],
    educations: [
      {
        school: "NTU",
        degree: "BSc",
        major: "Computer Science",
        timeline: dated("2010-09-01", "2014-06-01"),
      },
    ],
  });
  const markdown = buildResumeMarkdown(resume);

  it("opens on the name as the one h1", () => {
    expect(markdown.startsWith("# Ada Lovelace\n")).toBe(true);
    expect(markdown.match(/^# /gm)).toHaveLength(1);
  });

  it("joins the contact details into one line", () => {
    expect(markdown).toContain("Taipei · 0900000000 · ada@example.com");
  });

  it("writes a social link as a Markdown link", () => {
    expect(markdown).toContain("[GitHub](https://github.com/ada)");
  });

  it("writes a date range as month and year", () => {
    expect(markdown).toContain("Jan 2018 — Jan 2020");
  });

  it("turns the description into a list", () => {
    expect(markdown).toContain("- Cut build time by 40%");
    expect(markdown).toContain("- Rebuilt the scheduler");
  });

  it("titles an entry with its role and company", () => {
    expect(markdown).toContain("### Staff Engineer — Acme");
  });

  it("ends with exactly one newline", () => {
    expect(markdown.endsWith("\n")).toBe(true);
    expect(markdown.endsWith("\n\n")).toBe(false);
  });
});

describe("dates", () => {
  const withTimeline = (timeline: { from: string | null; to: string | null }) =>
    buildResumeMarkdown(
      emptyResume({ employmentHistory: [{ ...jobWith("Acme", "A line"), timeline }] }),
    );

  it("reads an ongoing entry as Present", () => {
    expect(withTimeline(dated("2020-03-01", null))).toContain("Mar 2020 — Present");
  });

  it("prints no date line at all when neither end is set", () => {
    expect(withTimeline(dated(null, null))).not.toContain("—");
  });

  it("marks a missing start rather than dropping the end", () => {
    expect(withTimeline(dated(null, "2020-01-01"))).toContain("? — Jan 2020");
  });

  it("ignores a date it cannot parse instead of printing Invalid Date", () => {
    const markdown = withTimeline(dated("not-a-date", "2020-01-01"));

    expect(markdown).not.toContain("Invalid");
    expect(markdown).toContain("? — Jan 2020");
  });
});

describe("hidden sections", () => {
  const full = emptyResume({
    name: "Ada Lovelace",
    profile: "Ten years of frontend work.",
    skills: [{ name: "TypeScript" }],
    socialLinks: [{ name: "GitHub", url: "https://github.com/ada" }],
    employmentHistory: [jobWith("Acme", "Cut build time by 40%")],
    projects: [projectWith("Side thing", "https://example.com", "Built a thing")],
    educations: [{ school: "NTU", degree: "BSc", major: "CS", timeline: dated(null, null) }],
  });

  const hiding = (section: keyof Resume["visibility"]) =>
    buildResumeMarkdown({ ...full, visibility: { ...full.visibility, [section]: false } });

  it("leaves out a hidden section, heading and all", () => {
    expect(hiding("skills")).not.toContain("## Skills");
    expect(hiding("projects")).not.toContain("## Projects");
    expect(hiding("educations")).not.toContain("## Education");
    expect(hiding("employmentHistory")).not.toContain("## Employment History");
    expect(hiding("profile")).not.toContain("## Profile");
  });

  it("leaves out the social line with Links hidden, without touching the contact line", () => {
    const markdown = buildResumeMarkdown({
      ...full,
      city: "Taipei",
      visibility: { ...full.visibility, socialLinks: false },
    });

    expect(markdown).not.toContain("github.com/ada");
    expect(markdown).toContain("Taipei");
  });

  it("keeps every other section when one is hidden", () => {
    expect(hiding("skills")).toContain("## Employment History");
  });
});

describe("empty fields", () => {
  it("produces no headings at all for an untouched resume", () => {
    const markdown = buildResumeMarkdown(emptyResume());

    expect(markdown.trim()).toBe("");
  });

  it("prints no section heading for a section with nothing in it", () => {
    const resume = emptyResume({ name: "Ada Lovelace", skills: [{ name: "  " }] });

    expect(buildResumeMarkdown(resume)).not.toContain("## Skills");
  });

  it("drops a blank bullet rather than printing an empty list item", () => {
    const resume = emptyResume({ employmentHistory: [jobWith("Acme", "A real line", "  ", "")] });
    const markdown = buildResumeMarkdown(resume);

    expect(markdown).toContain("- A real line");
    expect(markdown.match(/^- /gm)).toHaveLength(1);
  });

  it("titles an entry with whichever half of the heading was filled in", () => {
    const resume = emptyResume({
      employmentHistory: [{ ...jobWith("Acme", "A line"), jobTitle: "" }],
    });

    expect(buildResumeMarkdown(resume)).toContain("### Acme");
  });

  it("survives a project that arrived without a url or description", () => {
    const resume = emptyResume({ projects: [{ name: "Side thing" } as never] });

    expect(() => buildResumeMarkdown(resume)).not.toThrow();
    expect(buildResumeMarkdown(resume)).toContain("### Side thing");
  });

  it("survives a document with no projects array at all", () => {
    const resume = emptyResume();
    Reflect.deleteProperty(resume, "projects");

    expect(() => buildResumeMarkdown(resume)).not.toThrow();
  });
});

describe("projects", () => {
  it("carries the link on the name, so the URL is never printed twice", () => {
    const resume = emptyResume({
      projects: [projectWith("Side thing", "https://example.com", "Built a thing")],
    });
    const markdown = buildResumeMarkdown(resume);

    expect(markdown).toContain("### [Side thing](https://example.com)");
    expect(markdown.match(/https:\/\/example\.com/g)).toHaveLength(1);
  });

  it("falls back to the bare URL when the project has no name", () => {
    const resume = emptyResume({ projects: [projectWith("", "https://example.com", "A line")] });

    expect(buildResumeMarkdown(resume)).toContain("### https://example.com");
  });
});

describe("section order", () => {
  /*
    Pinning what the builder does today, which is not what the sheet does: the
    order here is fixed, while every template renders `resume.sectionOrder`. A
    resume whose owner moved Skills above Employment gets one order on the page
    and another on the clipboard.

    Left as a pin rather than fixed here, because changing it is a change to the
    export rather than to its tests.
  */
  it("emits a fixed order, ignoring the order the sections are in on the sheet", () => {
    const resume = emptyResume({
      name: "Ada Lovelace",
      skills: [{ name: "TypeScript" }],
      employmentHistory: [jobWith("Acme", "A line")],
      sectionOrder: [
        "skills",
        "employmentHistory",
        "profile",
        "projects",
        "educations",
        "socialLinks",
      ],
    });
    const markdown = buildResumeMarkdown(resume);

    expect(markdown.indexOf("## Skills")).toBeLessThan(markdown.indexOf("## Employment History"));

    const reordered = buildResumeMarkdown({
      ...resume,
      sectionOrder: [
        "employmentHistory",
        "skills",
        "profile",
        "projects",
        "educations",
        "socialLinks",
      ],
    });

    // The same output for a different order — the bug this pin records.
    expect(reordered).toBe(markdown);
  });
});
