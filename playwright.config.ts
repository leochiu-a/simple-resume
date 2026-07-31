import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * Tests run against a production build rather than `next dev`, because that is
 * what actually gets deployed — Turbopack dev and the production build differ in
 * how they hydrate and how next/image is served.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // CI keeps the HTML report too — it is the artifact a failed run is debugged
  // from, and `github` puts the failure on the diff itself rather than leaving it
  // buried in the log.
  reporter: process.env.CI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      testIgnore: /mobile\./,
    },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 500, height: 850 } },
      testMatch: /mobile\./,
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
  },
});
