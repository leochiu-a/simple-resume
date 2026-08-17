import type { MetadataRoute } from "next";

import { SITE_URL } from "@/constants/site";

/**
 * Everything is crawlable except the share viewer, for the reason the sitemap gives:
 * `/r` has no content without the fragment a crawler does not send.
 */
const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    allow: "/",
    disallow: "/r",
  },
  sitemap: `${SITE_URL}/sitemap.xml`,
});

export default robots;
