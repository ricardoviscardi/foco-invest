import { NextResponse } from "next/server";
import { checkSupabaseTable, supabaseSelect } from "@/lib/supabase/server";
import { rankingFIIs, rankingStocks } from "@/lib/stocks/stock-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AssetQualityRow = {
  ticker: string;
  kind: "stock" | "fii";
  cnpj: string | null;
};

type QuoteQualityRow = {
  ticker: string;
  price: number | null;
  market_cap: number | null;
  quote_date: string | null;
};

type HistoryQualityRow = {
  ticker: string;
  date: string;
};

type IndicatorQualityRow = {
  ticker: string;
  reference_date: string;
  dividend_yield: number | null;
  pvp: number | null;
  pe: number | null;
  roe: number | null;
};

type FinancialQualityRow = {
  ticker: string;
  period_type: "annual" | "quarterly";
  reference_date: string | null;
};

function uniqueCount(values: Array<string | null | undefined>): number {
  return new Set(values.filter(Boolean)).size;
}

export async function GET() {
  const tables = await Promise.all([
    checkSupabaseTable("assets"),
    checkSupabaseTable("asset_quotes"),
    checkSupabaseTable("asset_price_history"),
    checkSupabaseTable("asset_financials"),
    checkSupabaseTable("asset_dividends"),
    checkSupabaseTable("asset_indicators")
  ]);

  const [assets, quotes, history, indicators, financials] = await Promise.all([
    supabaseSelect<AssetQualityRow>("assets", { select: "ticker,kind,cnpj", limit: 1000 }),
    supabaseSelect<QuoteQualityRow>("asset_quotes", { select: "ticker,price,market_cap,quote_date", order: "quote_date.desc", limit: 1000 }),
    supabaseSelect<HistoryQualityRow>("asset_price_history", { select: "ticker,date", order: "date.desc", limit: 5000 }),
    supabaseSelect<IndicatorQualityRow>("asset_indicators", { select: "ticker,reference_date,dividend_yield,pvp,pe,roe", order: "reference_date.desc", limit: 1000 }),
    supabaseSelect<FinancialQualityRow>("asset_financials", { select: "ticker,period_type,reference_date", order: "reference_date.desc", limit: 3000 })
  ]);

  const stockCount = assets.filter((asset) => asset.kind === "stock").length;
  const fiiCount = assets.filter((asset) => asset.kind === "fii").length;
  const assetsWithQuote = uniqueCount(quotes.filter((quote) => quote.price !== null).map((quote) => quote.ticker));
  const assetsWithHistory = uniqueCount(history.map((row) => row.ticker));
  const assetsWithIndicators = uniqueCount(indicators.map((row) => row.ticker));
  const assetsWithMarketCap = uniqueCount(quotes.filter((quote) => quote.market_cap !== null).map((quote) => quote.ticker));
  const assetsWithCnpj = uniqueCount(assets.filter((asset) => asset.cnpj).map((asset) => asset.ticker));
  const assetsWithAnnualFinancials = uniqueCount(financials.filter((row) => row.period_type === "annual").map((row) => row.ticker));
  const assetsWithQuarterlyFinancials = uniqueCount(financials.filter((row) => row.period_type === "quarterly").map((row) => row.ticker));
  const plannedStocks = new Set(rankingStocks).size;
  const plannedFIIs = new Set(rankingFIIs).size;

  return NextResponse.json({
    ok: true,
    summary: {
      assetsTotal: assets.length,
      stocks: stockCount,
      fiis: fiiCount,
      assetsWithQuote,
      assetsWithHistory,
      assetsWithIndicators,
      assetsWithMarketCap,
      assetsWithCnpj,
      assetsWithAnnualFinancials,
      assetsWithQuarterlyFinancials,
      plannedCoverage: {
        monitoredStocks: plannedStocks,
        monitoredFIIs: plannedFIIs,
        note: "Base monitorada inicial. Não representa ainda todos os ativos existentes na B3."
      }
    },
    tables,
    note: "Relatório técnico de qualidade da base. Use para auditoria interna antes do deploy."
  });
}
