import type { DividendSummary } from "@/types/stock";
import { Card } from "@/components/ui/Card";

type DividendSummaryCardProps = {
  summary: DividendSummary;
};

export function DividendSummaryCard({ summary }: DividendSummaryCardProps) {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
        Dividendos 12m
      </p>

      <div className="mt-5">
        <p className="text-4xl font-bold text-[var(--color-positive)]">
          {summary.yield12m}
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
          {summary.cash12m === "Não disponível" ? "Valor por ação/cota em consolidação" : summary.cash12m}
        </p>
        <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
          Soma de proventos dos últimos 12 meses em relação à cotação.
        </p>
      </div>
    </Card>
  );
}
