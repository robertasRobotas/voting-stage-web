import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { SITE_NAME } from "@/lib/site";
import { USE_CASES } from "@/lib/use-cases";

/** Site-wide links: every marketing page is one click from every other page. */
export function SiteFooter() {
  return (
    <footer
      className="page"
      style={{ borderTop: "1px solid var(--border)", marginTop: 64, paddingTop: 28, paddingBottom: 40 }}
    >
      <div
        className="small"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24,
        }}
      >
        <nav className="stack" style={{ gap: 6 }} aria-label="Things to vote on">
          <Link href="/ideas" style={{ fontWeight: 600, color: "var(--ink)" }}>
            Things to vote on
          </Link>
          {USE_CASES.map((u) => (
            <Link key={u.slug} href={`/ideas/${u.slug}`} className="muted">
              {u.label}
            </Link>
          ))}
        </nav>
        <nav className="stack" style={{ gap: 6 }} aria-label="Guides">
          <Link href="/guides" style={{ fontWeight: 600, color: "var(--ink)" }}>
            Guides
          </Link>
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="muted">
              {g.title}
            </Link>
          ))}
        </nav>
        <div className="stack muted" style={{ gap: 6 }}>
          <span style={{ fontWeight: 600, color: "var(--ink)" }}>{SITE_NAME}</span>
          <span>Rank anything with friends, Eurovision-style. Free.</span>
          <Link href="/" className="muted">Home</Link>
        </div>
      </div>
    </footer>
  );
}
