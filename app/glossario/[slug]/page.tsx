import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Card } from "@/components/ui/Card";
import { glossaryItems, getGlossaryItem } from "@/lib/glossary-data";
import { getBaseUrl } from "@/lib/seo";

type GlossaryDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return glossaryItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: GlossaryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getGlossaryItem(slug);

  if (!item) {
    return {
      title: "Indicador não encontrado"
    };
  }

  return {
    title: item.seoTitle,
    description: item.seoDescription,
    alternates: {
      canonical: `/glossario/${item.slug}`
    },
    openGraph: {
      title: item.seoTitle,
      description: item.seoDescription,
      url: `${getBaseUrl()}/glossario/${item.slug}`,
      siteName: "Foco Invest",
      locale: "pt_BR",
      type: "article"
    }
  };
}

export default async function GlossaryDetailPage({ params }: GlossaryDetailPageProps) {
  const { slug } = await params;
  const item = getGlossaryItem(slug);

  if (!item) {
    notFound();
  }

  const currentItem = item!;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: currentItem.seoTitle,
    description: currentItem.seoDescription,
    mainEntityOfPage: `${getBaseUrl()}/glossario/${currentItem.slug}`,
    author: {
      "@type": "Organization",
      name: "Foco Invest"
    },
    publisher: {
      "@type": "Organization",
      name: "Foco Invest"
    }
  };

  return (
    <section className="container-page py-10">
      <Script
        id={`glossary-jsonld-${currentItem.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/glossario" className="text-sm font-semibold text-[var(--color-primary)]">
        ← Voltar ao glossário
      </Link>

      <div className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          {currentItem.term}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-5xl">
          {currentItem.name}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
          {currentItem.seoDescription}
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <Card>
          <h2 className="text-2xl font-bold">O que é {currentItem.term}?</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">{currentItem.explanation}</p>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Exemplo prático</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">{currentItem.example}</p>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Ponto de atenção</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">{currentItem.attention}</p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Consulte uma ação</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            Depois de entender o indicador, pesquise uma ação para ver cotação, gráfico, oscilações, dividendos e fundamentos em uma tela simples.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {["ITUB4", "PETR4", "VALE3", "BBSE3", "TAEE11"].map((ticker) => (
              <Link key={ticker} href={`/acoes/${ticker.toLowerCase()}`} className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
                {ticker}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
