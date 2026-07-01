import { fetchBrapiBundle } from "@/lib/stocks/brapi-client";
import { getStockFromSupabase } from "@/lib/stocks/supabase-stock-repository";
import { getStockFromLocalSnapshot } from "@/lib/stocks/local-snapshot-repository";
import { getStockFromRemoteSnapshot } from "@/lib/stocks/remote-snapshot-repository";
import {
  createUnavailableStock,
  mapBrapiToStockData,
} from "@/lib/stocks/brapi-mapper";
import { getCachedValue, setCachedValue } from "@/lib/stocks/api-cache";
import { mockStocks } from "@/lib/stocks/mock-stocks";
import type {
  AnalysisTable,
  DividendEvent,
  DividendSummary,
  FundamentalAnalysisData,
  StockData,
  StockFinancialRow,
  StockIndicator,
  CompanyInfoRow,
  StockQuote,
} from "@/types/stock";
import {
  formatCurrency,
  formatInteger,
  formatLargeCurrency,
  formatPlainPercent,
  toFiniteNumber,
} from "@/lib/utils/formatters";

const STOCK_CACHE_VERSION = "v15312";
const STOCK_CACHE_TTL_MS = 15 * 60 * 1000;
const STOCK_STALE_TTL_MS = 6 * 60 * 60 * 1000;

const UNAVAILABLE_VALUES = new Set([
  "",
  "—",
  "-",
  "não disponível",
  "nao disponível",
  "nao disponivel",
  "não disponivel",
  "em consolidação",
  "em consolidacao",
  "histórico em validação",
  "historico em validacao",
]);

export function getAllStocks(): StockData[] {
  return mockStocks;
}

