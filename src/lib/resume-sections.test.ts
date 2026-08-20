import { describe, expect, it } from "vitest";

import { emptyResume } from "@/test/resume-fixture";
import { SECTION_IDS, SectionId } from "@/types/resume";

import {
  applySubsetOrder,
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
