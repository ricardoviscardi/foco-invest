import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { popularStocks } from "@/lib/stocks/stock-list";

export const metadata: Metadata = {
  title: "Ações brasileiras",
  description:
    "Consulte ações brasileiras por ticker e veja cotação, gráfico, oscilações, dividendos, indicadores e fundamentos.",
  alternates: {
    canonical: "/acoes"
  }
};

export default function StocksPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Ações"
        title="Consulte ações brasileiras"
        description="Escolha uma empresa ou pesquise diretamente pelo ticker para visualizar cotação, gráfico, oscilações, indicadores-chave, análise fundamentalista e dividendos."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {popularStocks.map((ticker) => (
          <Link key={ticker} href={`/acoes/${ticker.toLowerCase()}`}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]">
              <p className="text-lg font-bold text-[var(--color-text)]">
                {ticker}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Abrir cotação, gráfico, oscilações, indicadores-chave, análise fundamentalista e dividendos.
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
