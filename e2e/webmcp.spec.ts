import { expect, test, type Page } from "@playwright/test";
import { collectConsoleErrors, openOnDeviceAiPanel, preview } from "./helpers";

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

/** Just enough of the stored `ResumeDoc` for the language assertions below. */
interface ResumeDocShape {
  primaryLang: string;
  activeLang: string;
  locales: Record<string, { name: string } | undefined>;
}

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
  expect.poll(() => page.evaluate(() => window.localStorage.getItem("resume-doc"))).not.toBeNull();

/**
 * Every tool the editor registers, in the order it registers them.
 *
 * One list rather than a count in the gate and an array in the assertion: the
 * two drifted when `score-resume` and `submit-review` were added, and a gate
 * waiting for a tool count that can never arrive fails every test in the file
 * from `beforeEach`, which says nothing about what actually changed.
 */
const REGISTERED_TOOLS = [
  "get-resume",
  "score-resume",
  "submit-review",
  "update-resume",
  "add-entry",
  "update-entry",
  "remove-entry",
  "set-section-layout",
];

/**
 * Registration used to be readable straight off the nav; it now lives in the
 * on-device AI panel, behind that panel's own trigger, so the gate every test
 * needs is the stub's own view of what got registered rather than a click into
 * the panel each time.
 */
const waitForRegistration = (page: Page) =>
  expect.poll(() => listTools(page)).toHaveLength(REGISTERED_TOOLS.length);

