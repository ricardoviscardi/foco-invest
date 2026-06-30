import { fetchBrapiBundle } from "@/lib/stocks/brapi-client";
import { getStockFromSupabase } from "@/lib/stocks/supabase-stock-repository";
import { createUnavailableStock, mapBrapiToStockData } from "@/lib/stocks/brapi-mapper";
import { getCachedValue, setCachedValue } from "@/lib/stocks/api-cache";
import { mockStocks } from "@/lib/stocks/mock-stocks";
import type { StockData } from "@/types/stock";

const STOCK_CACHE_VERSION = "v153";
const STOCK_CACHE_TTL_MS = 15 * 60 * 1000;
const STOCK_STALE_TTL_MS = 6 * 60 * 60 * 1000;

export function getAllStocks(): StockData[] {
  return mockStocks;
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function withCacheWarning(stock: StockData, state: "hit" | "stale", ageMs: number | null): StockData {
  if (state !== "stale") {
    return stock;
  }

  const ageMinutes = ageMs === null ? null : Math.round(ageMs / 60_000);
  const staleMessage = ageMinutes === null
    ? "Dados exibidos a partir do cache temporário."
    : `Dados exibidos a partir do cache temporário de aproximadamente ${ageMinutes} min.`;

  return {
    ...stock,
    warnings: Array.from(new Set([...(stock.warnings ?? []), staleMessage]))
  };
}

export async function getStockByTicker(ticker: string): Promise<StockData> {
  const normalizedTicker = normalizeTicker(ticker);

  if (!normalizedTicker || normalizedTicker === "—") {
    return createUnavailableStock("—", "Digite um ticker válido.");
  }

  const cacheKey = `${STOCK_CACHE_VERSION}:stock:${normalizedTicker}`;
  const cached = getCachedValue<StockData>(cacheKey);

  if (cached.state === "hit" && cached.value) {
    return cached.value;
  }

  const supabaseStock = await getStockFromSupabase(normalizedTicker);

  if (supabaseStock) {
    return setCachedValue(cacheKey, supabaseStock, STOCK_CACHE_TTL_MS, STOCK_STALE_TTL_MS);
  }

  const bundle = await fetchBrapiBundle(normalizedTicker);

  const hasAnyData = Boolean(
    bundle.classicQuote ||
    bundle.quote ||
    bundle.profile ||
    bundle.statistics ||
    bundle.financialData ||
    bundle.yahooHistory ||
    bundle.yahooQuote ||
    bundle.yahooSummary ||
    bundle.fundamentus
  );

  if (!hasAnyData) {
    if (cached.value) {
      return withCacheWarning(cached.value, "stale", cached.ageMs);
    }

    return createUnavailableStock(
      normalizedTicker,
      "A brapi não retornou dados para este ticker. Verifique o token, o plano e se o ativo existe na cobertura da API."
    );
  }

  const stock = mapBrapiToStockData({
    ticker: normalizedTicker,
    classicQuote: bundle.classicQuote,
    quote: bundle.quote,
    profile: bundle.profile,
    statistics: bundle.statistics,
    statisticsHistory: bundle.statisticsHistory,
    financialData: bundle.financialData,
    financialDataHistory: bundle.financialDataHistory,
    balanceAnnual: bundle.balanceAnnual,
    balanceQuarterly: bundle.balanceQuarterly,
    incomeAnnual: bundle.incomeAnnual,
    incomeQuarterly: bundle.incomeQuarterly,
    cashAnnual: bundle.cashAnnual,
    cashQuarterly: bundle.cashQuarterly,
    dividends: bundle.dividends,
    historical: bundle.historical,
    yahooHistory: bundle.yahooHistory,
    yahooQuote: bundle.yahooQuote,
    yahooSummary: bundle.yahooSummary,
    fundamentus: bundle.fundamentus
  });

  return setCachedValue(cacheKey, stock, STOCK_CACHE_TTL_MS, STOCK_STALE_TTL_MS);
}
