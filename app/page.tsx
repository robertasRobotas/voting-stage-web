"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

export default function Home() {
  const { user, configured, ready } = useAuth();

  const ctaHref = user ? "/dashboard" : "/login";
  const ctaLabel = user ? "Go to my boards" : "Log in to create a board";

  return (
    <div className="stack" style={{ gap: 56, paddingTop: 28 }}>
      <section style={{ textAlign: "center", padding: "24px 0 8px" }}>
        <h1
          className="page-title"
          style={{ fontSize: "clamp(38px, 7vw, 58px)", maxWidth: 720, margin: "0 auto" }}
        >
          Vote like it&apos;s <em style={{ color: "var(--primary)" }}>Eurovision</em>.
        </h1>
        <p
          className="muted"
          style={{ fontSize: 17, maxWidth: 600, margin: "18px auto 30px" }}
        >
          Make group decisions the fun way. Add your contenders with photos, share one
          link, and let every voter hand out their 1 through 12 points.
        </p>

        <div className="row" style={{ justifyContent: "center" }}>
          {configured && ready ? (
            <Link href={ctaHref} className="btn btn-primary btn-lg">
              {ctaLabel}
            </Link>
          ) : (
            <button className="btn btn-primary btn-lg" disabled>
              {configured ? "Loading…" : "Firebase not configured"}
            </button>
          )}
        </div>

        <div
          className="row"
          style={{ justifyContent: "center", marginTop: 36, gap: 6, flexWrap: "wrap" }}
        >
          {POINTS.map((p) => (
            <span key={p} className={`chip${p === 12 ? " chip-top" : ""}`} style={{ cursor: "default" }}>
              {p}
            </span>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 14,
        }}
      >
        <Feature
          title="Add anything"
          body="Movies, restaurants, party themes, hackathon demos. Give each item a title and a photo — uploaded straight from your device."
        />
        <Feature
          title="Share one link"
          body="Open the board to anyone with the link, or invite specific people by email. You can change your mind later."
        />
        <Feature
          title="One ballot each"
          body="Signed-in voters are counted once by account; anonymous voters get a per-browser token and can revisit to edit their ballot."
        />
        <Feature
          title="You hold the curtain"
          body="Only the creator can close the voting. Results stay hidden from voters until the board is finished."
        />
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card stack" style={{ gap: 6 }}>
      <h3 className="section-title" style={{ fontSize: 17 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 14 }}>{body}</p>
    </div>
  );
}
