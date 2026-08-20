import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * The unit suite: the pure functions under `src/lib`.
 *
 * Deliberately narrow. Anything that needs a browser — the editor, the templates,
 * the preview's pagination — is Playwright's job, and the split is what keeps this
 * suite worth running on every save: no jsdom, no React, no build step, so the
 * whole thing answers in under a second.
 *
 * `e2e/` is excluded rather than merely unlisted. Playwright's files also end in
 * `.spec.ts`, and a runner that picked them up would fail on `test.describe`
 * rather than on anything about the code.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    environment: "node",
  },
  resolve: {
    // Mirrors the `@/*` path in tsconfig.json. Vitest does not read it.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