function normalizeTicker(ticker: string): string {
  return ticker
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function hasUsefulText(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return !UNAVAILABLE_VALUES.has(normalized);
}

function usefulOrFallback<T extends string | null | undefined>(
  primary: T,
  fallback: T,
): T {
  return hasUsefulText(primary) ? primary : fallback;
}

function normalizeLabel(label: string): string {
  const clean = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  if (clean === "dy12m" || (clean.includes("dividend") && clean.includes("yield")) || clean.includes("divyield")) return "dividendyield";
  if (clean === "pl" || clean.includes("priceearnings")) return "pl";
  if (clean === "pvp" || clean.includes("pricetobook")) return "pvp";
  if (clean.includes("roe") || clean.includes("returnonequity")) return "roe";
  if (clean.includes("roic") || clean.includes("returnoninvestedcapital")) return "roic";
  if (clean.includes("margemliquida") || clean.includes("mgliquida") || clean.includes("profitmargins")) return "margemliquida";
  if (clean.includes("evebitda") || clean.includes("enterprisevalueebitda")) return "evebitda";
  if (clean.includes("divliqebitda") || clean.includes("netdebtebitda")) return "divliqebitda";
  if (clean === "vpa" || clean.includes("bookvalue")) return "vpa";
  if (clean.includes("valordemercado") || clean.includes("marketcap")) return "marketcap";
  if (clean.includes("lpa") || clean.includes("earningspershare")) return "lpa";

  return clean;
}

function parseBrazilianNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const clean = value
    .replace(/R\$/gi, "")
    .replace(/%/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePercent(value: string | null | undefined): number | null {
  if (!value || !value.includes("%")) return null;
  return parseBrazilianNumber(value);
}

function isLikelyFii(stock: StockData): boolean {
  return stock.sector.toLowerCase().includes("fundo") || stock.companyInfo.some((row) => row.label.toLowerCase().includes("mandato"));
}

function isPlausibleDividendValue(value: string | null | undefined, isFii: boolean): boolean {
  const percent = parsePercent(value);
  if (percent === null) return false;
  return Math.abs(percent) <= (isFii ? 35 : 25);
}

function sanitizeDividendIndicator(indicator: StockIndicator, isFii: boolean): StockIndicator {
  if (normalizeLabel(indicator.label) !== "dividendyield") return indicator;
  return isPlausibleDividendValue(indicator.value, isFii)
    ? indicator
    : { ...indicator, value: "Não disponível", status: "indisponível" };
}

function mergeIndicators(
  primary: StockIndicator[],
  fallback: StockIndicator[],
  isFii: boolean,
): StockIndicator[] {
  const fallbackMap = new Map<string, StockIndicator>();

  for (const indicator of fallback.map((item) => sanitizeDividendIndicator(item, isFii))) {
    if (hasUsefulText(indicator.value)) {
      fallbackMap.set(normalizeLabel(indicator.label), indicator);
    }
  }

  const usedKeys = new Set<string>();
  const merged = primary.map((indicator) => {
    const key = normalizeLabel(indicator.label);
    usedKeys.add(key);
    const cleanPrimary = sanitizeDividendIndicator(indicator, isFii);

    if (hasUsefulText(cleanPrimary.value)) return cleanPrimary;

    const complement = fallbackMap.get(key);
    return complement
      ? { ...cleanPrimary, value: complement.value, status: complement.status }
      : cleanPrimary;
  });

  const extraUsefulFallbacks = [...fallbackMap.entries()]
    .filter(([key]) => !usedKeys.has(key))
    .map(([, indicator]) => indicator)
    .slice(0, 4);

  return [...merged, ...extraUsefulFallbacks];
}

function mergeRowsByLabel<T extends { label: string; value: string }>(
  primary: T[],
  fallback: T[],
): T[] {
  const fallbackMap = new Map<string, T>();

  for (const row of fallback) {
    if (hasUsefulText(row.value)) fallbackMap.set(normalizeLabel(row.label), row);
  }

  const used = new Set<string>();
  const merged = primary.map((row) => {
    const key = normalizeLabel(row.label);
    used.add(key);
    if (hasUsefulText(row.value)) return row;
    const complement = fallbackMap.get(key);
    return complement ? { ...row, value: complement.value } : row;
  });

  return [
    ...merged,
    ...[...fallbackMap.entries()]
      .filter(([key]) => !used.has(key))
      .map(([, row]) => row),
  ];
}

function mergeFinancialRows(
  primary: StockFinancialRow[],
  fallback: StockFinancialRow[],
): StockFinancialRow[] {
  return mergeRowsByLabel(primary, fallback);
}

function mergeCompanyInfoRows(
  primary: CompanyInfoRow[],
  fallback: CompanyInfoRow[],
): CompanyInfoRow[] {
  return mergeRowsByLabel(primary, fallback);
}

function tableScore(table: AnalysisTable): number {
  return table.rows.reduce(
    (score, row) => score + row.values.filter(hasUsefulText).length,
    0,
  );
}

function isPlaceholderColumn(column: string): boolean {
  const normalized = column.trim().toLowerCase();
  return normalized === "" || normalized === "—" || normalized === "atual";
}

function mergeColumns(primary: string[], fallback: string[]): string[] {
  const result: string[] = [];

  for (const column of [...primary, ...fallback]) {
    if (!result.includes(column)) result.push(column);
  }

  const useful = result.filter((column) => !isPlaceholderColumn(column));
  const placeholders = result.filter(isPlaceholderColumn);
  const orderedUseful = useful.sort((a, b) => {
    const na = Number(a.replace(/\D/g, ""));
    const nb = Number(b.replace(/\D/g, ""));
    if (Number.isFinite(na) && Number.isFinite(nb) && na > 1900 && nb > 1900) return nb - na;
    return a.localeCompare(b);
  });

  return [...orderedUseful, ...placeholders].slice(0, 7);
}

function valueAt(table: AnalysisTable, rowLabel: string, column: string): string {
  const row = table.rows.find((item) => normalizeLabel(item.label) === normalizeLabel(rowLabel));
  if (!row) return "—";
  const index = table.columns.indexOf(column);
  if (index < 0) return "—";
  return row.values[index] ?? "—";
}

function tableUsesOnlyCurrentColumn(table: AnalysisTable): boolean {
  return table.columns.length <= 1 && table.columns.every(isPlaceholderColumn);
}

function mergeAnalysisTable(primary: AnalysisTable, fallback: AnalysisTable): AnalysisTable {
  const primaryScore = tableScore(primary);
  const fallbackScore = tableScore(fallback);

  if (primaryScore === 0 && fallbackScore > 0) return fallback;
  if (fallbackScore === 0) return primary;

  // A fonte complementar pode trazer apenas uma coluna "Atual". Isso ajuda nos
  // cards-resumo, mas não deve substituir ou empobrecer a tabela histórica da
  // análise fundamentalista. Quando a base principal tem anos/trimestres, ela
  // permanece como fonte da tabela.
  if (primaryScore > 0 && tableUsesOnlyCurrentColumn(fallback)) {
    return primary;
  }

  const columns = mergeColumns(primary.columns, fallback.columns);
  const labels = Array.from(new Set([...primary.rows, ...fallback.rows].map((row) => row.label)));

  const rows = labels.map((label) => ({
    label,
    values: columns.map((column) => {
      const primaryValue = valueAt(primary, label, column);
      if (hasUsefulText(primaryValue)) return primaryValue;

      const fallbackValue = valueAt(fallback, label, column);
      if (hasUsefulText(fallbackValue)) return fallbackValue;

      // Quando a fonte complementar traz apenas a coluna Atual, usamos esse valor
      // somente para a coluna Atual. Não espalhamos valor atual em anos anteriores.
      if (isPlaceholderColumn(column)) {
        const currentFallback = valueAt(fallback, label, "Atual");
        if (hasUsefulText(currentFallback)) return currentFallback;
      }

      return "—";
    }),
  }));

  return {
    columns,
    rows,
    emptyMessage: primary.emptyMessage ?? fallback.emptyMessage,
  };
}

function mergeFundamentalAnalysis(
  primary: FundamentalAnalysisData,
  fallback: FundamentalAnalysisData,
): FundamentalAnalysisData {
  return {
    indicators: {
      annual: mergeAnalysisTable(primary.indicators.annual, fallback.indicators.annual),
      quarterly: mergeAnalysisTable(primary.indicators.quarterly, fallback.indicators.quarterly),
    },
    balanceSheet: {
      annual: mergeAnalysisTable(primary.balanceSheet.annual, fallback.balanceSheet.annual),
      quarterly: mergeAnalysisTable(primary.balanceSheet.quarterly, fallback.balanceSheet.quarterly),
    },
    incomeStatement: {
      annual: mergeAnalysisTable(primary.incomeStatement.annual, fallback.incomeStatement.annual),
      quarterly: mergeAnalysisTable(primary.incomeStatement.quarterly, fallback.incomeStatement.quarterly),
    },
    cashFlow: {
      annual: mergeAnalysisTable(primary.cashFlow.annual, fallback.cashFlow.annual),
      quarterly: mergeAnalysisTable(primary.cashFlow.quarterly, fallback.cashFlow.quarterly),
    },
  };
}

function mergeDividendSummary(
  primary: DividendSummary,
  fallback: DividendSummary,
  isFii: boolean,
): DividendSummary {
  const fallbackYield = isPlausibleDividendValue(fallback.yield12m, isFii)
    ? fallback.yield12m
    : "Não disponível";

  return {
    yield12m: hasUsefulText(primary.yield12m)
      ? primary.yield12m
      : fallbackYield,
    cash12m: usefulOrFallback(primary.cash12m, fallback.cash12m),
  };
}

function mergeDividends(
  primary: DividendEvent[],
  fallback: DividendEvent[],
): DividendEvent[] {
  const usefulPrimary = primary.filter((event) => hasUsefulText(event.value));
  if (usefulPrimary.length) return primary;
  return fallback;
}

function mergeQuote(primary: StockQuote, fallback: StockQuote): StockQuote {
  return {
    price: primary.price ?? fallback.price,
    changeValue: primary.changeValue ?? fallback.changeValue,
    changePercent: primary.changePercent ?? fallback.changePercent,
    open: primary.open ?? fallback.open,
    dayHigh: primary.dayHigh ?? fallback.dayHigh,
    dayLow: primary.dayLow ?? fallback.dayLow,
    previousClose: primary.previousClose ?? fallback.previousClose,
    volume: primary.volume ?? fallback.volume,
    marketCap: primary.marketCap ?? fallback.marketCap,
  };
}


function makeQuoteRow(label: string, value: string | null, note: string): StockFinancialRow {
  return {
    label,
    value: value ?? "Não disponível",
    note,
  };
}

function normalizeStockForDisplay(stock: StockData): StockData {
  const latestHistory = stock.history.at(-1) ?? null;
  const previousHistory = stock.history.at(-2) ?? null;
  const historyPrice = toFiniteNumber(latestHistory?.close);
  const historyPreviousClose = toFiniteNumber(previousHistory?.close);
  const quotePrice = toFiniteNumber(stock.quote.price);
  const quotePreviousClose = toFiniteNumber(stock.quote.previousClose);
  const quoteChangeValue = toFiniteNumber(stock.quote.changeValue);
  const quoteChangePercent = toFiniteNumber(stock.quote.changePercent);
  const price = quotePrice ?? historyPrice;
  const previousClose = quotePreviousClose ?? historyPreviousClose;
  const changeValue =
    quoteChangeValue ??
    (price !== null && previousClose !== null ? price - previousClose : null);
  const changePercent =
    quoteChangePercent ??
    (changeValue !== null && previousClose !== null && previousClose !== 0
      ? (changeValue / previousClose) * 100
      : null);
  const marketCap = toFiniteNumber(stock.quote.marketCap);
  const volume = toFiniteNumber(stock.quote.volume);
  const open = toFiniteNumber(stock.quote.open);
  const dayHigh = toFiniteNumber(stock.quote.dayHigh);
  const dayLow = toFiniteNumber(stock.quote.dayLow);
  const hasIntraday = open !== null || dayHigh !== null || dayLow !== null;

  const dayQuoteRows = hasIntraday
    ? [
        makeQuoteRow("Abertura", open === null ? null : formatCurrency(open), "Preço de abertura."),
        makeQuoteRow("Máxima", dayHigh === null ? null : formatCurrency(dayHigh), "Máxima do dia."),
        makeQuoteRow("Mínima", dayLow === null ? null : formatCurrency(dayLow), "Mínima do dia."),
        makeQuoteRow("Fech. anterior", previousClose === null ? null : formatCurrency(previousClose), "Fechamento anterior."),
        makeQuoteRow("Volume", volume === null ? null : formatInteger(volume), "Volume negociado."),
        makeQuoteRow("Valor de mercado", marketCap === null ? null : formatLargeCurrency(marketCap), "Valor de mercado."),
      ]
    : [
        makeQuoteRow("Último fechamento", price === null ? null : formatCurrency(price), "Último fechamento disponível."),
        makeQuoteRow("Fech. anterior", previousClose === null ? null : formatCurrency(previousClose), "Fechamento anterior."),
        makeQuoteRow("Variação", changePercent === null ? null : formatPlainPercent(changePercent), "Variação entre o último fechamento e o fechamento anterior."),
        makeQuoteRow("Volume", volume === null ? null : formatInteger(volume), "Volume negociado."),
        makeQuoteRow("Valor de mercado", marketCap === null ? null : formatLargeCurrency(marketCap), "Valor de mercado."),
      ];

  const isFii = isLikelyFii(stock);
  const sanitizedYield = isPlausibleDividendValue(stock.dividendSummary.yield12m, isFii)
    ? stock.dividendSummary.yield12m
    : "Não disponível";

  return {
    ...stock,
    quote: {
      ...stock.quote,
      price,
      previousClose,
      changeValue,
      changePercent,
      marketCap,
      volume,
      open,
      dayHigh,
      dayLow,
    },
    dayQuoteRows,
    dividendSummary: {
      ...stock.dividendSummary,
      yield12m: sanitizedYield,
      cash12m: sanitizedYield === "Não disponível" ? "Não disponível" : stock.dividendSummary.cash12m,
    },
  };
}

function hasMissingImportantData(stock: StockData): boolean {
  const unavailableIndicators = stock.indicators.filter(
    (indicator) => !hasUsefulText(indicator.value),
  ).length;
  const indicatorMissingRatio = stock.indicators.length
    ? unavailableIndicators / stock.indicators.length
    : 1;

  const financialScore =
    tableScore(stock.fundamentalAnalysis.indicators.annual) +
    tableScore(stock.fundamentalAnalysis.balanceSheet.annual) +
    tableScore(stock.fundamentalAnalysis.incomeStatement.annual) +
    tableScore(stock.fundamentalAnalysis.cashFlow.annual);

  const dayRowsMissing = stock.dayQuoteRows.filter((row) => !hasUsefulText(row.value)).length;
  const dividendInvalid =
    hasUsefulText(stock.dividendSummary.yield12m) &&
    !isPlausibleDividendValue(stock.dividendSummary.yield12m, isLikelyFii(stock));

  return (
    indicatorMissingRatio >= 0.35 ||
    financialScore <= 6 ||
    dayRowsMissing >= 3 ||
    dividendInvalid
  );
}

function mergeStockData(primary: StockData, fallback: StockData): StockData {
  const isFii = isLikelyFii(primary) || isLikelyFii(fallback);
  const mergedHistory = primary.history.length >= fallback.history.length ? primary.history : fallback.history;
  const mergedQuote = mergeQuote(primary.quote, fallback.quote);
  const indicators = mergeIndicators(primary.indicators, fallback.indicators, isFii);
  const dayQuoteRows = mergeFinancialRows(primary.dayQuoteRows, fallback.dayQuoteRows);

  return {
    ...primary,
    companyName: hasUsefulText(primary.companyName) ? primary.companyName : fallback.companyName,
    fullName: primary.fullName ?? fallback.fullName,
    sector: hasUsefulText(primary.sector) ? primary.sector : fallback.sector,
    subsector: primary.subsector ?? fallback.subsector,
    logoUrl: primary.logoUrl ?? fallback.logoUrl,
    source: "Base Foco Invest",
    quote: mergedQuote,
    dividendSummary: mergeDividendSummary(primary.dividendSummary, fallback.dividendSummary, isFii),
    indicators,
    dayQuoteRows,
    companyInfo: mergeCompanyInfoRows(primary.companyInfo, fallback.companyInfo),
    history: mergedHistory,
    oscillations: primary.oscillations.some((item) => hasUsefulText(item.value))
      ? primary.oscillations
      : fallback.oscillations,
    fundamentalAnalysis: mergeFundamentalAnalysis(
      primary.fundamentalAnalysis,
      fallback.fundamentalAnalysis,
    ),
    dividends: mergeDividends(primary.dividends, fallback.dividends),
    related: primary.related.length ? primary.related : fallback.related,
    warnings: primary.warnings.filter((warning) => !warning.toLowerCase().includes("fonte")),
  };
}

function withCacheWarning(
  stock: StockData,
  state: "hit" | "stale",
  ageMs: number | null,
): StockData {
  if (state !== "stale") {
    return stock;
  }

  const ageMinutes = ageMs === null ? null : Math.round(ageMs / 60_000);
  const staleMessage =
    ageMinutes === null
      ? "Dados exibidos a partir do cache temporário."
      : `Dados exibidos a partir do cache temporário de aproximadamente ${ageMinutes} min.`;

  return {
    ...stock,
    warnings: Array.from(new Set([...(stock.warnings ?? []), staleMessage])),
  };
}

async function fetchLiveComplement(normalizedTicker: string): Promise<StockData | null> {
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
      bundle.fundamentus,
  );

  if (!hasAnyData) return null;

  return mapBrapiToStockData({
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
    fundamentus: bundle.fundamentus,
  });
}

export async function getStockByTicker(ticker: string): Promise<StockData> {
  const normalizedTicker = normalizeTicker(ticker);

  if (!normalizedTicker || normalizedTicker === "—") {
    return createUnavailableStock("—", "Digite um ticker válido.");
  }

  const cacheKey = `${STOCK_CACHE_VERSION}:stock:${normalizedTicker}`;
  const cached = getCachedValue<StockData>(cacheKey);

  if (cached.state === "hit" && cached.value) {
    return normalizeStockForDisplay(cached.value);
  }

  const supabaseStock = await getStockFromSupabase(normalizedTicker);
  const localSnapshotStock = supabaseStock
    ? null
    : await getStockFromLocalSnapshot(normalizedTicker);
  const remoteSnapshotStock = supabaseStock || localSnapshotStock
    ? null
    : await getStockFromRemoteSnapshot(normalizedTicker);
  const primaryStock = supabaseStock ?? localSnapshotStock ?? remoteSnapshotStock;

  if (primaryStock) {
    if (!hasMissingImportantData(primaryStock)) {
      return normalizeStockForDisplay(setCachedValue(
        cacheKey,
        primaryStock,
        STOCK_CACHE_TTL_MS,
        STOCK_STALE_TTL_MS,
      ));
    }

    const liveComplement = await fetchLiveComplement(normalizedTicker);
    const enrichedStock = liveComplement
      ? mergeStockData(primaryStock, liveComplement)
      : primaryStock;

    return normalizeStockForDisplay(setCachedValue(
      cacheKey,
      enrichedStock,
      STOCK_CACHE_TTL_MS,
      STOCK_STALE_TTL_MS,
    ));
  }

  const liveStock = await fetchLiveComplement(normalizedTicker);

  if (!liveStock) {
    if (cached.value) {
      return normalizeStockForDisplay(withCacheWarning(cached.value, "stale", cached.ageMs));
    }

    return createUnavailableStock(
      normalizedTicker,
      "Não foi possível consolidar dados para este ticker no momento. Verifique se o ativo existe na cobertura monitorada.",
    );
  }

  const partialLiveStock: StockData = {
    ...liveStock,
    source: "Complemento público parcial",
    warnings: Array.from(new Set([
      ...(liveStock.warnings ?? []),
      "Base histórica local não encontrada. Para exibir indicadores, balanço, DRE, fluxo de caixa e proventos com 5 anos, publique/baixe o snapshot gerado pelo GitHub Actions.",
    ])),
  };

  return normalizeStockForDisplay(setCachedValue(
    cacheKey,
    partialLiveStock,
    STOCK_CACHE_TTL_MS,
    STOCK_STALE_TTL_MS,
  ));
}
