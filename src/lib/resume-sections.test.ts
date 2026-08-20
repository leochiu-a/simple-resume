import { describe, expect, it } from "vitest";

import { customSection, emptyResume } from "@/test/resume-fixture";
import { SECTION_IDS, SectionId } from "@/types/resume";

import {
  applySubsetOrder,
  customSectionsOf,
  isSectionVisible,
  resumeSectionOrder,
  sectionLabel,
  DEFAULT_SECTION_ORDER,
  MAIN_COLUMN_SECTIONS,
  normaliseSectionOrder,
  sectionsToRender,
} from "./resume-sections";

/**
 * The order every template asks for, and the three functions that decide it.
 *
 * None of the three can trust its input: the order arrives from local storage, a
 * share link, or an agent tool whose argument is a plain array of strings. What is
 * pinned here is that a bad one degrades — a section is never silently lost from
 * the sheet.
 */

describe("normaliseSectionOrder", () => {
  it("returns the default for anything that is not an array", () => {
    expect(normaliseSectionOrder(undefined)).toEqual(DEFAULT_SECTION_ORDER);
    expect(normaliseSectionOrder(null)).toEqual(DEFAULT_SECTION_ORDER);
    expect(normaliseSectionOrder("profile")).toEqual(DEFAULT_SECTION_ORDER);
    expect(normaliseSectionOrder({ 0: "profile" })).toEqual(DEFAULT_SECTION_ORDER);
    expect(normaliseSectionOrder([])).toEqual(DEFAULT_SECTION_ORDER);
  });

  it("keeps an order that is already valid", () => {
    const order: SectionId[] = [
      "employmentHistory",
      "profile",
      "skills",
      "projects",
      "socialLinks",
      "educations",
    ];

    expect(normaliseSectionOrder(order)).toEqual(order);
  });

  it("drops ids it does not know, including non-strings", () => {
    const order = ["employmentHistory", "certifications", 7, null, "profile"];

    expect(normaliseSectionOrder(order).slice(0, 2)).toEqual(["employmentHistory", "profile"]);
  });

  it("keeps the first position of a duplicated id", () => {
    const order = ["skills", "profile", "skills"];

    expect(normaliseSectionOrder(order).slice(0, 2)).toEqual(["skills", "profile"]);
  });

  it("appends what was left out, in the default order, rather than losing it", () => {
    // The failure that matters: a section added after this order was saved must
    // appear at the bottom of the sheet, not vanish from it.
    const stored = ["employmentHistory", "profile"];

    expect(normaliseSectionOrder(stored)).toEqual([
      "employmentHistory",
      "profile",
      "projects",
      "educations",
      "skills",
      "socialLinks",
    ]);
  });

  it("names every section exactly once, whatever it was given", () => {
    const inputs: unknown[] = [
      undefined,
      [],
      ["skills", "skills", "skills"],
      ["nope", "profile", 3],
      [...DEFAULT_SECTION_ORDER].reverse(),
    ];

    for (const input of inputs) {
      const result = normaliseSectionOrder(input);

      expect(result).toHaveLength(SECTION_IDS.length);
      expect(new Set(result).size).toBe(SECTION_IDS.length);
    }
  });
});

describe("sectionsToRender", () => {
  const resume = emptyResume({
    sectionOrder: [
      "skills",
      "employmentHistory",
      "profile",
      "projects",
      "educations",
      "socialLinks",
    ],
  });

  it("gives a template its own sections, in the order the user put them", () => {
    expect(sectionsToRender(resume, MAIN_COLUMN_SECTIONS)).toEqual([
      "employmentHistory",
      "profile",
      "projects",
      "educations",
    ]);
  });

  it("leaves out a hidden section, so a caller needs no guard of its own", () => {
    const hidden = { ...resume, visibility: { ...resume.visibility, projects: false } };

    expect(sectionsToRender(hidden, MAIN_COLUMN_SECTIONS)).not.toContain("projects");
  });

  it("renders every section a single-column template owns", () => {
    expect(sectionsToRender(resume, SECTION_IDS)).toEqual(resume.sectionOrder);
  });

  it("survives a stored order that is missing or malformed", () => {
    const broken = { ...resume, sectionOrder: ["nope", "profile"] as unknown as SectionId[] };

    expect(sectionsToRender(broken, MAIN_COLUMN_SECTIONS)).toEqual([
      "profile",
      "employmentHistory",
      "projects",
      "educations",
    ]);
  });
});

