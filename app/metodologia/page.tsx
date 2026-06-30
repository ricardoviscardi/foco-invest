import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Metodologia",
  description:
    "Entenda como o Foco Invest organiza cotações, indicadores e dados fundamentalistas para consulta educacional."
};

export default function MethodologyPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Metodologia"
        title="Como o Foco Invest organiza as informações"
        description="Nossa proposta é transformar dados financeiros em uma experiência simples, objetiva e fácil de consultar."
      />

      <div className="grid gap-5">
        <Card>
          <h2 className="text-xl font-bold">Organização dos dados</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            O Foco Invest consolida informações de mercado, histórico de preços,
            proventos, indicadores e dados fundamentalistas em uma estrutura padronizada.
            Os dados passam por tratamento interno para facilitar a leitura e reduzir
            ruídos na comparação entre ativos.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Indicadores e cálculos</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            Indicadores como dividend yield, P/VP, valor patrimonial, margem,
            rentabilidade e valor de mercado podem ser exibidos diretamente ou calculados
            a partir das informações disponíveis. Quando um dado necessário ainda não
            estiver consolidado, o campo pode ser apresentado como indisponível.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Histórico e atualização</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            O histórico de preços e proventos é organizado para permitir consulta por
            períodos e visualização evolutiva dos ativos. As informações podem sofrer
            atualização, revisão ou atraso conforme disponibilidade e processamento da
            base financeira.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Dados indisponíveis</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            O Foco Invest não inventa informações. Quando um indicador, demonstrativo,
            provento ou dado cadastral ainda não estiver consolidado, a interface informa
            a indisponibilidade de forma clara e mantém a consulta do restante da página.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Aviso importante</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            As informações exibidas têm finalidade educacional e informativa. Elas não
            constituem recomendação de compra, venda ou manutenção de ativos, nem
            substituem a análise individual do investidor.
          </p>
        </Card>
      </div>
    </section>
  );
}
