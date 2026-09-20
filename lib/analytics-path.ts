/**
 * What we're willing to tell Google about the current page.
 *
 * A board's share id is a private link, and its title is whatever the creator
 * typed — neither belongs in a third party's reports. Board URLs collapse to
 * one placeholder path, and the query string is dropped except for campaign
 * tags (the `next=` parameter on /login can contain a board link too).
 */
const CAMPAIGN_PARAMS = /^(utm_[a-z_]+|gclid|fbclid)$/i;

export function isBoardPath(pathname: string): boolean {
  return /^\/v\/[^/]+/.test(pathname);
}

export function redactPath(pathname: string): string {
  return pathname.replace(/^\/v\/[^/]+/, "/v/[board]");
}

export function redactSearch(search: string): string {
  const kept = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(search)) {
    if (CAMPAIGN_PARAMS.test(key)) kept.append(key, value);
  }
  const out = kept.toString();
  return out ? `?${out}` : "";
}
