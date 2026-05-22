"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

export default function Home() {
  const { user, configured, ready } = useAuth();

  const ctaHref = user ? "/dashboard" : "/login";
  const ctaLabel = user ? "Go to my boards" : "Log in to create a board";

  return (
    <div className="stack" style={{ gap: 48, paddingTop: 32 }}>
      <section style={{ textAlign: "center", padding: "32px 0" }}>
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>
          Vote like it&apos;s <span style={{ color: "var(--primary)" }}>Eurovision</span>.
        </h1>
        <p
          className="muted"
          style={{ fontSize: 18, maxWidth: 640, margin: "20px auto 32px" }}
        >
          Voting Stage is a fun way to make group decisions. Add items with photos or
          titles, share a link, and let every voter spend their 1, 2, 3, 4, 5, 6, 7, 8, 10, 12.
        </p>

        <div className="row" style={{ justifyContent: "center" }}>
          {configured && ready ? (
            <Link href={ctaHref} className="btn btn-primary" style={{ padding: "14px 22px", fontSize: 16 }}>
              {ctaLabel}
            </Link>
          ) : (
            <button className="btn btn-primary" disabled style={{ padding: "14px 22px", fontSize: 16 }}>
              {configured ? "Loading…" : "Firebase not configured"}
            </button>
          )}
        </div>

        <div
          className="row"
          style={{ justifyContent: "center", marginTop: 32, gap: 6, flexWrap: "wrap" }}
        >
          {POINTS.map((p) => (
            <span
              key={p}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 22,
                background: p === 12 ? "var(--accent)" : "var(--card)",
                border: "1px solid var(--border)",
                fontWeight: 700,
                color: p === 12 ? "#111" : "var(--foreground)",
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        <Feature
          title="Add anything"
          body="Movies, restaurants, party themes, hackathon ideas. Add titles and optionally a photo per item."
        />
        <Feature
          title="Share a link"
          body="Open to anyone with the link, or invite specific people by email. Change it later in settings."
        />
        <Feature
          title="One vote per browser"
          body="Anonymous voters get a localStorage token so they can't vote twice — and can resume their ballot."
        />
        <Feature
          title="You control the stage"
          body="Only the creator can finish (or resume) the voting. Results stay private until the curtain falls."
        />
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</h3>
      <p className="muted">{body}</p>
    </div>
  );
}