test.describe("WebMCP resume tools", () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    await installModelContextStub(page);
    errors = collectConsoleErrors(page);
    await page.goto("/resume-editor");
    await waitForRegistration(page);
  });

  test("registers the full tool set and reports it in the on-device AI panel", async ({ page }) => {
    const names = await listTools(page);

    expect(names).toEqual(REGISTERED_TOOLS);

    await openOnDeviceAiPanel(page);
    await expect(page.getByText(`${names.length} tools registered`)).toBeVisible();
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
    // The form holds one Resume, so this block is the only thing telling the
    // agent which of the document's locales it is looking at.
    expect(resume.language).toEqual({
      active: "zh-Hant",
      primary: "zh-Hant",
      isTranslation: false,
      exists: true,
    });
  });

  /**
   * A locale is an empty slot until the translation panel fills it, and
   * `useResumeDoc` drops every save aimed at one. The form still accepts the
   * write, so a tool that did not check this reported success over a change that
   * never reached storage.
   */
  test("a write is refused while the active language has no version yet", async ({ page }) => {
    await waitForStoredResume(page);
    await page.addInitScript(() => {
      const stored = JSON.parse(window.localStorage.getItem("resume-doc") as string);

      // Primary is Chinese and no English locale exists.
      stored.activeLang = "en";
      window.localStorage.setItem("resume-doc", JSON.stringify(stored));
    });
    await page.goto("/resume-editor");
    await waitForRegistration(page);

    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).language).toEqual({
      active: "en",
      primary: "zh-Hant",
      isTranslation: true,
      exists: false,
    });

    const result = await callTool(page, "update-resume", { name: "Ada Lovelace" });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("no English version");
    // The refusal is the point: the locale is still absent either way, but the
    // agent now knows the edit did not happen.
    const stored = await page.evaluate(
      () => JSON.parse(window.localStorage.getItem("resume-doc") as string) as ResumeDocShape,
    );
    expect(stored.locales.en).toBeUndefined();
    expect(errors).toEqual([]);
  });

  test("a write into a translated locale lands there and says so", async ({ page }) => {
    await waitForStoredResume(page);
    await page.addInitScript(() => {
      const stored = JSON.parse(window.localStorage.getItem("resume-doc") as string);

      stored.locales.en = stored.locales[stored.primaryLang];
      stored.activeLang = "en";
      window.localStorage.setItem("resume-doc", JSON.stringify(stored));
    });
    await page.goto("/resume-editor");
    await waitForRegistration(page);

    const result = await callTool(page, "update-resume", { name: "Ada Lovelace" });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain("English translation");
    await expect(preview(page).getByText("Ada Lovelace")).toBeVisible();

    // It reached the translation and left the source of truth alone.
    await expect
      .poll(async () => {
        const stored = await page.evaluate(
          () => JSON.parse(window.localStorage.getItem("resume-doc") as string) as ResumeDocShape,
        );

        return [stored.locales.en?.name, stored.locales["zh-Hant"]?.name];
      })
      .toEqual(["Ada Lovelace", "My Name"]);
  });

  // The "Present" switch stores `to: null` rather than "", so a resume with an
  // ongoing job used to crash get-resume on `.slice(0, 7)`.
  test("get-resume survives an ongoing entry stored as null", async ({ page }) => {
    await waitForStoredResume(page);
    await page.addInitScript(() => {
      const stored = JSON.parse(window.localStorage.getItem("resume-doc") as string);
      const resume = stored.locales[stored.primaryLang];

      resume.employmentHistory[0].timeline.to = null;
      resume.educations[0].timeline = { from: null, to: null };
      window.localStorage.setItem("resume-doc", JSON.stringify(stored));
    });
    await page.goto("/resume-editor");
    await waitForRegistration(page);

    const result = await callTool(page, "get-resume");

    expect(result.isError).toBeFalsy();

    const resume = JSON.parse(textOf(result));

    expect(resume.employmentHistory[0]).toMatchObject({ index: 0, from: "2018-01", to: "" });
    expect(resume.educations[0]).toMatchObject({ index: 0, from: "", to: "" });
    expect(errors).toEqual([]);
  });

  test("update-entry leaves an ongoing job ongoing when `to` is omitted", async ({ page }) => {
    await waitForStoredResume(page);
    await page.addInitScript(() => {
      const stored = JSON.parse(window.localStorage.getItem("resume-doc") as string);

      stored.locales[stored.primaryLang].employmentHistory[0].timeline.to = null;
      window.localStorage.setItem("resume-doc", JSON.stringify(stored));
    });
    await page.goto("/resume-editor");
    await waitForRegistration(page);

    const result = await callTool(page, "update-entry", {
      section: "employmentHistory",
      index: 0,
      jobTitle: "Staff Engineer",
    });

    expect(result.isError).toBeFalsy();
    expect(
      JSON.parse(textOf(await callTool(page, "get-resume"))).employmentHistory[0],
    ).toMatchObject({ jobTitle: "Staff Engineer", to: "" });
    await expect(preview(page).getByText(/— Present/)).toBeVisible();
  });

  test("update-resume writes through to the form and the preview", async ({ page }) => {
    const result = await callTool(page, "update-resume", {
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

  test("update-resume replaces the whole skill list in the field array", async ({ page }) => {
    await callTool(page, "update-resume", { skills: ["Rust", "WebAssembly"] });

    await expect(preview(page).getByText("Rust")).toBeVisible();
    await expect(preview(page).getByText("WebAssembly")).toBeVisible();
    await expect(preview(page).getByText("GraphQL")).toBeHidden();
    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).skills).toEqual([
      "Rust",
      "WebAssembly",
    ]);
  });

  test("add-entry appends a job and renders each bullet separately", async ({ page }) => {
    const result = await callTool(page, "add-entry", {
      section: "employmentHistory",
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

  test("update-entry edits one job and leaves the rest alone", async ({ page }) => {
    await callTool(page, "add-entry", {
      section: "employmentHistory",
      company: "Vercel",
      jobTitle: "Frontend Engineer",
      from: "2020-03",
    });
    await callTool(page, "update-entry", {
      section: "employmentHistory",
      index: 0,
      jobTitle: "Principal Engineer",
    });

    const resume = JSON.parse(textOf(await callTool(page, "get-resume")));
    expect(resume.employmentHistory[0].jobTitle).toBe("Principal Engineer");
    expect(resume.employmentHistory[0].company).toBe("Google");
    expect(resume.employmentHistory[1].company).toBe("Vercel");
  });

  test("remove-entry deletes the job", async ({ page }) => {
    await callTool(page, "remove-entry", { section: "employmentHistory", index: 0 });

    await expect(preview(page).getByText("Google")).toBeHidden();
    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).employmentHistory).toEqual([]);
  });

  test("add-entry appends a project and renders each bullet separately", async ({ page }) => {
    const result = await callTool(page, "add-entry", {
      section: "projects",
      name: "Tideline",
      url: "https://example.com/tideline",
      bullets: ["Offline-first tide charts", "Ships as a PWA"],
    });

    expect(textOf(result)).toContain("at index 1");

    await expect(preview(page).getByText("Tideline", { exact: true })).toBeVisible();
    await expect(preview(page).getByText("https://example.com/tideline")).toBeVisible();
    await expect(preview(page).getByText("Offline-first tide charts")).toBeVisible();
    await expect(preview(page).getByText("Ships as a PWA")).toBeVisible();
  });

  test("update-entry edits one project and leaves the rest alone", async ({ page }) => {
    await callTool(page, "add-entry", { section: "projects", name: "Tideline" });
    await callTool(page, "update-entry", { section: "projects", index: 1, name: "Tideline 2" });

    const resume = JSON.parse(textOf(await callTool(page, "get-resume")));
    expect(resume.projects[0].name).toBe("Open Resume");
    expect(resume.projects[1].name).toBe("Tideline 2");
  });

  test("remove-entry deletes the project", async ({ page }) => {
    await callTool(page, "remove-entry", { section: "projects", index: 0 });

    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).projects).toEqual([]);
  });

  test("an out-of-range index comes back as a tool error, not a crash", async ({ page }) => {
    const result = await callTool(page, "remove-entry", {
      section: "employmentHistory",
      index: 7,
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("valid indexes are 0–0");
    // The resume is untouched.
    await expect(preview(page).getByText("Google")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("set-section-layout hides a section without losing its content", async ({ page }) => {
    await callTool(page, "set-section-layout", { visibility: { skills: false } });

    await expect(preview(page).getByText("TypeScript")).toBeHidden();
    // Hidden, not deleted.
    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).skills).toContain("TypeScript");

    await callTool(page, "set-section-layout", { visibility: { skills: true } });
    await expect(preview(page).getByText("TypeScript")).toBeVisible();
  });

  test("set-section-layout moves a section to the top of the sheet", async ({ page }) => {
    // Partial on purpose: naming the one section to promote is the useful call, and
    // the rest keep their relative order behind it.
    const result = await callTool(page, "set-section-layout", { order: ["educations"] });

    expect(textOf(result)).toContain(
      "educations, profile, employmentHistory, projects, skills, socialLinks",
    );

    // The form is the same list, so it reorders with the sheet.
    await expect(page.locator("#resume-form h2")).toHaveText([
      /Information/,
      /Educations/,
      /Profile/,
      /Employment History/,
      /Projects/,
      /Skills/,
      /Website & Social links/,
    ]);
  });

  /**
   * The reason the two used to be separate tools were merged: reshaping the
   * sheet is usually one decision, and half of it applied is a state the agent
   * never asked for.
   */
  test("set-section-layout reorders and hides in one call", async ({ page }) => {
    const result = await callTool(page, "set-section-layout", {
      order: ["educations"],
      visibility: { skills: false },
    });

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain("skills is hidden");

    await expect(preview(page).getByText("TypeScript")).toBeHidden();
    await expect(page.locator("#resume-form h2").nth(1)).toHaveText(/Educations/);
  });

  test("set-section-layout with neither argument is refused", async ({ page }) => {
    const result = await callTool(page, "set-section-layout", {});

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('Pass "order", "visibility" or both');
  });

  test("an unknown section is rejected, in the order and in the visibility", async ({ page }) => {
    const inOrder = await callTool(page, "set-section-layout", {
      order: ["profile", "hobbies"],
    });

    expect(inOrder.isError).toBe(true);
    expect(textOf(inOrder)).toContain("Valid sections");

    const inVisibility = await callTool(page, "set-section-layout", {
      visibility: { hobbies: true },
    });

    expect(inVisibility.isError).toBe(true);
    expect(textOf(inVisibility)).toContain("Valid sections");

    const inEntry = await callTool(page, "remove-entry", { section: "hobbies", index: 0 });

    expect(inEntry.isError).toBe(true);
    expect(textOf(inEntry)).toContain("Valid sections");
  });

  /**
   * The entry tools share one flat schema across three sections, so nothing in
   * the schema stops `school` reaching a project. Dropping it in silence would
   * leave the agent reading back an entry missing the field it just passed, so
   * the mismatch has to be an error that names where the field does belong.
   */
  test("a field from the wrong section is rejected rather than dropped", async ({ page }) => {
    const result = await callTool(page, "add-entry", {
      section: "projects",
      name: "Tideline",
      school: "MIT",
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('"school" is not a field of projects');
    expect(textOf(result)).toContain("educations takes school, degree, major, from, to");
    // Nothing was appended.
    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).projects).toHaveLength(1);
  });

  /**
   * `required` on the schema cannot express this: what a new entry needs depends
   * on which section it is going into, and the flat schema has one `required`.
   */
  test("add-entry names the fields the section requires", async ({ page }) => {
    const result = await callTool(page, "add-entry", {
      section: "educations",
      school: "MIT",
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("needs degree, major, from");
    // The refusal left the list alone.
    expect(JSON.parse(textOf(await callTool(page, "get-resume"))).educations).toHaveLength(2);
  });

  test("add-entry appends a school", async ({ page }) => {
    const result = await callTool(page, "add-entry", {
      section: "educations",
      school: "MIT",
      degree: "Master",
      major: "Computer Science",
      from: "2019-09",
      to: "2021-06",
    });

    expect(textOf(result)).toContain("at index 2");
    await expect(preview(page).getByText("MIT")).toBeVisible();
  });

  test("update-resume patches one field and replaces both lists", async ({ page }) => {
    const result = await callTool(page, "update-resume", {
      profile: "Ships design systems.",
      socialLinks: [{ name: "Bluesky", url: "https://bsky.app/profile/example" }],
    });

    expect(textOf(result)).toContain("social links are now Bluesky");

    const resume = JSON.parse(textOf(await callTool(page, "get-resume")));
    expect(resume.profile).toBe("Ships design systems.");
    expect(resume.socialLinks).toEqual([
      { name: "Bluesky", url: "https://bsky.app/profile/example" },
    ]);
    // Untouched fields survive the patch.
    expect(resume.name).toBe("My Name");
    expect(resume.skills).toContain("TypeScript");
  });

  test("update-resume with no fields is refused rather than reported as a no-op", async ({
    page,
  }) => {
    const result = await callTool(page, "update-resume", {});

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("nothing to update");
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

    await expect.poll(() => listTools(legacyPage)).toHaveLength(REGISTERED_TOOLS.length);
    expect(await legacyPage.evaluate(() => "modelContext" in document)).toBe(false);

    await openOnDeviceAiPanel(legacyPage);
    await expect(legacyPage.getByText(`${REGISTERED_TOOLS.length} tools registered`)).toBeVisible();

    await callTool(legacyPage, "update-resume", { name: "Grace Hopper" });
    await expect(preview(legacyPage).getByText("Grace Hopper")).toBeVisible();

    await context.close();
  });

  test("tools are unregistered when the editor unmounts", async ({ page }) => {
    expect(await listTools(page)).toHaveLength(REGISTERED_TOOLS.length);

    await page.getByRole("link", { name: "Open Resume" }).click();
    await expect(page).toHaveURL("/");

    await expect.poll(() => listTools(page)).toEqual([]);
  });
});
