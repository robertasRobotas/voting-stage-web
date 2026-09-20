/**
 * Product analytics events. Rules: no board ids, no titles, no emails, no
 * names — only counts and categories. Add a new event here, not ad hoc, so the
 * list below stays the single place that shows what leaves the browser.
 */
export interface AnalyticsEvents {
  /** A call-to-action on a marketing page. `placement` = the page it was on. */
  cta_click: { placement: string };
  /** GA4 recommended event. */
  login: { method: "Google" };
  board_created: { access: string; item_count: number; with_images: number };
  /** GA4 recommended event: the owner took the share link or QR code. */
  share: { method: "copy_link" | "qr_code"; content_type: "board" };
  vote_cast: { is_update: boolean; signed_in: boolean; points_placed: number; board_access: string };
  board_finished: { total_votes: number };
  board_resumed: Record<string, never>;
  results_view_changed: { view: "scoreboard" | "tiers" };
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Production only, so local development doesn't pollute the statistics. */
export const analyticsEnabled = process.env.NODE_ENV === "production";

/** gtag.js only understands the `arguments` object, not a plain array. */
export const gtag: (...args: unknown[]) => void = function () {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
};

export function track<E extends keyof AnalyticsEvents>(event: E, params: AnalyticsEvents[E]): void {
  if (!analyticsEnabled) return;
  gtag("event", event, params);
}
