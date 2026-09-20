/**
 * `next` comes from the URL, so anyone can craft it. Only follow same-site
 * paths — `https://evil.example`, `//evil.example` and `/\\evil.example` would
 * all bounce a freshly signed-in user to another site.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
