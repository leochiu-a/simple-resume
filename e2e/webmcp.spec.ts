import { expect, test, type Page } from "@playwright/test";
import { collectConsoleErrors, preview } from "./helpers";

/**
 * WebMCP only exists in Edge 147+ and behind chrome://flags/#enable-webmcp-testing
 * in Chrome, so Playwright's bundled Chromium has no `document.modelContext`.
 * These tests install a minimal stand-in that follows the shape of the draft
 * spec (https://webmachinelearning.github.io/webmcp/) — registerTool, the
 * AbortSignal-based unregistration, and MCP content-block results — and then
 * drive the resume tools exactly as an agent would.
 */
const installModelContextStub = async (
  page: Page,
  surface: "document" | "navigator" = "document",
) => {
  await page.addInitScript((target) => {
    const tools = new Map<string, { execute: (args: unknown) => unknown }>();

    const modelContext = {
      registerTool(
        tool: { name: string; execute: (args: unknown) => unknown },
        options?: { signal?: AbortSignal },
      ) {
        tools.set(tool.name, tool);
        options?.signal?.addEventListener("abort", () => tools.delete(tool.name));

        return Promise.resolve();
      },
      getTools: () => Promise.resolve([...tools.keys()]),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    };

    Object.defineProperty(
      target === "navigator" ? Navigator.prototype : Document.prototype,
      "modelContext",
      { configurable: true, get: () => modelContext },
    );

    Object.defineProperty(window, "__webmcp", {
      value: {
        list: () => [...tools.keys()],
        call: (name: string, args: unknown = {}) => tools.get(name)?.execute(args),
      },
    });
  }, surface);
};

interface ToolResult {
  content: { type: string; text: string }[];
  isError?: boolean;
}

const listTools = (page: Page) =>
  page.evaluate(() => (window as unknown as { __webmcp: { list(): string[] } }).__webmcp.list());

const callTool = (page: Page, name: string, args: Record<string, unknown> = {}) =>
  page.evaluate(
    ([toolName, toolArgs]) =>
      (
        window as unknown as {
          __webmcp: { call(name: string, args: unknown): Promise<ToolResult> };
        }
      ).__webmcp.call(toolName as string, toolArgs),
    [name, args] as const,
  ) as Promise<ToolResult>;

const textOf = (result: ToolResult) => result.content.map((block) => block.text).join("\n");

/**
 * The editor saves to localStorage on a 300ms debounce. Tests that reload with
 * a patched resume have to wait for that first, or the reload races the save
 * and there is nothing to patch.
 */
const waitForStoredResume = (page: Page) =>
  expect.poll(() => page.evaluate(() => window.localStorage.getItem("resume"))).not.toBeNull();

