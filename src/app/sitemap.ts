import type { MetadataRoute } from "next";

import { SITE_URL } from "@/constants/site";

/**
 * The four pages a crawler should know about.
 *
 * `/r` is deliberately absent, and so is anything under it. A share link carries its
 * resume in the fragment, which never reaches the server and which crawlers strip
 * before fetching — so the only thing at that URL, from outside the browser that was
 * handed the link, is an empty loading state. Listing it would submit one blank page
 * over and over under a URL that looks like thousands.
 *
 * No `lastModified`. The honest value is the commit that last touched each page, which
 * this file cannot see; build time would just claim every page changed on every deploy.
 */
const sitemap = (): MetadataRoute.Sitemap =>
  ["", "/resume-editor", "/how-to-write-a-resume", "/how-ai-works"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

export default sitemap;
