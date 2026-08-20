import { describe, expect, it } from "vitest";

import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import { toBulletLines } from "./bullets";

describe("toBulletLines", () => {
  it("splits a description into its lines", () => {
    expect(toBulletLines(["One", "Two", "Three"].join(SPLIT_TEXT))).toEqual([
      "One",
      "Two",
      "Three",
    ]);
  });

  it("drops a blank line rather than drawing an empty bullet", () => {
    expect(toBulletLines(["One", "", "  ", "Two"].join(SPLIT_TEXT))).toEqual(["One", "Two"]);
  });

  it("leaves the text as it was typed", () => {
    // Trimming here would change what is on the sheet, not just tidy this function.
    expect(toBulletLines(" One ")).toEqual([" One "]);
  });

  it("reads an empty or missing description as no bullets", () => {
    expect(toBulletLines("")).toEqual([]);
    expect(toBulletLines(undefined)).toEqual([]);
  });
});
