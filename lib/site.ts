/**
 * Public origin of the site, for canonical URLs, the sitemap and social cards.
 *
 * Set NEXT_PUBLIC_SITE_URL once you have a custom domain. Without it, Vercel's
 * own production domain is used (VERCEL_PROJECT_PRODUCTION_URL is provided by
 * the platform, without a protocol), and localhost in development.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_NAME = "Voting Stage";

export const SITE_TAGLINE = "Rank anything with friends, Eurovision-style";

export const SITE_DESCRIPTION =
  "Free group ranking app. Rate and rank anything with friends online — movies, trips, restaurants, tier lists — with Eurovision-style 12 points.";

/** Descriptive use of the name only — say so wherever the contest is mentioned. */
export const DISCLAIMER =
  "Voting Stage is an independent tool. It is not affiliated with or endorsed by the Eurovision Song Contest or the European Broadcasting Union.";
