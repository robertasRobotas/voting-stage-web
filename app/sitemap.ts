import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";
import { siteUrl } from "@/lib/site";
import { USE_CASES } from "@/lib/use-cases";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/ideas`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/guides`, changeFrequency: "monthly", priority: 0.7 },
    ...USE_CASES.map((u) => ({
      url: `${base}/ideas/${u.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...GUIDES.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      lastModified: g.published,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
