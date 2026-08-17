import type { MetadataRoute } from "next";

import { SITE_URL } from "@/constants/site";

/**
 * The four pages a crawler should know about.
 *
 * `/r` is deliberately absent: a share link carries its resume in the fragment, which
 * never reaches the server and which crawlers strip before fetching, so the only thing
 * at that URL from outside the browser that was handed the link is an empty loading
 * state. Leaving it out of the sitemap is only half of that — the `noindex` in
 * `app/r/layout.tsx` is what actually keeps it out of the index.
 *
 * No `lastModified`. The honest value is the commit that last touched each page, which
 * this file cannot see; build time would just claim every page changed on every deploy.
 */
const sitemap = (): MetadataRoute.Sitemap =>
  /* The landing page's path is `/` rather than empty so its entry matches its own
     canonical tag byte for byte — Next resolves that one through `URL`, which restores
     the slash an empty path drops. The two are the same URL either way, but a sitemap
     that disagrees with the canonical it points at is a needless thing to explain. */
  ["/", "/resume-editor", "/how-to-write-a-resume", "/how-ai-works"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

export default sitemap;
