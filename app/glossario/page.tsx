import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { glossaryItems } from "@/lib/glossary-data";

export const metadata: Metadata = {
  title: "Glossário de Indicadores Fundamentalistas",
  description:
    "Entenda P/L, P/VP, Dividend Yield, ROE, ROIC, margens, EV/EBITDA e outros indicadores usados para analisar ações.",
  alternates: {
    canonical: "/glossario"
  }
};

export default function GlossaryPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Glossário"
        title="Entenda os principais indicadores"
        description="Veja o que cada indicador significa, como interpretar e quais cuidados considerar antes de tirar conclusões."
      />

      <div className="grid gap-5">
        {glossaryItems.map((item) => (
          <Card key={item.slug}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  {item.term}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                  {item.name}
                </h2>
              </div>
              <Link href={`/glossario/${item.slug}`} className="text-sm font-semibold text-[var(--color-primary)]">
                Ver explicação completa
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-[var(--color-background-alt)] p-4">
                <p className="text-sm font-bold text-[var(--color-text)]">O que é</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {item.explanation}
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--color-background-alt)] p-4">
                <p className="text-sm font-bold text-[var(--color-text)]">Exemplo</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {item.example}
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--color-background-alt)] p-4">
                <p className="text-sm font-bold text-[var(--color-text)]">Atenção</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {item.attention}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="text-xl font-bold">Aviso importante</h2>
        <p className="mt-3 leading-7 text-[var(--color-muted)]">
          Indicadores ajudam a organizar a análise, mas não devem ser usados isoladamente.
          Empresas do mesmo setor podem ser comparadas com mais segurança do que empresas de setores diferentes.
          As informações do Foco Invest têm finalidade educacional e não são recomendação de investimento.
        </p>
      </Card>
    </section>
  );
}
