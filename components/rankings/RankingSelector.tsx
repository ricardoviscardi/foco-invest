"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export type RankingItem = {
  ticker: string;
  name: string;
  sector: string;
  value: number | null;
  displayValue: string;
  hasData: boolean;
};

export type RankingTableData = {
  title: string;
  description: string;
  items: RankingItem[];
};

export type RankingGroup = {
  label: string;
  description: string;
  tables: RankingTableData[];
};

type RankingSelectorProps = {
  stocks: RankingGroup;
  fiis: RankingGroup;
};

type Mode = "stocks" | "fiis";

export function RankingSelector({ stocks, fiis }: RankingSelectorProps) {
  const [mode, setMode] = useState<Mode>("stocks");
  const active = mode === "stocks" ? stocks : fiis;
  const linkBase = mode === "stocks" ? "/acoes" : "/fiis";

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Tipo de ativo
            </p>
            <h2 className="mt-2 text-2xl font-bold">Escolha o universo do ranking</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Os rankings usam uma lista monitorada do Foco Invest, dados retornados pela brapi, Yahoo Finance complementar, cálculo com proventos e cache local. Ainda não é um ranking de todos os ativos da B3.
            </p>
          </div>

          <div className="inline-flex rounded-2xl border border-[var(--color-border)] bg-white p-1">
            <button
              type="button"
              onClick={() => setMode("stocks")}
              className={mode === "stocks"
                ? "rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white"
                : "rounded-xl px-5 py-2 text-sm font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"}
            >
              Ações
            </button>
            <button
              type="button"
              onClick={() => setMode("fiis")}
              className={mode === "fiis"
                ? "rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white"
                : "rounded-xl px-5 py-2 text-sm font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"}
            >
              FIIs
            </button>
          </div>
        </div>
      </Card>

      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-5">
        <h2 className="text-xl font-bold">{active.label}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{active.description}</p>
      </div>

      {active.tables.map((table) => (
        <RankingTable key={`${mode}-${table.title}`} table={table} linkBase={linkBase} />
      ))}
    </div>
  );
}

function RankingTable({ table, linkBase }: { table: RankingTableData; linkBase: string }) {
  return (
    <Card>
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-xl font-bold">{table.title}</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{table.description}</p>
        </div>
        <p className="text-xs font-semibold text-[var(--color-muted)]">Mín. 5 • Máx. 10 ativos</p>
      </div>

      {table.items.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="text-[var(--color-muted)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="py-3 pr-4 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Ticker</th>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Setor/segmento</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {table.items.map((item, index) => (
                <tr key={`${table.title}-${item.ticker}-${index}`} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="py-3 pr-4 font-bold text-[var(--color-primary)]">{index + 1}</td>
                  <td className="px-4 py-3 font-bold">
                    <Link href={`${linkBase}/${item.ticker.toLowerCase()}`} className="text-[var(--color-primary)] hover:underline">
                      {item.ticker}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{item.sector}</td>
                  <td className={item.hasData ? "px-4 py-3 text-right font-bold" : "px-4 py-3 text-right font-semibold text-[var(--color-muted)]"}>
                    {item.displayValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-alt)] p-6 text-sm text-[var(--color-muted)]">
          Ainda não há dados suficientes para montar este ranking.
        </div>
      )}
    </Card>
  );
}
