import { supabaseSelect, supabaseSelectPaged, getSupabaseConnectionStatus } from "@/lib/supabase/server";
import type {
  AnalysisTable,
  DividendEvent,
  FundamentalAnalysisData,
  StockData,
  StockFinancialRow,
  StockHistoryPoint,
  StockIndicator,
  StockOscillation
} from "@/types/stock";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatInteger,
  formatLargeCurrency,
  formatNumber,
  formatPlainPercent
} from "@/lib/utils/formatters";
import { sameDisplayText, sanitizeDisplayText } from "@/lib/utils/text";

type AssetRow = {
  ticker: string;
  kind: "stock" | "fii";
  name: string | null;
  company_name: string | null;
  cnpj: string | null;
  sector: string | null;
  industry: string | null;
  segment: string | null;
  website: string | null;
  currency: string | null;
  source: string | null;
  updated_at: string | null;
};

type QuoteRow = {
  price: number | null;
  change_value: number | null;
  change_percent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previous_close: number | null;
  volume: number | null;
  market_cap: number | null;
  quote_date: string | null;
  source: string | null;
  updated_at: string | null;
};

type HistoryRow = {
  date: string;
  close: number;
  volume: number | null;
  source: string | null;
};

type FinancialRow = {
  period_type: "annual" | "quarterly";
  reference_year: number | null;
  reference_period: string | null;
  reference_date: string | null;
  total_assets: number | null;
  current_assets: number | null;
  non_current_assets?: number | null;
  cash_and_equivalents?: number | null;
  total_liabilities: number | null;
  current_liabilities?: number | null;
  non_current_liabilities?: number | null;
  short_term_debt?: number | null;
  long_term_debt?: number | null;
  equity: number | null;
  revenue: number | null;
  cost_of_revenue?: number | null;
  gross_profit: number | null;
  operating_expenses?: number | null;
  ebit: number | null;
  ebitda: number | null;
  financial_result?: number | null;
  income_before_tax?: number | null;
  income_tax?: number | null;
  net_income: number | null;
  operating_cash_flow: number | null;
  investing_cash_flow?: number | null;
  financing_cash_flow?: number | null;
  capex: number | null;
  dividends_paid?: number | null;
  free_cash_flow: number | null;
  net_change_cash?: number | null;
  source: string | null;
};

type DividendRow = {
  type: string | null;
  value: number | null;
  com_date: string | null;
  payment_date: string | null;
  source: string | null;
};

