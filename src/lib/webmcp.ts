/**
 * Thin helpers around the WebMCP browser API.
 * See src/types/webmcp.d.ts for the spec reference.
 */

import { trackEvent } from "./analytics";

export type WebMcpStatus = "checking" | "unsupported" | "ready" | "error";

/**
 * `execute` is invoked by the agent, so its arguments are untrusted JSON that
 * only nominally matches `inputSchema`. Tools take a loose shape and narrow it
 * themselves; this keeps the declaration site typed without lying about it.
 */
export type WebMcpTool = ModelContextTool<never>;

/** A tool as it is declared, before `defineTool` erases the argument type. */
export type WebMcpToolInit<Args> = Omit<ModelContextTool<Args>, "execute"> & {
  execute: (args: Args) => ModelContextToolResult | Promise<ModelContextToolResult>;
};

export const defineTool = <Args>(tool: WebMcpToolInit<Args>): WebMcpTool =>
  tool as unknown as WebMcpTool;

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
 * Wraps a tool so a call is counted before it runs.
 *
 * Here rather than in each of the twelve tools: this is the one place every
 * agent call passes through, and a tool added later is counted without anyone
 * remembering to. Only the tool's own name goes out — the arguments are the
 * resume, and the result is the resume.
 *
 * The count is taken before `execute` rather than after, so a tool that throws
 * still shows up. What is being measured is agents reaching for a tool at all.
 */
const counted = (tool: WebMcpTool): WebMcpTool => ({
  ...tool,
  execute: ((args: never) => {
    trackEvent("webmcp_tool_called", { tool: tool.name });

    return tool.execute(args);
  }) as WebMcpTool["execute"],
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
    await modelContext.registerTool(counted(tool), { signal });
  }
};
