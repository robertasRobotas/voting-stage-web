import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeCta } from "@/app/components/home-cta";
import { JsonLd } from "@/app/components/json-ld";
import { DISCLAIMER, SITE_NAME, siteUrl } from "@/lib/site";
import { USE_CASES, findUseCase } from "@/lib/use-cases";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Only the known slugs exist; anything else is a 404 rather than a render attempt.
export const dynamicParams = false;

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const useCase = findUseCase(slug);
  if (!useCase) return {};
  const path = `/ideas/${useCase.slug}`;
  return {
    // `absolute` skips the "· Voting Stage" suffix — these titles are tuned to length.
    title: { absolute: useCase.metaTitle },
    description: useCase.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: useCase.metaTitle,
      description: useCase.metaDescription,
      url: path,
      type: "article",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: useCase.metaTitle,
      description: useCase.metaDescription,
    },
  };
}

export default async function IdeaPage({ params }: PageProps) {
  const { slug } = await params;
  const useCase = findUseCase(slug);
  if (!useCase) notFound();
  const others = USE_CASES.filter((u) => u.slug !== useCase.slug);
  const url = siteUrl();

  return (
    <article className="stack" style={{ gap: 40, paddingTop: 20, maxWidth: 780 }}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: SITE_NAME, item: url },
            {
              "@type": "ListItem",
              position: 2,
              name: useCase.label,
              item: `${url}/ideas/${useCase.slug}`,
            },
          ],
        }}
      />

      <header className="stack" style={{ gap: 14 }}>
        <nav className="small muted" aria-label="Breadcrumb">
          <Link href="/">{SITE_NAME}</Link> / {useCase.label}
        </nav>
        <h1 className="page-title" style={{ fontSize: "clamp(30px, 5vw, 42px)" }}>
          <span aria-hidden>{useCase.emoji}</span> {useCase.heading}
        </h1>
        <p className="muted" style={{ fontSize: 17 }}>{useCase.intro}</p>
        <div className="row">
          <HomeCta label="Create this board — it's free" />
        </div>
      </header>

      <section className="card stack" style={{ gap: 12 }}>
        <h2 className="section-title">What a board looks like</h2>
        <ul className="stack" style={{ listStyle: "none", gap: 8 }}>
          {useCase.contenders.map((c, i) => (
            <li key={c} className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
              <span
                className={`chip${i === 0 ? " chip-top" : ""}`}
                style={{ cursor: "default" }}
                aria-hidden
              >
                {[12, 10, 8, 7, 6, 5][i] ?? "·"}
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="hint">
          Each voter places 12, 10, 8, 7, 6, 5, 4, 3, 2 and 1 points — every value once.
        </p>
      </section>

      <section className="stack" style={{ gap: 8 }}>
        <h2 className="section-title">Why Eurovision-style points work here</h2>
        <p className="muted">{useCase.whyPoints}</p>
      </section>

      <section className="stack" style={{ gap: 8 }}>
        <h2 className="section-title">How to run it</h2>
        <ol className="stack muted" style={{ gap: 6, paddingLeft: 20 }}>
          <li>Create a board and add your options (photos optional).</li>
          <li>Share the link or QR code with your group.</li>
          <li>Everyone hands out their points from their own phone.</li>
          <li>Finish the voting to reveal the scoreboard to everyone.</li>
        </ol>
      </section>

      <section className="stack" style={{ gap: 8 }}>
        <h2 className="section-title">Tips</h2>
        <ul className="stack muted" style={{ gap: 6, paddingLeft: 20 }}>
          {useCase.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <h2 className="section-title">More things to vote on</h2>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {others.map((u) => (
            <Link key={u.slug} href={`/ideas/${u.slug}`} className="btn btn-ghost btn-sm">
              <span aria-hidden>{u.emoji}</span> {u.label}
            </Link>
          ))}
        </div>
      </section>

      <footer className="stack" style={{ gap: 16 }}>
        <div className="row">
          <HomeCta label="Start your voting board" />
        </div>
        <p className="hint">{DISCLAIMER}</p>
      </footer>
    </article>
  );
}