type IndicatorRow = {
  reference_date: string;
  pe: number | null;
  pvp: number | null;
  dividend_yield: number | null;
  roe: number | null;
  roa: number | null;
  roic: number | null;
  net_margin: number | null;
  ev_ebitda: number | null;
  debt_ebitda: number | null;
  book_value_per_share: number | null;
  market_cap: number | null;
  shares_outstanding: number | null;
  vp_per_share: number | null;
  dividend_per_share: number | null;
  source: string | null;
};

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function latest<T>(items: T[]): T | null {
  return items[0] ?? null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safePercent(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return formatPlainPercent(Math.abs(value) <= 1 ? value * 100 : value);
}


const textFixes: Array<[RegExp, string]> = [
  [/N�o/g, "Não"],
  [/A��es/g, "Ações"],
  [/El�trica/g, "Elétrica"],
  [/El�trico/g, "Elétrico"],
  [/Energ�tica/g, "Energética"],
  [/Petr�leo/g, "Petróleo"],
  [/G�s/g, "Gás"],
  [/Minera��o/g, "Mineração"],
  [/Constru��o/g, "Construção"],
  [/Comunica��o/g, "Comunicação"],
  [/Distribui��o/g, "Distribuição"],
  [/Transmiss�o/g, "Transmissão"],
  [/Servi�os/g, "Serviços"],
  [/Servi�o/g, "Serviço"],
  [/B�sicos/g, "Básicos"],
  [/B�sico/g, "Básico"],
  [/Imobili�rios/g, "Imobiliários"],
  [/Imobili�rio/g, "Imobiliário"],
  [/Com�rcio/g, "Comércio"],
  [/Alimenta��o/g, "Alimentação"],
  [/Educa��o/g, "Educação"],
  [/Sa�de/g, "Saúde"],
  [/Inform�tica/g, "Informática"],
  [/Telecomunica��es/g, "Telecomunicações"],
  [/Institui��es/g, "Instituições"],
  [/Administra��o/g, "Administração"],
  [/Gest�o/g, "Gestão"],
  [/Cr�dito/g, "Crédito"],
  [/M�quinas/g, "Máquinas"],
  [/Log�stica/g, "Logística"],
  [/A�reo/g, "Aéreo"],
  [/Qu�mica/g, "Química"],
  [/Sider�rgica/g, "Siderúrgica"],
  [/Agr�cola/g, "Agrícola"],
  [/Tecnol�gico/g, "Tecnológico"],
  [/Tecnol�gica/g, "Tecnológica"]
];

function sanitizeTextLegacy(value: string | null | undefined): string | null {
  if (!value) return null;

  let text = value.trim();

  for (const [pattern, replacement] of textFixes) {
    text = text.replace(pattern, replacement);
  }

  text = text.replace(/\s+/g, " ").trim();

  return text || null;
}

function sameTextLegacy(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" }) === 0;
}


function sanitizeNullable(value: string | null | undefined): string | null {
  const sanitized = sanitizeDisplayText(value);
  return sanitized || null;
}

function usefulSegment(value: string | null | undefined): string | null {
  const sanitized = sanitizeNullable(value);
  if (!sanitized) return null;
  if (["EQUITY", "ETF", "MUTUALFUND"].includes(sanitized.toUpperCase())) return null;
  return sanitized;
}

function lastFiveYears(dividends: DividendRow[], referenceDate = new Date()): DividendRow[] {
  const start = new Date(referenceDate);
  start.setFullYear(start.getFullYear() - 5);

  return dividends.filter((dividend) => {
    const rawDate = dividend.payment_date ?? dividend.com_date;
    if (!rawDate) return false;
    const date = new Date(rawDate);
    return !Number.isNaN(date.getTime()) && date >= start && date <= referenceDate;
  });
}

function indicator(label: string, value: string | null, description: string): StockIndicator {
  return {
    label,
    value: value ?? "Não disponível",
    description,
    status: value ? "api" : "indisponível"
  };
}

function quoteRow(label: string, value: string | null, note: string): StockFinancialRow {
  return {
    label,
    value: value ?? "Não disponível",
    note
  };
}

function buildOscillation(label: string, value: number | null): StockOscillation {
  if (value === null || Number.isNaN(value)) {
    return { label, value: "Não disponível", status: "unavailable", description: "" };
  }

  return {
    label,
    value: `${value > 0 ? "+" : ""}${formatPlainPercent(value)}`,
    status: value > 0 ? "positive" : value < 0 ? "negative" : "neutral",
    description: ""
  };
}

function variation(current: number | null, past: number | null): number | null {
  if (current === null || past === null || past === 0) return null;
  return ((current / past) - 1) * 100;
}

function pointBeforeOrAt(history: StockHistoryPoint[], target: Date): StockHistoryPoint | null {
  return history.filter((point) => new Date(point.date) <= target).at(-1) ?? null;
}

function firstPointOfYear(history: StockHistoryPoint[], year: number): StockHistoryPoint | null {
  return history.find((point) => new Date(point.date).getFullYear() === year) ?? null;
}

function buildOscillations(history: StockHistoryPoint[], price: number | null, dayChangePercent: number | null): StockOscillation[] {
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const last = sorted.at(-1) ?? null;
  const current = price ?? last?.close ?? null;
  const lastDate = last ? new Date(last.date) : new Date();
  const pastByDays = (days: number) => {
    const target = new Date(lastDate);
    target.setDate(target.getDate() - days);
    return pointBeforeOrAt(sorted, target)?.close ?? null;
  };

  const currentYear = new Date().getFullYear();
  const values: StockOscillation[] = [
    buildOscillation("Dia", dayChangePercent),
    buildOscillation("5 dias", variation(current, pastByDays(5))),
    buildOscillation("Mês", variation(current, pastByDays(31))),
    buildOscillation("30 dias", variation(current, pastByDays(30))),
    buildOscillation("12 meses", variation(current, pastByDays(365)))
  ];

  for (let year = currentYear; year >= currentYear - 4; year -= 1) {
    const first = firstPointOfYear(sorted, year);
    const lastOfYear = sorted.filter((point) => new Date(point.date).getFullYear() === year).at(-1);
    const end = year === currentYear ? current : lastOfYear?.close ?? null;
    values.push(buildOscillation(String(year), variation(end, first?.close ?? null)));
  }

  return values;
}

function getYearColumns() {
  const year = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => String(year - index));
}

