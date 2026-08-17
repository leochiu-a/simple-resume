/**
 * Where this app is deployed.
 *
 * Stated once because several unrelated things need it and none can derive it: the
 * root layout's `metadataBase`, which turns the generated `opengraph-image` into the absolute
 * URL a crawler can fetch, the sitemap and robots routes, the structured data, and the
 * copyable prompt's server-rendered fallback.
 *
 * Deliberately a constant rather than `VERCEL_URL`. A preview deployment's own
 * hostname is the wrong answer for every caller — an Open Graph image should point
 * at the canonical site whoever is looking at it, and the prompt is a thing people
 * copy elsewhere. The client replaces it with the live origin where that matters.
 */
export const SITE_URL = "https://open-resume-dev.vercel.app";

export const SITE_NAME = "Open Resume";

/** Names the three things the landing page actually argues — templates, the two
 *  exports, and an AI that runs locally — because the version that listed only the
 *  exports described a smaller product than the one that ships. Shared by the root
 *  metadata and by the `WebApplication` node the landing page publishes. */
export const SITE_DESCRIPTION =
  "Write a resume, pick a template, and export a PDF or one self-contained HTML file. The browser's own AI can rewrite it. No account, and nothing is uploaded.";

export const SITE_TITLE = "Open Resume — a resume that never leaves your browser";
