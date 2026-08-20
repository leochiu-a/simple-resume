import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { customSection, emptyResume, jobWith } from "@/test/resume-fixture";
import { Resume } from "@/types/resume";

import { TEMPLATES } from "./registry";

/**
 * Every template, drawing a section the user named.
 *
 * Rendered here rather than in Playwright because there are eight of them times
 * two outputs, and the question — does this template draw the section at all, in
 * the right place — is answered by the tree the preview and the PDF are both
 * built from. `renderToStaticMarkup` produces exactly that tree: it is what the
 * preview puts in its iframe, and what @react-pdf paginates.
 *
 * What still belongs to Playwright is how it *looks* on a real page — the
 * spacing, the page breaks, the fonts.
 */

const certifications = customSection("a", "Certifications", [
  "AWS Solutions Architect",
  "Certified Kubernetes Administrator",
]);

const withCustom = (overrides: Partial<Resume> = {}): Resume =>
  emptyResume({
    name: "Ada Lovelace",
    wantedJob: "Staff Engineer",
    employmentHistory: [jobWith("Acme", "Cut build time by 40%")],
    skills: [{ name: "TypeScript" }],
    customSections: [certifications],
    sectionOrder: [
      "profile",
      "employmentHistory",
      certifications.id,
      "projects",
      "educations",
      "skills",
      "socialLinks",
    ],
    ...overrides,
  });

const outputs = (resume: Resume) =>
  TEMPLATES.map((template) => ({
    id: template.id,
    /** False on the two-column templates, which draw Skills in their sidebar. */
    ordersSkills: template.orderedSections.includes("skills"),
    /* The preview's tree and the PDF's are the same one; the export is a second
       renderer over the same resume, and the two must not disagree. */
    tree: renderToStaticMarkup(template.render({ resume, backgroundColor: "#336699" })),
    exported: template.buildHtml({ resume, backgroundColor: "#336699" }),
  }));

describe.each(outputs(withCustom()))("$id", ({ tree, exported, ordersSkills }) => {
  it("draws the heading the user gave the section", () => {
    expect(tree).toContain("Certifications");
    expect(exported).toContain("Certifications");
  });

  it("draws every line of it", () => {
    for (const line of ["AWS Solutions Architect", "Certified Kubernetes Administrator"]) {
      expect(tree).toContain(line);
      expect(exported).toContain(line);
    }
  });

  it("puts it where the order puts it, after Employment", () => {
    for (const output of [tree, exported]) {
      expect(output.indexOf("Cut build time by 40%")).toBeLessThan(
        output.indexOf("Certifications"),
      );
    }
  });

  it("comes before Skills on a template that lays Skills out in the flow", () => {
    /* On a two-column template Skills is in the sidebar, which is drawn before
       the main column whatever the order says — so there is nothing to compare. */
    if (!ordersSkills) return;

    for (const output of [tree, exported]) {
      expect(output.indexOf("Certifications")).toBeLessThan(output.indexOf("TypeScript"));
    }
  });
});

describe("what a template must not draw", () => {
  const drawsNothing = (resume: Resume) => {
    for (const { id, tree, exported } of outputs(resume)) {
      expect(tree, id).not.toContain("Certifications");
      expect(tree, id).not.toContain("AWS Solutions Architect");
      expect(exported, id).not.toContain("Certifications");
      expect(exported, id).not.toContain("AWS Solutions Architect");
    }
  };

  it("leaves out a hidden section", () => {
    drawsNothing(withCustom({ customSections: [{ ...certifications, visible: false }] }));
  });

  it("leaves out one that has not been named, lines and all", () => {
    drawsNothing(withCustom({ customSections: [{ ...certifications, title: "  " }] }));
  });

  it("survives an order naming a section the resume no longer has", () => {
    const orphaned = withCustom({ customSections: [] });

    expect(() => outputs(orphaned)).not.toThrow();
    drawsNothing(orphaned);
  });
});