describe("applySubsetOrder", () => {
  it("writes a rearranged subset back into the slots it already occupied", () => {
    const full: SectionId[] = [
      "profile",
      "employmentHistory",
      "projects",
      "educations",
      "skills",
      "socialLinks",
    ];
    // The main column, reordered in the popover. Skills and links were not on offer.
    const subset: SectionId[] = ["employmentHistory", "educations", "profile", "projects"];

    expect(applySubsetOrder(full, subset)).toEqual([
      "employmentHistory",
      "educations",
      "profile",
      "projects",
      "skills",
      "socialLinks",
    ]);
  });

  it("leaves the sections the popover never showed where they were", () => {
    // Skills sits between two main-column sections: rebuilding the array from the
    // subset would push it to the end, and switching template would then find it
    // somewhere the user never put it.
    const full: SectionId[] = [
      "profile",
      "skills",
      "employmentHistory",
      "educations",
      "projects",
      "socialLinks",
    ];
    const subset: SectionId[] = ["employmentHistory", "profile", "educations", "projects"];
    const result = applySubsetOrder(full, subset);

    expect(result.indexOf("skills")).toBe(1);
    expect(result).toHaveLength(full.length);
  });

  it("is a no-op when nothing moved", () => {
    const full = [...DEFAULT_SECTION_ORDER];

    expect(
      applySubsetOrder(full, ["profile", "employmentHistory", "projects", "educations"]),
    ).toEqual(full);
  });
});

describe("custom sections in the order", () => {
  const certifications = customSection("a", "Certifications", ["AWS SAA"]);
  const awards = customSection("b", "Awards", ["Employee of the month"]);

  const resume = emptyResume({
    customSections: [certifications, awards],
    sectionOrder: ["profile", awards.id, "employmentHistory", certifications.id],
  });

  it("keeps a custom id the resume still has, where it was put", () => {
    const order = resumeSectionOrder(resume);

    expect(order.indexOf(awards.id)).toBe(1);
    expect(order).toContain(certifications.id);
    expect(order).toHaveLength(SECTION_IDS.length + 2);
  });

  it("drops a custom id naming a section that was deleted", () => {
    const deleted = { ...resume, customSections: [certifications] };

    expect(resumeSectionOrder(deleted)).not.toContain(awards.id);
    expect(resumeSectionOrder(deleted)).toContain(certifications.id);
  });

  it("appends a section the stored order has never seen, at the bottom", () => {
    const stored = { ...resume, sectionOrder: [...DEFAULT_SECTION_ORDER] };
    const order = resumeSectionOrder(stored);

    expect(order.slice(-2)).toEqual([certifications.id, awards.id]);
  });

  it("holds every section exactly once", () => {
    const order = resumeSectionOrder(resume);

    expect(new Set(order).size).toBe(order.length);
  });

  it("reads an older document, which has no custom sections at all, as before", () => {
    const older = emptyResume();
    Reflect.deleteProperty(older, "customSections");

    expect(customSectionsOf(older)).toEqual([]);
    expect(resumeSectionOrder(older)).toEqual(DEFAULT_SECTION_ORDER);
  });

  it("hands a custom section to every template, in the flow rather than a sidebar", () => {
    // A two-column template owns four of the six; a custom section is in that
    // column too, because no sidebar's design has a place for one.
    expect(sectionsToRender(resume, SECTION_IDS)).toContain(certifications.id);
    expect(sectionsToRender(resume, MAIN_COLUMN_SECTIONS)).toContain(certifications.id);
  });

  it("keeps it in the position the order put it in", () => {
    const rendered = sectionsToRender(resume, SECTION_IDS);

    expect(rendered.indexOf(awards.id)).toBeLessThan(rendered.indexOf("employmentHistory"));
  });

  it("leaves out one that is hidden", () => {
    const hidden = {
      ...resume,
      customSections: [{ ...certifications, visible: false }, awards],
    };

    expect(sectionsToRender(hidden, SECTION_IDS)).not.toContain(certifications.id);
  });

  it("leaves out one that has not been named — nothing can head it", () => {
    const unnamed = {
      ...resume,
      customSections: [{ ...certifications, title: "   " }, awards],
    };

    expect(sectionsToRender(unnamed, SECTION_IDS)).not.toContain(certifications.id);
    // Named, so still drawn: the rule is about the heading, not about the lines.
    expect(sectionsToRender(unnamed, SECTION_IDS)).toContain(awards.id);
  });
});

describe("sectionLabel and isSectionVisible", () => {
  const named = customSection("a", "Certifications", ["AWS SAA"]);
  const unnamed = customSection("b", "  ", ["A line"], false);
  const resume = emptyResume({ customSections: [named, unnamed] });

  it("names a built-in section with the label the form shows", () => {
    expect(sectionLabel(resume, "employmentHistory")).toBe("Employment History");
  });

  it("names a custom section with its own heading", () => {
    expect(sectionLabel(resume, named.id)).toBe("Certifications");
  });

  it("has something to call a section that has not been named yet", () => {
    expect(sectionLabel(resume, unnamed.id)).toBe("Untitled section");
  });

  it("reads a custom section's own flag rather than the visibility record", () => {
    expect(isSectionVisible(resume, named.id)).toBe(true);
    expect(isSectionVisible(resume, unnamed.id)).toBe(false);
  });

  it("treats an id nothing answers to as not on the sheet", () => {
    expect(isSectionVisible(resume, "custom:gone")).toBe(false);
  });
});
