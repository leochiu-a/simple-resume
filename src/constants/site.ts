/**
 * Where this app is deployed.
 *
 * Stated once because two unrelated things need it and neither can derive it: the
 * root layout's `metadataBase`, which turns the generated `opengraph-image` into the absolute
 * URL a crawler can fetch, and the copyable prompt's server-rendered fallback.
 *
 * Deliberately a constant rather than `VERCEL_URL`. A preview deployment's own
 * hostname is the wrong answer for both callers — an Open Graph image should point
 * at the canonical site whoever is looking at it, and the prompt is a thing people
 * copy elsewhere. The client replaces it with the live origin where that matters.
 */
export const SITE_URL = "https://open-resume-dev.vercel.app";
