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

export const isWebMcpSupported = () =>
  typeof document !== "undefined" && "modelContext" in document && !!document.modelContext;

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
  const { modelContext } = document;
  if (!modelContext) return;

  for (const tool of tools) {
    if (signal.aborted) return;
    await modelContext.registerTool(tool, { signal });
  }
};
