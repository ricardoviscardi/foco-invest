import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { popularFIIs, stockSuggestionsFallback } from "@/lib/stocks/stock-list";

export const metadata: Metadata = {
  title: "FIIs brasileiros",
  description:
    "Consulte fundos imobiliários por ticker e veja cotação, gráfico, oscilações, dividendos e informações disponíveis.",
  alternates: {
    canonical: "/fiis"
  }
};

function nameForTicker(ticker: string): string {
  return stockSuggestionsFallback.find((item) => item.symbol === ticker)?.name ?? ticker;
}

export default function FIIsPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="FIIs"
        title="Consulte fundos imobiliários"
        description="Escolha um FII ou pesquise diretamente pelo ticker para visualizar cotação, gráfico, oscilações, dividendos e informações disponíveis nas fontes integradas."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {popularFIIs.map((ticker) => (
          <Link key={ticker} href={`/fiis/${ticker.toLowerCase()}`}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]">
              <p className="text-lg font-bold text-[var(--color-text)]">
                {ticker}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                {nameForTicker(ticker)}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Abrir cotação, gráfico, oscilações, dividendos e dados disponíveis do fundo imobiliário.
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