function buildAnnualIndicatorTable(indicatorRows: IndicatorRow[], assetKind: "stock" | "fii"): AnalysisTable {
  const columns = getYearColumns();
  const rowsByYear = new Map<number, IndicatorRow>();

  for (const row of indicatorRows) {
    const year = new Date(row.reference_date).getFullYear();
    if (!rowsByYear.has(year)) rowsByYear.set(year, row);
  }

  const definitions = assetKind === "fii"
    ? [
        ["Div. Yield", "dividend_yield"],
        ["P/VP", "pvp"],
        ["VP/Cota", "vp_per_share"],
        ["Dividendo/Cota", "dividend_per_share"],
        ["Valor de mercado", "market_cap"],
        ["Nº de cotas", "shares_outstanding"]
      ] as const
    : [
        ["P/L", "pe"],
        ["P/VP", "pvp"],
        ["Dividend Yield", "dividend_yield"],
        ["ROE", "roe"],
        ["ROA", "roa"],
        ["ROIC", "roic"],
        ["Margem líquida", "net_margin"],
        ["EV/EBITDA", "ev_ebitda"],
        ["Dív.Líq/EBITDA", "debt_ebitda"],
        ["VPA", "book_value_per_share"],
        ["Valor de mercado", "market_cap"],
        ["Dividendo/ação", "dividend_per_share"]
      ] as const;

  return {
    columns,
    rows: definitions.map(([label, key]) => ({
      label,
      values: columns.map((column) => {
        const row = rowsByYear.get(Number(column));
        const value = row ? numberOrNull(row[key]) : null;
        if (value === null) return "—";
        if (["dividend_yield", "roe", "roa", "roic", "net_margin"].includes(key)) return safePercent(value) ?? "—";
        if (["vp_per_share", "book_value_per_share", "dividend_per_share"].includes(key)) return formatCurrency(value);
        if (key === "market_cap") return formatLargeCurrency(value);
        if (key === "shares_outstanding") return formatInteger(value);
        return formatNumber(value);
      })
    })),
    emptyMessage: assetKind === "fii" ? "Indicadores anuais ainda não disponíveis para este fundo." : "Indicadores anuais ainda não disponíveis para este ativo."
  };
}

function buildFinancialTable(financials: FinancialRow[], periodType: "annual" | "quarterly", rows: Array<[string, keyof FinancialRow, "currency" | "large"]>, emptyMessage: string): AnalysisTable {
  const periodRows = financials
    .filter((row) => row.period_type === periodType)
    .sort((a, b) => String(b.reference_date ?? b.reference_year ?? "").localeCompare(String(a.reference_date ?? a.reference_year ?? "")))
    .slice(0, 6);

  const columns = periodRows.length
    ? periodRows.map((row) => periodType === "annual" ? String(row.reference_year ?? "—") : String(row.reference_period ?? row.reference_date ?? "—"))
    : (periodType === "annual" ? getYearColumns() : ["Atual", "—", "—", "—", "—", "—"]);

  return {
    columns,
    rows: rows.map(([label, key]) => ({
      label,
      values: columns.map((_, index) => {
        const value = numberOrNull(periodRows[index]?.[key]);
        return value === null ? "—" : formatLargeCurrency(value);
      })
    })),
    emptyMessage
  };
}

