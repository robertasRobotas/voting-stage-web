import type { Metadata } from "next";

// Boards are shared privately by link. Link previews (title, description) still
// work, but a board must never turn up in a search engine.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
