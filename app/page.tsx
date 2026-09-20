import type { Metadata } from "next";
import Link from "next/link";
import { HomeCta } from "./components/home-cta";
import { JsonLd } from "./components/json-ld";
import { FAQ } from "@/lib/faq";
import { DISCLAIMER, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";
import { USE_CASES } from "@/lib/use-cases";

// Set here, not in the root layout: metadata is inherited, and every other
// page claiming "/" as its canonical URL would be wrong.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
    siteName: SITE_NAME,
  },
};

const POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

const STEPS = [
  {
    title: "1. Add your contenders",
    body: "Songs, films, restaurants, names, demos — anything with a shortlist. Give each one a title and, if you like, a photo.",
  },
  {
    title: "2. Share one link",
    body: "Send the link or show the QR code. Open it to everyone, require sign-in for one ballot per person, or invite specific emails.",
  },
  {
    title: "3. Everyone gives their points",
    body: "Each voter drags 12, 10, 8 and the rest onto their favourites. They can change their mind until you close the voting.",
  },
  {
    title: "4. Reveal the winner",
    body: "Finish the voting and the full scoreboard appears for everyone — totals, rankings and who gave their douze points to what.",
  },
];

export default function Home() {
  const url = siteUrl();
  return (
    <div className="stack" style={{ gap: 56, paddingTop: 28 }}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: SITE_NAME,
          url,
          description: SITE_DESCRIPTION,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <section style={{ textAlign: "center", padding: "24px 0 8px" }}>
        <h1
          className="page-title"
          style={{ fontSize: "clamp(38px, 7vw, 58px)", maxWidth: 760, margin: "0 auto" }}
        >
          Vote on anything like it&apos;s <em style={{ color: "var(--primary)" }}>Eurovision</em>.
        </h1>
        <p className="muted" style={{ fontSize: 17, maxWidth: 620, margin: "18px auto 30px" }}>
          Free Eurovision-style voting for any group decision. Add your contenders, share one
          link, and let every voter hand out their 1 to 8, 10 and 12 points. Douze points
          settles it.
        </p>

        <div className="row" style={{ justifyContent: "center" }}>
          <HomeCta />
        </div>

        <div
          className="row"
          aria-hidden
          style={{ justifyContent: "center", marginTop: 36, gap: 6, flexWrap: "wrap" }}
        >
          {POINTS.map((p) => (
            <span key={p} className={`chip${p === 12 ? " chip-top" : ""}`} style={{ cursor: "default" }}>
              {p}
            </span>
          ))}
        </div>
      </section>

      <section className="stack" style={{ gap: 16 }}>
        <h2 className="section-title" style={{ fontSize: 24 }}>How Eurovision-style voting works</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
          }}
        >
          {STEPS.map((s) => (
            <Feature key={s.title} title={s.title} body={s.body} />
          ))}
        </div>
      </section>

      <section className="stack" style={{ gap: 16 }}>
        <div>
          <h2 className="section-title" style={{ fontSize: 24 }}>What will you put to the vote?</h2>
          <p className="muted" style={{ marginTop: 6, maxWidth: 640 }}>
            The 12-point ladder isn&apos;t just for songs. It&apos;s the fairest quick way for a
            group to choose between more than two things.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
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
              <h3 className="section-title" style={{ fontSize: 17 }}>
                <span aria-hidden>{u.emoji}</span> {u.label}
              </h3>
              <p className="muted" style={{ fontSize: 14 }}>{u.metaDescription}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="stack" style={{ gap: 16 }}>
        <h2 className="section-title" style={{ fontSize: 24 }}>Why points beat a plain poll</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
          }}
        >
          <Feature
            title="Second choices count"
            body="A normal poll only hears first choices, so a divisive option can win. Ranked points find the option the whole group is happy with."
          />
          <Feature
            title="One ballot each"
            body="Signed-in voters are counted once per account. Link-only voters get one ballot per browser and can come back to edit it."
          />
          <Feature
            title="You hold the curtain"
            body="Only you see the live scoreboard. Voters see results when you finish the voting — no bandwagon, all suspense."
          />
          <Feature
            title="Nothing to install"
            body="It runs in the browser on any phone. Share a link or a QR code and people are voting in seconds."
          />
        </div>
      </section>

      <section className="stack" style={{ gap: 12, maxWidth: 760 }}>
        <h2 className="section-title" style={{ fontSize: 24 }}>Questions</h2>
        {FAQ.map((f) => (
          <details key={f.q} className="card">
            <summary style={{ fontWeight: 600, cursor: "pointer" }}>{f.q}</summary>
            <p className="muted" style={{ marginTop: 8 }}>{f.a}</p>
          </details>
        ))}
      </section>

      <section style={{ textAlign: "center" }}>
        <h2 className="section-title" style={{ fontSize: 24, marginBottom: 16 }}>
          And the twelve points go to…
        </h2>
        <HomeCta label="Start your voting board" />
        <p className="hint" style={{ marginTop: 28 }}>{DISCLAIMER}</p>
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
