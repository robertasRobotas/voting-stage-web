import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { USE_CASES } from "@/lib/use-cases";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    ...USE_CASES.map((u) => ({
      url: `${base}/ideas/${u.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
