import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";

const description =
  "Guides to voting and ranking with friends: how Eurovision-style points work, how to make a group decision without the argument, and ranking game ideas.";

export const metadata: Metadata = {
  title: "Guides to group voting and ranking games",
  description,
  alternates: { canonical: "/guides" },
  openGraph: { title: "Guides to group voting and ranking games", description, url: "/guides" },
};

export default function GuidesIndex() {
  return (
    <div className="stack" style={{ gap: 24, paddingTop: 20, maxWidth: 780 }}>
      <header className="stack" style={{ gap: 8 }}>
        <h1 className="page-title">Guides</h1>
        <p className="muted">How to vote, rank and decide things as a group — and have fun doing it.</p>
      </header>
      <div className="stack" style={{ gap: 12 }}>
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="card stack"
            style={{ gap: 6, color: "inherit", textDecoration: "none" }}
          >
            <h2 className="section-title" style={{ fontSize: 19 }}>{g.title}</h2>
            <p className="muted" style={{ fontSize: 15 }}>{g.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
