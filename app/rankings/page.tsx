import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RankingSelector, type RankingGroup, type RankingItem, type RankingTableData } from "@/components/rankings/RankingSelector";
import { getStockByTicker } from "@/lib/stocks/stock-service";
import { popularFIIs, popularStocks, rankingFIIs, rankingStocks } from "@/lib/stocks/stock-list";
import type { StockData } from "@/types/stock";
import { formatInteger, formatLargeCurrency } from "@/lib/utils/formatters";
import { sanitizeDisplayText } from "@/lib/utils/text";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Rankings de ações e FIIs",
  description:
    "Rankings iniciais de ações brasileiras e FIIs por valor de mercado, dividend yield, P/L, ROE, volume e oscilação de preço."
};

const stockRankingTickers = [
  "PETR4",
  "VALE3",
  "ITUB4",
  "BBAS3",
  "BBSE3",
  "BBDC4",
  "B3SA3",
  "WEGE3",
  "ABEV3",
  "TAEE11",
  "EGIE3",
  "CMIG4",
  "CPLE6",
  "KLBN11",
  "SUZB3",
  "RANI3",
  "CSMG3",
  "RENT3",
  "LREN3",
  "RAIL3"
];

const fiiRankingTickers = [
  "MXRF11",
  "HGLG11",
  "KNRI11",
  "XPML11",
  "VISC11",
  "XPLG11",
  "HGRU11",
  "BTLG11",
  "KNCR11",
  "RBRF11",
  "BCFF11",
  "HSML11"
];

