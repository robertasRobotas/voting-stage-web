import type { Metadata } from "next";
import Link from "next/link";
import { HomeCta } from "@/app/components/home-cta";
import { USE_CASES } from "@/lib/use-cases";

const description =
  "Things to vote on and rank with friends: trip destinations, movies, restaurants, tier lists, ranking games, Eurovision parties and more. Free group voting boards.";

export const metadata: Metadata = {
  title: "Things to vote on and rank with friends",
  description,
  alternates: { canonical: "/ideas" },
  openGraph: { title: "Things to vote on and rank with friends", description, url: "/ideas" },
};

export default function IdeasIndex() {
  return (
    <div className="stack" style={{ gap: 24, paddingTop: 20 }}>
      <header className="stack" style={{ gap: 8, maxWidth: 680 }}>
        <h1 className="page-title">Things to vote on with friends</h1>
        <p className="muted">
          Anything with a shortlist can go on a board. Here are the most popular ways people use
          group ranking — pick one to see how it works.
        </p>
      </header>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 14,
        }}
      >
        {USE_CASES.map((u) => (
          <Link
            key={u.slug}
            href={`/ideas/${u.slug}`}
            className="card stack"
            style={{ gap: 6, color: "inherit", textDecoration: "none" }}
          >
            <h2 className="section-title" style={{ fontSize: 17 }}>
              <span aria-hidden>{u.emoji}</span> {u.label}
            </h2>
            <p className="muted" style={{ fontSize: 14 }}>{u.metaDescription}</p>
          </Link>
        ))}
      </div>
      <div className="row">
        <HomeCta />
      </div>
    </div>
  );
}
