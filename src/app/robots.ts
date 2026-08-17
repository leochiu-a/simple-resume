import type { MetadataRoute } from "next";

import { SITE_URL } from "@/constants/site";

/**
 * Everything is crawlable. Keeping a page out of the index is `robots: { index: false }`
 * on the page itself, not a line here — see `app/r/layout.tsx`.
 *
 * This file used to carry `Disallow: /r`, which was wrong twice over. A `Disallow` is
 * matched as a **prefix**, not as a path segment, so `/r` also blocked `/resume-editor`
 * — the one page the product exists for, and one the sitemap lists. And even spelled
 * `/r$` it would not have done the job: robots.txt governs crawling, not indexing, so a
 * disallowed URL that someone links to can still be indexed as a bare URL. A `noindex`
 * the crawler is allowed to reach is the only thing that keeps a page out.
 */
const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    allow: "/",
  },
  sitemap: `${SITE_URL}/sitemap.xml`,
});

export default robots;