function parseLocaleNumber(value: string | null | undefined): number | null {
  if (!value || value === "Não disponível" || value === "Não informado" || value === "—") return null;

  const hasTrillion = /tri/i.test(value);
  const hasBillion = /bi/i.test(value);
  const hasMillion = /mi/i.test(value);
  const cleaned = value
    .replace(/[R$%+]/g, "")
    .replace(/tri|bi|mi|\/ação|\/cota/gi, "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed)) return null;

  if (hasTrillion) return parsed * 1_000_000_000_000;
  if (hasBillion) return parsed * 1_000_000_000;
  if (hasMillion) return parsed * 1_000_000;

  return parsed;
}

function indicatorValue(stock: StockData, label: string): string | null {
  return stock.indicators.find((indicator) => indicator.label === label)?.value ?? null;
}

function oscillationValue(stock: StockData, label: string): string | null {
  return stock.oscillations.find((oscillation) => oscillation.label === label)?.value ?? null;
}

function fallbackItem(stock: StockData): RankingItem {
  return {
    ticker: stock.ticker,
    name: sanitizeDisplayText(stock.companyName) || stock.ticker,
    sector: sanitizeDisplayText(stock.sector === "Não disponível" ? stock.subsector ?? "Não disponível" : stock.sector) || "Não disponível",
    value: null,
    displayValue: "Não disponível",
    hasData: false
  };
}

function buildRanking(
  stocks: StockData[],
  selector: (stock: StockData) => { value: number | null; displayValue: string | null },
  direction: "asc" | "desc" = "desc",
  minItems = 5,
  maxItems = 10
): RankingItem[] {
  const validItems: RankingItem[] = [];

  for (const stock of stocks) {
    const selected = selector(stock);

    if (selected.value === null || selected.displayValue === null) continue;

    validItems.push({
      ticker: stock.ticker,
      name: sanitizeDisplayText(stock.companyName) || stock.ticker,
      sector: sanitizeDisplayText(stock.sector === "Não disponível" ? stock.subsector ?? "Não disponível" : stock.sector) || "Não disponível",
      value: selected.value,
      displayValue: selected.displayValue,
      hasData: true
    });
  }

  validItems.sort((a, b) => direction === "desc" ? (b.value ?? 0) - (a.value ?? 0) : (a.value ?? 0) - (b.value ?? 0));

  const used = new Set(validItems.map((item) => item.ticker));
  const fillers = stocks
    .filter((stock) => !used.has(stock.ticker))
    .map(fallbackItem);

  return [...validItems, ...fillers].slice(0, Math.max(minItems, Math.min(maxItems, 10)));
}

async function loadStocks(tickers: string[]) {
  const uniqueTickers = Array.from(new Set(tickers)).slice(0, 120);
  const results = await Promise.allSettled(uniqueTickers.map((ticker) => getStockByTicker(ticker)));

  return results
    .filter((result): result is PromiseFulfilledResult<StockData> => result.status === "fulfilled")
    .map((result) => result.value);
}

function stockTables(stocks: StockData[]): RankingTableData[] {
  return [
    {
      title: "Maiores valores de mercado",
      description: "Empresas com maior valor de mercado entre os ativos monitorados.",
      items: buildRanking(stocks, (stock) => ({
        value: stock.quote.marketCap,
        displayValue: stock.quote.marketCap === null ? null : formatLargeCurrency(stock.quote.marketCap)
      }))
    },
    {
      title: "Maiores Dividend Yield 12m",
      description: "Ações com maior dividend yield retornado ou calculado a partir dos proventos dos últimos 12 meses.",
      items: buildRanking(stocks, (stock) => {
        const displayValue = indicatorValue(stock, "DY 12m") ?? indicatorValue(stock, "Div. Yield") ?? stock.dividendSummary.yield12m;
        return { value: parseLocaleNumber(displayValue), displayValue };
      })
    },
    {
      title: "Menor P/L",
      description: "Ações com menor relação preço/lucro positiva.",
      items: buildRanking(stocks, (stock) => {
        const displayValue = indicatorValue(stock, "P/L");
        const value = parseLocaleNumber(displayValue);
        return { value: value !== null && value > 0 ? value : null, displayValue };
      }, "asc")
    },
    {
      title: "Maior ROE",
      description: "Empresas com maior retorno sobre patrimônio líquido quando disponível.",
      items: buildRanking(stocks, (stock) => {
        const displayValue = indicatorValue(stock, "ROE");
        return { value: parseLocaleNumber(displayValue), displayValue };
      })
    },
    {
      title: "Maiores altas em 12 meses",
      description: "Variação aproximada de preço em 12 meses, quando houver histórico suficiente.",
      items: buildRanking(stocks, (stock) => {
        const displayValue = oscillationValue(stock, "12 meses");
        return { value: parseLocaleNumber(displayValue), displayValue };
      })
    }
  ];
}

function fiiTables(fiis: StockData[]): RankingTableData[] {
  return [
    {
      title: "Maiores valores de mercado",
      description: "FIIs com maior valor de mercado entre os fundos monitorados.",
      items: buildRanking(fiis, (stock) => ({
        value: stock.quote.marketCap,
        displayValue: stock.quote.marketCap === null ? null : formatLargeCurrency(stock.quote.marketCap)
      }))
    },
    {
      title: "Maiores Dividend Yield 12m",
      description: "FIIs com maior dividend yield retornado ou calculado a partir dos proventos dos últimos 12 meses.",
      items: buildRanking(fiis, (stock) => {
        const displayValue = indicatorValue(stock, "Div. Yield") ?? stock.dividendSummary.yield12m;
        return { value: parseLocaleNumber(displayValue), displayValue };
      })
    },
    {
      title: "Maior P/VP",
      description: "FIIs com maior relação preço sobre valor patrimonial por cota, quando disponível.",
      items: buildRanking(fiis, (stock) => {
        const displayValue = indicatorValue(stock, "P/VP");
        return { value: parseLocaleNumber(displayValue), displayValue };
      })
    },
    {
      title: "Maiores altas em 12 meses",
      description: "Variação aproximada de preço dos FIIs em 12 meses, quando houver histórico suficiente.",
      items: buildRanking(fiis, (stock) => {
        const displayValue = oscillationValue(stock, "12 meses");
        return { value: parseLocaleNumber(displayValue), displayValue };
      })
    },
    {
      title: "Maior volume negociado",
      description: "FIIs com maior volume do último pregão retornado pela API.",
      items: buildRanking(fiis, (stock) => ({
        value: stock.quote.volume,
        displayValue: stock.quote.volume === null ? null : formatInteger(stock.quote.volume)
      }))
    }
  ];
}

export default async function RankingsPage() {
  const [stocks, fiis] = await Promise.all([
    loadStocks([...rankingStocks, ...stockRankingTickers, ...popularStocks]),
    loadStocks([...rankingFIIs, ...fiiRankingTickers, ...popularFIIs])
  ]);

  const stockGroup: RankingGroup = {
    label: "Rankings de ações",
    description: "Ranking calculado com a base monitorada do Foco Invest, priorizando ativos com dados consolidados de mercado e indicadores disponíveis.",
    tables: stockTables(stocks)
  };

  const fiiGroup: RankingGroup = {
    label: "Rankings de FIIs",
    description: "Ranking calculado com a base monitorada do Foco Invest, priorizando fundos com dados consolidados de mercado, dividendos e indicadores disponíveis.",
    tables: fiiTables(fiis)
  };

  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Rankings"
        title="Rankings de ações e FIIs"
        description="Escolha entre ações e FIIs para ver rankings iniciais por valor de mercado, dividendos, múltiplos, volume e oscilações."
      />

      <RankingSelector stocks={stockGroup} fiis={fiiGroup} />
    </section>
  );
}
