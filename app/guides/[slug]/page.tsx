import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeCta } from "@/app/components/home-cta";
import { JsonLd } from "@/app/components/json-ld";
import { GUIDES, findGuide } from "@/lib/guides";
import { DISCLAIMER, SITE_NAME, siteUrl } from "@/lib/site";
import { USE_CASES } from "@/lib/use-cases";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return {};
  const path = `/guides/${guide.slug}`;
  return {
    title: { absolute: guide.metaTitle },
    description: guide.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url: path,
      type: "article",
      publishedTime: guide.published,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.metaDescription,
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();
  const url = siteUrl();
  const related = USE_CASES.filter((u) => guide.relatedIdeas.includes(u.slug));
  const otherGuides = GUIDES.filter((g) => g.slug !== guide.slug);

  return (
    <article className="stack" style={{ gap: 32, paddingTop: 20, maxWidth: 720 }}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.metaDescription,
          datePublished: guide.published,
          dateModified: guide.published,
          mainEntityOfPage: `${url}/guides/${guide.slug}`,
          author: { "@type": "Organization", name: SITE_NAME, url },
          publisher: { "@type": "Organization", name: SITE_NAME, url },
        }}
      />

      <header className="stack" style={{ gap: 12 }}>
        <nav className="small muted" aria-label="Breadcrumb">
          <Link href="/">{SITE_NAME}</Link> / <Link href="/guides">Guides</Link>
        </nav>
        <h1 className="page-title" style={{ fontSize: "clamp(30px, 5vw, 42px)" }}>{guide.title}</h1>
        <p className="muted" style={{ fontSize: 17 }}>{guide.excerpt}</p>
      </header>

      {guide.sections.map((section) => (
        <section key={section.heading} className="stack" style={{ gap: 10 }}>
          <h2 className="section-title">{section.heading}</h2>
          {section.paragraphs?.map((text) => (
            <p key={text} style={{ lineHeight: 1.65 }}>{text}</p>
          ))}
          {section.list && (
            <ul className="stack" style={{ gap: 6, paddingLeft: 20, lineHeight: 1.6 }}>
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="card stack" style={{ gap: 12, alignItems: "flex-start" }}>
        <h2 className="section-title">Try it with your group</h2>
        <p className="muted">
          Create a board, share one link, and let everyone hand out their points. It&apos;s free
          and takes about a minute.
        </p>
        <HomeCta />
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <h2 className="section-title">Related</h2>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {related.map((u) => (
            <Link key={u.slug} href={`/ideas/${u.slug}`} className="btn btn-ghost btn-sm">
              <span aria-hidden>{u.emoji}</span> {u.label}
            </Link>
          ))}
          {otherGuides.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="btn btn-ghost btn-sm">
              {g.title}
            </Link>
          ))}
        </div>
      </section>

      <p className="hint">{DISCLAIMER}</p>
    </article>
  );
}
