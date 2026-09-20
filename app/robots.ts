import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Boards (/v/…) and the signed-in pages are kept out of search results
      // with a noindex tag instead. Blocking them here would backfire: a crawler
      // that can't fetch a page never sees its noindex, and may list the bare URL.
      disallow: ["/api/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
