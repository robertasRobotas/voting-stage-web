import type { Metadata } from "next";

// Signed-in area — nothing here is useful in search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
