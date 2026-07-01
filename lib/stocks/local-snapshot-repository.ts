import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  buildStockDataFromSupabaseRows,
  type AssetRow,
  type DividendRow,
  type FinancialRow,
  type HistoryRow,
  type IndicatorRow,
  type QuoteRow,
} from "@/lib/stocks/supabase-stock-repository";
import type { StockData } from "@/types/stock";

type SnapshotPayload = {
  version?: string;
  generatedAt?: string;
  ticker: string;
  asset: AssetRow;
  quotes?: QuoteRow[];
  historyRows?: HistoryRow[];
  financials?: FinancialRow[];
  dividendRows?: DividendRow[];
  indicatorRows?: IndicatorRow[];
};

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function snapshotPathForTicker(ticker: string): string {
  return path.join(process.cwd(), "public", "data", "snapshots", "stocks", `${ticker}.json`);
}

export function getSnapshotStatus() {
  const folder = path.join(process.cwd(), "public", "data", "snapshots", "stocks");
  return {
    configured: existsSync(folder),
    folder,
  };
}

export async function getStockFromLocalSnapshot(ticker: string): Promise<StockData | null> {
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) return null;

  const filePath = snapshotPathForTicker(normalizedTicker);
  if (!existsSync(filePath)) return null;

  try {
    const payload = JSON.parse(readFileSync(filePath, "utf8")) as SnapshotPayload;

    if (!payload.asset || normalizeTicker(payload.ticker) !== normalizedTicker) {
      return null;
    }

    const stock = buildStockDataFromSupabaseRows({
      asset: payload.asset,
      quotes: payload.quotes ?? [],
      historyRows: payload.historyRows ?? [],
      financials: payload.financials ?? [],
      dividendRows: payload.dividendRows ?? [],
      indicatorRows: payload.indicatorRows ?? [],
    });

    return {
      ...stock,
      source: "Snapshot local Foco Invest",
      warnings: Array.from(new Set([
        ...(stock.warnings ?? []),
        "Dados lidos do snapshot local porque o Supabase não está acessível nesta rede.",
      ])),
    };
  } catch {
    return null;
  }
}
