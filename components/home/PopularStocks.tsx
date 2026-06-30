import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { popularStocks } from "@/lib/stocks/stock-list";

export function PopularStocks() {
  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Ações populares
          </p>
          <h2 className="mt-2 text-2xl font-bold">Comece pelos ativos mais buscados</h2>
        </div>
        <Link href="/acoes" className="text-sm font-semibold text-[var(--color-primary)]">
          Ver todas
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {popularStocks.slice(0, 5).map((ticker) => (
          <Link key={ticker} href={`/acoes/${ticker.toLowerCase()}`}>
            <Card className="h-full">
              <p className="font-bold">{ticker}</p>
              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                Ver cotação, gráfico, indicadores e fundamentos.
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
