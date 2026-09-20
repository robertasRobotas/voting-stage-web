"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { gtag } from "@/lib/analytics";
import { isBoardPath, redactPath, redactSearch } from "@/lib/analytics-path";

/**
 * Google Analytics 4, loaded by hand instead of through a ready-made component
 * because we need control over what is sent: automatic page views are off, and
 * every page view goes out with the board id and board title removed.
 *
 * In the GA property, also switch off Enhanced measurement → Page views →
 * "Page changes based on browser history events". Otherwise GA sends its own
 * page view (with the real URL) on every in-app navigation.
 */
export function Analytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      gtag("js", new Date());
      gtag("config", gaId, { send_page_view: false });
    }
    const location =
      window.location.origin + redactPath(pathname) + redactSearch(window.location.search);
    const title = isBoardPath(pathname) ? "Voting board" : document.title;
    // `set` makes later events on this page (votes, shares) carry the cleaned
    // values as well, instead of GA reading the real ones off the document.
    gtag("set", { page_location: location, page_title: title });
    gtag("event", "page_view", { page_location: location, page_title: title });
  }, [pathname, gaId]);

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
      strategy="afterInteractive"
    />
  );
}
