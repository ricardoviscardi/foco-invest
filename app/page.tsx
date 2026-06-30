import type { Metadata } from "next";
import Link from "next/link";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { HeroSearch } from "@/components/home/HeroSearch";
import { PopularFIIs } from "@/components/home/PopularFIIs";
import { PopularStocks } from "@/components/home/PopularStocks";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Cotação, indicadores e fundamentos de ações brasileiras",
  description:
    "Pesquise ações brasileiras e FIIs por ticker e veja cotação, gráfico, oscilações, dividendos, indicadores e fundamentos em uma tela simples.",
  alternates: {
    canonical: "/"
  }
};

export default function HomePage() {
  return (
    <>
      <HeroSearch />

      <section className="container-page py-12">
        <PopularStocks />
      </section>

      <section className="container-page py-4">
        <PopularFIIs />
      </section>

      <section className="container-page py-8">
        <SectionHeader
          eyebrow="Por que usar"
          title="Fundamentos sem poluição visual"
          description="O Foco Invest organiza os principais dados de uma ação ou FII por ordem de importância, com explicações simples e uma experiência direta de consulta."
        />
        <BenefitsSection />
      </section>

      <section className="container-page py-8">
        <Card>
          <h2 className="text-2xl font-bold">Consulte ações brasileiras e FIIs com clareza</h2>
          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            O Foco Invest reúne cotação, gráfico, oscilações, dividendos, indicadores-chave e dados fundamentalistas para ajudar investidores a entenderem melhor ativos da bolsa brasileira. A proposta é apresentar os dados de forma simples, sem excesso de informações e sem recomendação de investimento.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/sobre" className="rounded-full border border-[var(--color-border)] px-4 py-2 text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
              Sobre o projeto
            </Link>
            <Link href="/contato" className="rounded-full border border-[var(--color-border)] px-4 py-2 text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
              Contato
            </Link>
          </div>
        </Card>
      </section>
    </>
  );
}