function buildFinancialAnalysis(financials: FinancialRow[], indicators: IndicatorRow[], assetKind: "stock" | "fii"): FundamentalAnalysisData {
  const balanceRows: Array<[string, keyof FinancialRow, "large"]> = assetKind === "fii"
    ? [
        ["Ativo total", "total_assets", "large"],
        ["Patrimônio líquido", "equity", "large"],
        ["Valor patrimonial por cota", "vp_per_share" as keyof FinancialRow, "large"]
      ]
    : [
        ["Ativo total", "total_assets", "large"],
        ["Ativo circulante", "current_assets", "large"],
        ["Ativo não circulante", "non_current_assets", "large"],
        ["Caixa e equivalentes", "cash_and_equivalents", "large"],
        ["Passivo total", "total_liabilities", "large"],
        ["Passivo circulante", "current_liabilities", "large"],
        ["Passivo não circulante", "non_current_liabilities", "large"],
        ["Dívida de curto prazo", "short_term_debt", "large"],
        ["Dívida de longo prazo", "long_term_debt", "large"],
        ["Patrimônio líquido", "equity", "large"]
      ];

  const incomeRows: Array<[string, keyof FinancialRow, "large"]> = [
    ["Receita líquida", "revenue", "large"],
    ["Custo dos produtos/serviços", "cost_of_revenue", "large"],
    ["Lucro bruto", "gross_profit", "large"],
    ["Despesas operacionais", "operating_expenses", "large"],
    ["EBIT", "ebit", "large"],
    ["EBITDA", "ebitda", "large"],
    ["Resultado financeiro", "financial_result", "large"],
    ["Lucro antes dos impostos", "income_before_tax", "large"],
    ["Imposto de renda", "income_tax", "large"],
    ["Lucro líquido", "net_income", "large"]
  ];

  const cashRows: Array<[string, keyof FinancialRow, "large"]> = [
    ["Fluxo operacional", "operating_cash_flow", "large"],
    ["Fluxo de investimento", "investing_cash_flow", "large"],
    ["Fluxo de financiamento", "financing_cash_flow", "large"],
    ["Capex", "capex", "large"],
    ["Dividendos pagos", "dividends_paid", "large"],
    ["Fluxo livre", "free_cash_flow", "large"],
    ["Variação líquida de caixa", "net_change_cash", "large"]
  ];

  return {
    indicators: {
      annual: buildAnnualIndicatorTable(indicators, assetKind),
      quarterly: { columns: ["Atual"], rows: [], emptyMessage: "Indicadores trimestrais ainda não disponíveis para este ativo." }
    },
    balanceSheet: {
      annual: buildFinancialTable(financials, "annual", balanceRows, "Balanço patrimonial anual ainda não disponível para este ativo."),
      quarterly: buildFinancialTable(financials, "quarterly", balanceRows, "Balanço patrimonial trimestral ainda não disponível para este ativo.")
    },
    incomeStatement: {
      annual: buildFinancialTable(financials, "annual", incomeRows, "DRE anual ainda não disponível para este ativo."),
      quarterly: buildFinancialTable(financials, "quarterly", incomeRows, "DRE trimestral ainda não disponível para este ativo.")
    },
    cashFlow: {
      annual: buildFinancialTable(financials, "annual", cashRows, "Fluxo de caixa anual ainda não disponível para este ativo."),
      quarterly: buildFinancialTable(financials, "quarterly", cashRows, "Fluxo de caixa trimestral ainda não disponível para este ativo.")
    }
  };
}

