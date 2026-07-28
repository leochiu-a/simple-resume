/**
 * Minimal ambient types for the WebMCP API.
 *
 * Spec: https://webmachinelearning.github.io/webmcp/ (W3C Web Machine Learning
 * Community Group Draft, 2026-07-21 — not on the W3C Standards Track).
 *
 * Note the API lives on `document.modelContext`; the draft moved the getter off
 * `Navigator` on 2026-05-27, so `navigator.modelContext` is only a deprecated
 * alias in implementations that still ship it.
 */

interface ModelContextTextContent {
  type: "text";
  text: string;
}

interface ModelContextToolResult {
  content: ModelContextTextContent[];
  isError?: boolean;
}

interface ModelContextToolAnnotations {
  /** The tool only reads state, so an agent may call it without confirmation. */
  readOnlyHint?: boolean;
  /** The tool returns content that originated outside the page's control. */
  untrustedContentHint?: boolean;
}

interface ModelContextTool<Args = Record<string, unknown>> {
  /** 1–128 chars: alphanumerics, underscore, hyphen, period. */
  name: string;
  title?: string;
  description: string;
  /** JSON Schema describing the arguments passed to `execute`. */
  inputSchema?: Record<string, unknown>;
  annotations?: ModelContextToolAnnotations;
  execute: (args: Args) => ModelContextToolResult | Promise<ModelContextToolResult>;
}

interface ModelContextRegisterToolOptions {
  /** Aborting the signal unregisters the tool — there is no `unregisterTool`. */
  signal?: AbortSignal;
  /** Extra origins (e.g. an in-page agent iframe) allowed to see the tool. */
  exposedTo?: string[];
}

interface ModelContext extends EventTarget {
  registerTool(
    tool: ModelContextTool<never>,
    options?: ModelContextRegisterToolOptions,
  ): Promise<void>;
  getTools(): Promise<unknown[]>;
  ontoolchange: ((this: ModelContext, event: Event) => unknown) | null;
}

interface Document {
  /** Present only in browsers that implement WebMCP. */
  readonly modelContext?: ModelContext;
}

interface Navigator {
  /**
   * @deprecated The draft moved the getter to `Document` on 2026-05-27. Chrome
   * shipped it here first and only deprecated it in 150, so it is still the only
   * surface on some origin-trial builds. Read it through `getModelContext()`.
   */
  readonly modelContext?: ModelContext;
}
