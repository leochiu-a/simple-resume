/**
 * Thin helpers around the WebMCP browser API.
 * See src/types/webmcp.d.ts for the spec reference.
 */

export type WebMcpStatus = "checking" | "unsupported" | "ready" | "error";

/**
 * `execute` is invoked by the agent, so its arguments are untrusted JSON that
 * only nominally matches `inputSchema`. Tools take a loose shape and narrow it
 * themselves; this keeps the declaration site typed without lying about it.
 */
export type WebMcpTool = ModelContextTool<never>;

export const defineTool = <Args>(
  tool: Omit<ModelContextTool<Args>, "execute"> & {
    execute: (args: Args) => ModelContextToolResult | Promise<ModelContextToolResult>;
  },
): WebMcpTool => tool as unknown as WebMcpTool;

/**
 * Resolves the ModelContext across the origin-trial transition window.
 *
 * The draft moved the getter from `Navigator` to `Document` on 2026-05-27, but
 * Chrome shipped it on `navigator` first and only deprecated that in 150, so a
 * build may expose either surface or both. Prefer the spec-current `document`
 * and fall back to the deprecated alias.
 */
export const getModelContext = (): ModelContext | undefined => {
  if (typeof document === "undefined") return undefined;

  return document.modelContext ?? navigator.modelContext;
};

export const isWebMcpSupported = () => !!getModelContext();

/** A successful tool result carrying a single text block. */
export const toolText = (text: string): ModelContextToolResult => ({
  content: [{ type: "text", text }],
});

/** A failed tool result — the agent sees the message and can retry. */
export const toolError = (text: string): ModelContextToolResult => ({
  content: [{ type: "text", text }],
  isError: true,
});

/**
 * Registers every tool for as long as `signal` is unaborted. Registration is
 * per-document, so this must run after mount and be torn down on unmount.
 */
export const registerTools = async (tools: WebMcpTool[], signal: AbortSignal) => {
  const modelContext = getModelContext();
  if (!modelContext) return;

  for (const tool of tools) {
    if (signal.aborted) return;
    await modelContext.registerTool(tool, { signal });
  }
};