test.describe("WebMCP resume tools", () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    await installModelContextStub(page);
    errors = collectConsoleErrors(page);
    await page.goto("/resume-editor");
    await expect(page.getByText(/Agent ready/)).toBeVisible();
  });

  test("registers the full tool set and reports it in the nav", async ({ page }) => {
    const names = await listTools(page);

    expect(names).toEqual([
      "get-resume",
      "update-basic-info",
      "update-profile",
      "set-skills",
      "set-social-links",
      "add-employment",
      "update-employment",
      "remove-employment",
      "add-education",
      "update-education",
      "remove-education",
      "set-section-visibility",
    ]);

    await expect(page.getByText(`Agent ready · ${names.length} tools`)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("get-resume returns an agent-friendly view of the editor state", async ({ page }) => {
    const resume = JSON.parse(textOf(await callTool(page, "get-resume")));

    expect(resume.name).toBe("My Name");
    // Skills flatten to plain strings, and entries carry the index the write
    // tools expect.
    expect(resume.skills).toEqual(["TypeScript", "React", "Next.js", "GraphQL", "Redux"]);
    expect(resume.employmentHistory[0]).toMatchObject({
      index: 0,
      company: "Google",
      jobTitle: "Senior Engineer",
      from: "2018-01",
      bullets: ["A,B,C,D"],
    });
  });

  // The "Present" switch stores `to: null` rather than "", so a resume with an
  // ongoing job used to crash get-resume on `.slice(0, 7)`.
  test("get-resume survives an ongoing entry stored as null", async ({ page }) => {
    await waitForStoredResume(page);
    await page.addInitScript(() => {
      const stored = JSON.parse(window.localStorage.getItem("resume") as string);

      stored.employmentHistory[0].timeline.to = null;
      stored.educations[0].timeline = { from: null, to: null };
      window.localStorage.setItem("resume", JSON.stringify(stored));
    });
    await page.goto("/resume-editor");
    await expect(page.getByText(/Agent ready/)).toBeVisible();

    const result = await callTool(page, "get-resume");

    expect(result.isError).toBeFalsy();

    const resume = JSON.parse(textOf(result));

    expect(resume.employmentHistory[0]).toMatchObject({ index: 0, from: "2018-01", to: "" });
    expect(resume.educations[0]).toMatchObject({ index: 0, from: "", to: "" });
    expect(errors).toEqual([]);
  });

  test("update-employment leaves an ongoing job ongoing when `to` is omitted", async ({ page }) => {
    await waitForStoredResume(page);
    await page.addInitScript(() => {
      const stored = JSON.parse(window.localStorage.getItem("resume") as string);

      stored.employmentHistory[0].timeline.to = null;
      window.localStorage.setItem("resume", JSON.stringify(stored));
    });
    await page.goto("/resume-editor");
    await expect(page.getByText(/Agent ready/)).toBeVisible();

    const result = await callTool(page, "update-employment", {
      index: 0,
      jobTitle: "Staff Engineer",
    });

    expect(result.isError).toBeFalsy();
    expect(
      JSON.parse(textOf(await callTool(page, "get-resume"))).employmentHistory[0],
    ).toMatchObject({ jobTitle: "Staff Engineer", to: "" });
    await expect(preview(page).getByText(/— Present/)).toBeVisible();
  });

  test("update-basic-info writes through to the form and the preview", async ({ page }) => {
    const result = await callTool(page, "update-basic-info", {
      name: "Ada Lovelace",
      wantedJob: "Staff Engineer",
      city: "London",
    });

    expect(result.isError).toBeFalsy();
    await expect(page.getByRole("textbox").nth(1)).toHaveValue("Ada Lovelace");
    await expect(preview(page).getByText("Ada Lovelace")).toBeVisible();
    await expect(preview(page).getByText("Staff Engineer")).toBeVisible();
    // Untouched fields survive.
    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).email).toBe("good@gmail.com");
  });

  test("set-skills replaces the whole list in the field array", async ({ page }) => {
    await callTool(page, "set-skills", { skills: ["Rust", "WebAssembly"] });

    await expect(preview(page).getByText("Rust")).toBeVisible();
    await expect(preview(page).getByText("WebAssembly")).toBeVisible();
    await expect(preview(page).getByText("GraphQL")).toBeHidden();
    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).skills).toEqual([
      "Rust",
      "WebAssembly",
    ]);
  });

  test("add-employment appends a job and renders each bullet separately", async ({ page }) => {
    const result = await callTool(page, "add-employment", {
      company: "Vercel",
      jobTitle: "Frontend Engineer",
      from: "2020-03",
      to: "",
      bullets: ["Rebuilt the editor", "Cut bundle size in half"],
    });

    expect(textOf(result)).toContain("at index 1");
    expect(textOf(result)).toContain("2020-03 — Present");

    await expect(preview(page).getByText("Vercel")).toBeVisible();
    await expect(preview(page).getByText("Rebuilt the editor")).toBeVisible();
    await expect(preview(page).getByText("Cut bundle size in half")).toBeVisible();
    // The original job is still there.
    await expect(preview(page).getByText("Google")).toBeVisible();
  });

  test("update-employment edits one entry and leaves the rest alone", async ({ page }) => {
    await callTool(page, "add-employment", {
      company: "Vercel",
      jobTitle: "Frontend Engineer",
      from: "2020-03",
    });
    await callTool(page, "update-employment", { index: 0, jobTitle: "Principal Engineer" });

    const resume = JSON.parse(textOf(await callTool(page, "get-resume")));
    expect(resume.employmentHistory[0].jobTitle).toBe("Principal Engineer");
    expect(resume.employmentHistory[0].company).toBe("Google");
    expect(resume.employmentHistory[1].company).toBe("Vercel");
  });

  test("remove-employment deletes the entry", async ({ page }) => {
    await callTool(page, "remove-employment", { index: 0 });

    await expect(preview(page).getByText("Google")).toBeHidden();
    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).employmentHistory).toEqual([]);
  });

  test("an out-of-range index comes back as a tool error, not a crash", async ({ page }) => {
    const result = await callTool(page, "remove-employment", { index: 7 });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("valid indexes are 0–0");
    // The resume is untouched.
    await expect(preview(page).getByText("Google")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("set-section-visibility hides a section without losing its content", async ({ page }) => {
    await callTool(page, "set-section-visibility", { section: "skills", visible: false });

    await expect(preview(page).getByText("TypeScript")).toBeHidden();
    // Hidden, not deleted.
    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).skills).toContain("TypeScript");

    await callTool(page, "set-section-visibility", { section: "skills", visible: true });
    await expect(preview(page).getByText("TypeScript")).toBeVisible();
  });

  test("an unknown section is rejected", async ({ page }) => {
    const result = await callTool(page, "set-section-visibility", {
      section: "hobbies",
      visible: true,
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("Valid sections");
  });

  /**
   * Chrome shipped WebMCP on `navigator` before the draft moved it to `document`
   * and only deprecated the alias in 150, so an origin-trial build may expose
   * just the legacy surface. Registration has to fall back to it.
   */
  test("registration falls back to the deprecated navigator surface", async ({ browser }) => {
    const context = await browser.newContext();
    const legacyPage = await context.newPage();
    await installModelContextStub(legacyPage, "navigator");
    await legacyPage.goto("/resume-editor");

    await expect(legacyPage.getByText("Agent ready · 12 tools")).toBeVisible();
    expect(await legacyPage.evaluate(() => "modelContext" in document)).toBe(false);
    expect(await listTools(legacyPage)).toHaveLength(12);

    await callTool(legacyPage, "update-basic-info", { name: "Grace Hopper" });
    await expect(preview(legacyPage).getByText("Grace Hopper")).toBeVisible();

    await context.close();
  });

  test("tools are unregistered when the editor unmounts", async ({ page }) => {
    expect(await listTools(page)).toHaveLength(12);

    await page.getByRole("link", { name: "Simple Resume" }).click();
    await expect(page).toHaveURL("/");

    await expect.poll(() => listTools(page)).toEqual([]);
  });
});