function dividendsLast12Months(dividends: DividendRow[], referenceDate = new Date()): number | null {
  const start = new Date(referenceDate);
  start.setFullYear(start.getFullYear() - 1);
  const total = dividends.reduce((sum, dividend) => {
    if (!dividend.payment_date || dividend.value === null) return sum;
    const date = new Date(dividend.payment_date);
    return date >= start && date <= referenceDate ? sum + dividend.value : sum;
  }, 0);
  return total > 0 ? total : null;
}

export async function searchSupabaseAssets(query: string, limit = 8) {
  const status = getSupabaseConnectionStatus();
  const normalized = query.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, "");

  if (!status.configured || normalized.length < 2) return [];

  try {
    const rows = await supabaseSelect<AssetRow>("assets", {
      select: "ticker,name,company_name,sector,industry,kind",
      filters: {
        or: `(ticker.ilike.*${normalized}*,name.ilike.*${normalized}*,company_name.ilike.*${normalized}*)`
      },
      order: "ticker.asc",
      limit
    });

    return rows.map((row) => ({
      symbol: row.ticker,
      name: row.name ?? row.company_name ?? row.ticker,
      sector: row.sector ?? row.industry ?? (row.kind === "fii" ? "FII" : undefined),
      type: row.kind,
      source: "supabase" as const
    }));
  } catch {
    return [];
  }
}

export async function getStockFromSupabase(ticker: string): Promise<StockData | null> {
  const status = getSupabaseConnectionStatus();
  if (!status.configured) return null;

  const normalizedTicker = normalizeTicker(ticker);

  try {
    const [asset] = await supabaseSelect<AssetRow>("assets", {
      select: "*",
      filters: { ticker: `eq.${normalizedTicker}` },
      limit: 1
    });

    if (!asset) return null;

    const [quotes, historyRows, financials, dividendRows, indicatorRows] = await Promise.all([
      supabaseSelect<QuoteRow>("asset_quotes", {
        select: "*",
        filters: { ticker: `eq.${normalizedTicker}` },
        order: "quote_date.desc",
        limit: 1
      }),
      supabaseSelectPaged<HistoryRow>("asset_price_history", {
        select: "date,close,volume,source",
        filters: { ticker: `eq.${normalizedTicker}` },
        // Trazemos os registros mais recentes primeiro para evitar o limite padrão
        // de 1.000 linhas da API REST do Supabase. Depois reordenamos em ordem
        // crescente para o gráfico.
        order: "date.desc"
      }, 2600, 1000),
      supabaseSelect<FinancialRow>("asset_financials", {
        select: "*",
        filters: { ticker: `eq.${normalizedTicker}` },
        order: "reference_date.desc",
        limit: 40
      }),
      supabaseSelect<DividendRow>("asset_dividends", {
        select: "*",
        filters: { ticker: `eq.${normalizedTicker}` },
        order: "payment_date.desc",
        limit: 180
      }),
      supabaseSelect<IndicatorRow>("asset_indicators", {
        select: "*",
        filters: { ticker: `eq.${normalizedTicker}` },
        order: "reference_date.desc",
        limit: 12
      })
    ]);

    const quote = latest(quotes);
    const latestIndicator = latest(indicatorRows);
    const orderedHistoryRows = [...historyRows]
      .filter((row) => row.date && Number.isFinite(Number(row.close)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latestHistoryRow = orderedHistoryRows.at(-1) ?? null;
    const previousHistoryRow = orderedHistoryRows.at(-2) ?? null;
    const history = orderedHistoryRows.map((row) => ({ date: row.date, close: Number(row.close) }));

    const effectivePrice = quote?.price ?? latestHistoryRow?.close ?? null;
    const effectivePreviousClose = quote?.previous_close ?? previousHistoryRow?.close ?? null;
    const effectiveChangeValue = quote?.change_value ?? (
      effectivePrice !== null && effectivePreviousClose !== null
        ? effectivePrice - effectivePreviousClose
        : null
    );
    const effectiveChangePercent = quote?.change_percent ?? (
      effectiveChangeValue !== null && effectivePreviousClose !== null && effectivePreviousClose !== 0
        ? (effectiveChangeValue / effectivePreviousClose) * 100
        : null
    );
    const effectiveVolume = quote?.volume ?? latestHistoryRow?.volume ?? null;
    const referenceDate = quote?.quote_date ? new Date(quote.quote_date) : latestHistoryRow?.date ? new Date(latestHistoryRow.date) : new Date();

    const dividends12m = dividendsLast12Months(dividendRows, referenceDate);
    const dividendYield = latestIndicator?.dividend_yield ?? (effectivePrice && dividends12m ? (dividends12m / effectivePrice) * 100 : null);
    const marketCap = quote?.market_cap ?? latestIndicator?.market_cap ?? null;
    const isFii = asset.kind === "fii";
    const cleanName = sanitizeNullable(asset.name) ?? sanitizeNullable(asset.company_name) ?? asset.ticker;
    const cleanCompanyName = sanitizeNullable(asset.company_name) ?? cleanName;
    const cleanSector = sanitizeNullable(asset.sector) ?? (isFii ? "Fundos Imobiliários" : "Não disponível");
    const cleanIndustry = usefulSegment(asset.industry);
    const cleanSegment = usefulSegment(asset.segment);
    const displaySubsector = cleanIndustry && !sameDisplayText(cleanIndustry, cleanSector)
      ? cleanIndustry
      : cleanSegment && !sameDisplayText(cleanSegment, cleanSector)
        ? cleanSegment
        : undefined;
    const dividendRows5y = lastFiveYears(dividendRows, quote?.quote_date ? new Date(quote.quote_date) : new Date());

    const keyIndicators = isFii
      ? [
          indicator("Div. Yield", safePercent(dividendYield), "Dividend yield dos últimos 12 meses."),
          indicator("P/VP", latestIndicator?.pvp === null || latestIndicator?.pvp === undefined ? null : formatNumber(latestIndicator.pvp), "Preço da cota dividido pelo valor patrimonial por cota."),
          indicator("VP/Cota", latestIndicator?.vp_per_share === null || latestIndicator?.vp_per_share === undefined ? null : formatCurrency(latestIndicator.vp_per_share), "Valor patrimonial por cota."),
          indicator("Dividendo/Cota", dividends12m === null ? null : formatCurrency(dividends12m), "Proventos distribuídos por cota nos últimos 12 meses."),
          indicator("Valor de mercado", marketCap === null ? null : formatLargeCurrency(marketCap), "Valor de mercado do fundo."),
          indicator("Nº de cotas", latestIndicator?.shares_outstanding === null || latestIndicator?.shares_outstanding === undefined ? null : formatInteger(latestIndicator.shares_outstanding), "Quantidade de cotas.")
        ]
      : [
          indicator("P/L", latestIndicator?.pe === null || latestIndicator?.pe === undefined ? null : formatNumber(latestIndicator.pe), "Relação entre preço e lucro por ação."),
          indicator("P/VP", latestIndicator?.pvp === null || latestIndicator?.pvp === undefined ? null : formatNumber(latestIndicator.pvp), "Relação entre preço e valor patrimonial."),
          indicator("DY 12m", safePercent(dividendYield), "Dividend yield dos últimos 12 meses."),
          indicator("ROE", safePercent(latestIndicator?.roe), "Retorno sobre patrimônio líquido."),
          indicator("ROIC", safePercent(latestIndicator?.roic), "Retorno sobre capital investido."),
          indicator("Mg. Líquida", safePercent(latestIndicator?.net_margin), "Margem líquida da empresa."),
          indicator("EV/EBITDA", latestIndicator?.ev_ebitda === null || latestIndicator?.ev_ebitda === undefined ? null : formatNumber(latestIndicator.ev_ebitda), "Valor da firma dividido pelo EBITDA."),
          indicator("Dív.Líq/EBITDA", latestIndicator?.debt_ebitda === null || latestIndicator?.debt_ebitda === undefined ? null : formatNumber(latestIndicator.debt_ebitda), "Dívida líquida dividida pelo EBITDA."),
          indicator("VPA", latestIndicator?.book_value_per_share === null || latestIndicator?.book_value_per_share === undefined ? null : formatCurrency(latestIndicator.book_value_per_share), "Valor patrimonial por ação."),
          indicator("Valor de mercado", marketCap === null ? null : formatLargeCurrency(marketCap), "Valor de mercado da empresa.")
        ];

    const dayQuoteRows = [
      quoteRow("Abertura", quote?.open === null || quote?.open === undefined ? null : formatCurrency(quote.open), "Preço de abertura."),
      quoteRow("Máxima", quote?.high === null || quote?.high === undefined ? null : formatCurrency(quote.high), "Máxima do dia."),
      quoteRow("Mínima", quote?.low === null || quote?.low === undefined ? null : formatCurrency(quote.low), "Mínima do dia."),
      quoteRow("Fech. anterior", effectivePreviousClose === null || effectivePreviousClose === undefined ? null : formatCurrency(effectivePreviousClose), "Fechamento anterior."),
      quoteRow("Volume", effectiveVolume === null || effectiveVolume === undefined ? null : formatInteger(effectiveVolume), "Volume negociado."),
      quoteRow("Valor de mercado", marketCap === null ? null : formatLargeCurrency(marketCap), "Valor de mercado.")
    ];

    const companyInfo = isFii
      ? [
          { label: "Nome", value: cleanName },
          { label: "Segmento", value: displaySubsector ?? "Fundo imobiliário" },
          { label: "Setor", value: cleanSector },
          { label: "Moeda", value: sanitizeNullable(asset.currency) ?? "BRL" }
        ]
      : [
          { label: "Razão social", value: cleanCompanyName },
          ...(sanitizeNullable(asset.cnpj) ? [{ label: "CNPJ", value: sanitizeNullable(asset.cnpj) as string }] : []),
          { label: "Setor", value: cleanSector },
          { label: "Indústria", value: displaySubsector ?? "Não disponível" },
          ...(sanitizeNullable(asset.website) ? [{ label: "Site", value: sanitizeNullable(asset.website) as string }] : []),
          { label: "Moeda", value: sanitizeNullable(asset.currency) ?? "BRL" }
        ];

    return {
      ticker: asset.ticker,
      companyName: cleanName,
      fullName: cleanCompanyName === cleanName ? undefined : cleanCompanyName,
      sector: cleanSector,
      subsector: displaySubsector,
      source: "Supabase/CVM/Yahoo",
      updatedAt: formatDateTime(quote?.updated_at ?? asset.updated_at),
      quote: {
        price: effectivePrice,
        changeValue: effectiveChangeValue,
        changePercent: effectiveChangePercent,
        open: quote?.open ?? null,
        dayHigh: quote?.high ?? null,
        dayLow: quote?.low ?? null,
        previousClose: effectivePreviousClose,
        volume: effectiveVolume,
        marketCap
      },
      dividendSummary: {
        yield12m: safePercent(dividendYield) ?? "Não disponível",
        cash12m: dividends12m === null ? "Não disponível" : `${formatCurrency(dividends12m)}/${isFii ? "cota" : "ação"}`
      },
      indicators: keyIndicators,
      dayQuoteRows,
      companyInfo,
      history,
      oscillations: buildOscillations(history, effectivePrice, effectiveChangePercent),
      fundamentalAnalysis: buildFinancialAnalysis(financials, indicatorRows, asset.kind),
      dividends: dividendRows5y.map((row): DividendEvent => ({
        type: sanitizeNullable(row.type) ?? (isFii ? "Rendimento" : "Provento"),
        value: row.value === null ? "Não disponível" : formatCurrency(row.value),
        comDate: formatDate(row.com_date),
        paymentDate: formatDate(row.payment_date),
        status: "Não informado"
      })),
      related: [],
      warnings: quote?.price === null || quote?.price === undefined
        ? ["Cotação atual calculada a partir do último fechamento histórico disponível."]
        : []
    };
  } catch {
    return null;
  }
}
