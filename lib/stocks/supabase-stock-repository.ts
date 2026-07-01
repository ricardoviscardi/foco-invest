import {
  supabaseSelect,
  supabaseSelectPaged,
  getSupabaseConnectionStatus,
} from "@/lib/supabase/server";
import type {
  AnalysisTable,
  DividendEvent,
  FundamentalAnalysisData,
  StockData,
  StockFinancialRow,
  StockHistoryPoint,
  StockIndicator,
  StockOscillation,
} from "@/types/stock";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatInteger,
  formatLargeCurrency,
  formatNumber,
  formatPlainPercent,
  toFiniteNumber,
} from "@/lib/utils/formatters";
import { sameDisplayText, sanitizeDisplayText } from "@/lib/utils/text";

export type AssetRow = {
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

export type QuoteRow = {
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

export type HistoryRow = {
  date: string;
  close: number;
  volume: number | null;
  source: string | null;
};

export type FinancialRow = {
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

export type DividendRow = {
  type: string | null;
  value: number | null;
  com_date: string | null;
  payment_date: string | null;
  source: string | null;
};

export type IndicatorRow = {
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
  return ticker
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function latest<T>(items: T[]): T | null {
  return items[0] ?? null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" || typeof value === "string") {
    return toFiniteNumber(value);
  }

  return null;
}

function normalizePercentValue(value: unknown, maxAbs = 100): number | null {
  const numberValue = numberOrNull(value);

  if (numberValue === null) return null;

  const percentValue =
    Math.abs(numberValue) <= 1 ? numberValue * 100 : numberValue;

  if (!Number.isFinite(percentValue) || Math.abs(percentValue) > maxAbs) {
    return null;
  }

  return percentValue;
}

function normalizeAlreadyPercentValue(
  value: unknown,
  maxAbs = 100,
): number | null {
  const numberValue = numberOrNull(value);

  if (
    numberValue === null ||
    !Number.isFinite(numberValue) ||
    Math.abs(numberValue) > maxAbs
  ) {
    return null;
  }

  return numberValue;
}

function safePercent(value: unknown, maxAbs = 100): string | null {
  const percentValue = normalizePercentValue(value, maxAbs);
  return percentValue === null ? null : formatPlainPercent(percentValue);
}

function safeAlreadyPercent(value: unknown, maxAbs = 100): string | null {
  const percentValue = normalizeAlreadyPercentValue(value, maxAbs);
  return percentValue === null ? null : formatPlainPercent(percentValue);
}

function plausibleDividendYield(
  value: unknown,
  assetKind: "stock" | "fii",
): number | null {
  const maxAbs = assetKind === "fii" ? 35 : 25;
  return normalizeAlreadyPercentValue(value, maxAbs);
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
  [/Tecnol�gica/g, "Tecnológica"],
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

function sameTextLegacy(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
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
  if (["EQUITY", "ETF", "MUTUALFUND"].includes(sanitized.toUpperCase()))
    return null;
  return sanitized;
}

function lastFiveYears(
  dividends: DividendRow[],
  referenceDate = new Date(),
): DividendRow[] {
  const start = new Date(referenceDate);
  start.setFullYear(start.getFullYear() - 5);

  return dividends.filter((dividend) => {
    const rawDate = dividend.payment_date ?? dividend.com_date;
    if (!rawDate) return false;
    const date = new Date(rawDate);
    return (
      !Number.isNaN(date.getTime()) && date >= start && date <= referenceDate
    );
  });
}

function indicator(
  label: string,
  value: string | null,
  description: string,
): StockIndicator {
  return {
    label,
    value: value ?? "Não disponível",
    description,
    status: value ? "api" : "indisponível",
  };
}

function quoteRow(
  label: string,
  value: string | null,
  note: string,
): StockFinancialRow {
  return {
    label,
    value: value ?? "Não disponível",
    note,
  };
}

function buildOscillation(
  label: string,
  value: number | null,
): StockOscillation {
  if (value === null || Number.isNaN(value)) {
    return {
      label,
      value: "Não disponível",
      status: "unavailable",
      description: "",
    };
  }

  return {
    label,
    value: `${value > 0 ? "+" : ""}${formatPlainPercent(value)}`,
    status: value > 0 ? "positive" : value < 0 ? "negative" : "neutral",
    description: "",
  };
}

function variation(current: number | null, past: number | null): number | null {
  if (current === null || past === null || past === 0) return null;
  return (current / past - 1) * 100;
}

function pointBeforeOrAt(
  history: StockHistoryPoint[],
  target: Date,
): StockHistoryPoint | null {
  return (
    history.filter((point) => new Date(point.date) <= target).at(-1) ?? null
  );
}

function firstPointOfYear(
  history: StockHistoryPoint[],
  year: number,
): StockHistoryPoint | null {
  return (
    history.find((point) => new Date(point.date).getFullYear() === year) ?? null
  );
}

function buildOscillations(
  history: StockHistoryPoint[],
  price: number | null,
  dayChangePercent: number | null,
): StockOscillation[] {
  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
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
    buildOscillation("12 meses", variation(current, pastByDays(365))),
  ];

  for (let year = currentYear; year >= currentYear - 4; year -= 1) {
    const first = firstPointOfYear(sorted, year);
    const lastOfYear = sorted
      .filter((point) => new Date(point.date).getFullYear() === year)
      .at(-1);
    const end = year === currentYear ? current : (lastOfYear?.close ?? null);
    values.push(
      buildOscillation(String(year), variation(end, first?.close ?? null)),
    );
  }

  return values;
}

function getYearColumns() {
  const year = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => String(year - index));
}

function annualColumnsFromRows(rows: Array<{ reference_date?: string | null; reference_year?: number | null }>): string[] {
  const years = Array.from(
    new Set(
      rows
        .map((row) => row.reference_year ?? (row.reference_date ? Number(String(row.reference_date).slice(0, 4)) : null))
        .filter((year): year is number => Number.isFinite(year))
    )
  )
    .sort((a, b) => b - a)
    .slice(0, 6)
    .map(String);

  return years.length ? years : getYearColumns();
}

function latestAnnualRowsByYear<T extends { reference_date?: string | null; reference_year?: number | null }>(rows: T[]): Map<number, T> {
  const sorted = [...rows].sort((a, b) =>
    String(b.reference_date ?? b.reference_year ?? "").localeCompare(String(a.reference_date ?? a.reference_year ?? ""))
  );
  const byYear = new Map<number, T>();

  for (const row of sorted) {
    const year = row.reference_year ?? (row.reference_date ? Number(String(row.reference_date).slice(0, 4)) : null);
    if (year !== null && Number.isFinite(year) && !byYear.has(year)) {
      byYear.set(year, row);
    }
  }

  return byYear;
}

function priceAtOrBefore(historyRows: Array<{ date: string; close: number | null }>, referenceDate: string | null | undefined): number | null {
  if (!referenceDate) return null;
  const target = new Date(referenceDate).getTime();
  if (!Number.isFinite(target)) return null;

  const row = [...historyRows]
    .filter((item) => item.close !== null && new Date(item.date).getTime() <= target)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .at(-1);

  return row?.close ?? null;
}

function indicatorValueFromRow(row: IndicatorRow | null | undefined, key: keyof IndicatorRow): number | null {
  return row ? numberOrNull(row[key]) : null;
}

function computedIndicatorRowsFromFinancials(args: {
  financials: FinancialRow[];
  existingIndicators: IndicatorRow[];
  historyRows: Array<{ date: string; close: number | null }>;
  latestMarketCap: number | null;
  latestSharesOutstanding: number | null;
  assetKind: "stock" | "fii";
}): IndicatorRow[] {
  const existingByDate = new Map(args.existingIndicators.map((row) => [row.reference_date, row]));
  const annualFinancials = args.financials.filter((row) => row.period_type === "annual");
  const rows: IndicatorRow[] = [];

  for (const financial of annualFinancials) {
    if (!financial.reference_date) continue;

    const existing = existingByDate.get(financial.reference_date);
    const shares = indicatorValueFromRow(existing, "shares_outstanding") ?? args.latestSharesOutstanding;
    const price = priceAtOrBefore(args.historyRows, financial.reference_date);
    const marketCap =
      indicatorValueFromRow(existing, "market_cap") ??
      (price !== null && shares !== null ? price * shares : null) ??
      args.latestMarketCap;

    const equity = numberOrNull(financial.equity);
    const assets = numberOrNull(financial.total_assets);
    const revenue = numberOrNull(financial.revenue);
    const netIncome = numberOrNull(financial.net_income);
    const ebit = numberOrNull(financial.ebit);
    const ebitda = numberOrNull(financial.ebitda);
    const shortDebt = numberOrNull(financial.short_term_debt);
    const longDebt = numberOrNull(financial.long_term_debt);
    const cash = numberOrNull(financial.cash_and_equivalents);
    const grossDebt = (shortDebt ?? 0) + (longDebt ?? 0);
    const netDebt = grossDebt || cash !== null ? grossDebt - (cash ?? 0) : null;

    const computed: IndicatorRow = {
      reference_date: financial.reference_date,
      pe: indicatorValueFromRow(existing, "pe") ?? (marketCap && netIncome && netIncome > 0 ? marketCap / netIncome : null),
      pvp: indicatorValueFromRow(existing, "pvp") ?? (marketCap && equity && equity > 0 ? marketCap / equity : null),
      dividend_yield: indicatorValueFromRow(existing, "dividend_yield"),
      roe: indicatorValueFromRow(existing, "roe") ?? (netIncome && equity && equity > 0 ? (netIncome / equity) * 100 : null),
      roa: indicatorValueFromRow(existing, "roa") ?? (netIncome && assets && assets > 0 ? (netIncome / assets) * 100 : null),
      roic: indicatorValueFromRow(existing, "roic") ?? (ebit && assets && assets > 0 ? (ebit / assets) * 100 : null),
      net_margin: indicatorValueFromRow(existing, "net_margin") ?? (netIncome && revenue && revenue !== 0 ? (netIncome / revenue) * 100 : null),
      ev_ebitda: indicatorValueFromRow(existing, "ev_ebitda") ?? (marketCap && netDebt !== null && ebitda && ebitda > 0 ? (marketCap + netDebt) / ebitda : null),
      debt_ebitda: indicatorValueFromRow(existing, "debt_ebitda") ?? (netDebt !== null && ebitda && ebitda > 0 ? netDebt / ebitda : null),
      book_value_per_share: indicatorValueFromRow(existing, "book_value_per_share") ?? (equity && shares && shares > 0 ? equity / shares : null),
      market_cap: marketCap,
      shares_outstanding: shares,
      vp_per_share: indicatorValueFromRow(existing, "vp_per_share") ?? (equity && shares && shares > 0 ? equity / shares : null),
      dividend_per_share: indicatorValueFromRow(existing, "dividend_per_share"),
      source: existing?.source ?? "Base própria consolidada",
    };

    rows.push(computed);
  }

  const byDate = new Map<string, IndicatorRow>();
  for (const row of [...args.existingIndicators, ...rows]) {
    if (row.reference_date) byDate.set(row.reference_date, row);
  }

  return [...byDate.values()].sort((a, b) => String(b.reference_date).localeCompare(String(a.reference_date)));
}

function buildAnnualIndicatorTable(
  indicatorRows: IndicatorRow[],
  assetKind: "stock" | "fii",
): AnalysisTable {
  const annualRows = indicatorRows.filter((row) => row.reference_date);
  const columns = annualColumnsFromRows(annualRows);
  const rowsByYear = latestAnnualRowsByYear(annualRows);

  const definitions =
    assetKind === "fii"
      ? ([
          ["Div. Yield", "dividend_yield"],
          ["P/VP", "pvp"],
          ["VP/Cota", "vp_per_share"],
          ["Dividendo/Cota", "dividend_per_share"],
          ["Valor de mercado", "market_cap"],
          ["Nº de cotas", "shares_outstanding"],
        ] as const)
      : ([
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
          ["Dividendo/ação", "dividend_per_share"],
        ] as const);

  return {
    columns,
    rows: definitions.map(([label, key]) => ({
      label,
      values: columns.map((column) => {
        const row = rowsByYear.get(Number(column));
        const value = row ? numberOrNull(row[key]) : null;
        if (value === null) return "—";
        if (
          ["dividend_yield", "roe", "roa", "roic", "net_margin"].includes(key)
        )
          return safePercent(value) ?? "—";
        if (
          [
            "vp_per_share",
            "book_value_per_share",
            "dividend_per_share",
          ].includes(key)
        )
          return formatCurrency(value);
        if (key === "market_cap") return formatLargeCurrency(value);
        if (key === "shares_outstanding") return formatInteger(value);
        return formatNumber(value);
      }),
    })),
    emptyMessage:
      assetKind === "fii"
        ? "Indicadores anuais ainda não disponíveis para este fundo."
        : "Indicadores anuais ainda não disponíveis para este ativo.",
  };
}

function periodKeyForFinancialRow(row: FinancialRow, periodType: "annual" | "quarterly"): string {
  if (periodType === "annual") {
    return String(row.reference_year ?? (row.reference_date ? String(row.reference_date).slice(0, 4) : "—"));
  }

  const referenceDate = row.reference_date ?? "";
  const year = row.reference_year ?? (referenceDate ? Number(String(referenceDate).slice(0, 4)) : null);
  const month = referenceDate ? Number(String(referenceDate).slice(5, 7)) : null;
  const quarter = month ? Math.max(1, Math.min(4, Math.ceil(month / 3))) : null;

  return row.reference_period ?? (quarter && year ? `${quarter}T${year}` : referenceDate || "—");
}

function sortFinancialRowsDesc<T extends { reference_date?: string | null; reference_year?: number | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) =>
    String(b.reference_date ?? b.reference_year ?? "").localeCompare(
      String(a.reference_date ?? a.reference_year ?? ""),
    ),
  );
}

function buildFinancialTable(
  financials: FinancialRow[],
  periodType: "annual" | "quarterly",
  rows: Array<[string, keyof FinancialRow, "currency" | "large"]>,
  emptyMessage: string,
): AnalysisTable {
  const byPeriod = new Map<string, FinancialRow>();

  for (const row of sortFinancialRowsDesc(financials.filter((item) => item.period_type === periodType))) {
    const key = periodKeyForFinancialRow(row, periodType);
    if (key !== "—" && !byPeriod.has(key)) {
      byPeriod.set(key, row);
    }
  }

  const periodRows = [...byPeriod.entries()].slice(0, periodType === "annual" ? 6 : 8);
  const columns = periodRows.length
    ? periodRows.map(([key]) => key)
    : periodType === "annual"
      ? getYearColumns()
      : ["—"];

  return {
    columns,
    rows: rows.map(([label, key]) => ({
      label,
      values: periodRows.length
        ? periodRows.map(([, row]) => {
            const value = numberOrNull(row[key]);
            return value === null ? "—" : formatLargeCurrency(value);
          })
        : columns.map(() => "—"),
    })),
    emptyMessage,
  };
}

function buildFinancialAnalysis(
  financials: FinancialRow[],
  indicators: IndicatorRow[],
  assetKind: "stock" | "fii",
): FundamentalAnalysisData {
  const balanceRows: Array<[string, keyof FinancialRow, "large"]> =
    assetKind === "fii"
      ? [
          ["Ativo total", "total_assets", "large"],
          ["Patrimônio líquido", "equity", "large"],
          [
            "Valor patrimonial por cota",
            "vp_per_share" as keyof FinancialRow,
            "large",
          ],
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
          ["Patrimônio líquido", "equity", "large"],
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
    ["Lucro líquido", "net_income", "large"],
  ];

  const cashRows: Array<[string, keyof FinancialRow, "large"]> = [
    ["Fluxo operacional", "operating_cash_flow", "large"],
    ["Fluxo de investimento", "investing_cash_flow", "large"],
    ["Fluxo de financiamento", "financing_cash_flow", "large"],
    ["Capex", "capex", "large"],
    ["Dividendos pagos", "dividends_paid", "large"],
    ["Fluxo livre", "free_cash_flow", "large"],
    ["Variação líquida de caixa", "net_change_cash", "large"],
  ];

  return {
    indicators: {
      annual: buildAnnualIndicatorTable(indicators, assetKind),
      quarterly: {
        columns: ["Atual"],
        rows: [],
        emptyMessage:
          "Indicadores trimestrais ainda não disponíveis para este ativo.",
      },
    },
    balanceSheet: {
      annual: buildFinancialTable(
        financials,
        "annual",
        balanceRows,
        "Balanço patrimonial anual ainda não disponível para este ativo.",
      ),
      quarterly: buildFinancialTable(
        financials,
        "quarterly",
        balanceRows,
        "Balanço patrimonial trimestral ainda não disponível para este ativo.",
      ),
    },
    incomeStatement: {
      annual: buildFinancialTable(
        financials,
        "annual",
        incomeRows,
        "DRE anual ainda não disponível para este ativo.",
      ),
      quarterly: buildFinancialTable(
        financials,
        "quarterly",
        incomeRows,
        "DRE trimestral ainda não disponível para este ativo.",
      ),
    },
    cashFlow: {
      annual: buildFinancialTable(
        financials,
        "annual",
        cashRows,
        "Fluxo de caixa anual ainda não disponível para este ativo.",
      ),
      quarterly: buildFinancialTable(
        financials,
        "quarterly",
        cashRows,
        "Fluxo de caixa trimestral ainda não disponível para este ativo.",
      ),
    },
  };
}

function dividendsLast12Months(
  dividends: DividendRow[],
  referenceDate = new Date(),
  price: number | null = null,
  assetKind: "stock" | "fii" = "stock",
): number | null {
  const start = new Date(referenceDate);
  start.setFullYear(start.getFullYear() - 1);
  const maxSinglePayment =
    price && price > 0 ? price * (assetKind === "fii" ? 0.35 : 0.25) : null;

  const total = dividends.reduce((sum, dividend) => {
    const value = numberOrNull(dividend.value);
    if (!dividend.payment_date || value === null || value <= 0) return sum;

    // Evita que splits, grupamentos ou registros atípicos contaminem o DY da página.
    if (maxSinglePayment !== null && value > maxSinglePayment) return sum;

    const date = new Date(dividend.payment_date);
    return date >= start && date <= referenceDate ? sum + value : sum;
  }, 0);

  return total > 0 ? total : null;
}

type LocalSupabaseSelectOptions = {
  select?: string;
  filters?: Record<string, string>;
  order?: string;
  limit?: number;
  offset?: number;
};

async function safeSupabaseSelect<T>(
  table: string,
  options: LocalSupabaseSelectOptions,
  fallback: T[] = [],
): Promise<T[]> {
  try {
    return await supabaseSelect<T>(table, options);
  } catch {
    return fallback;
  }
}

async function safeSupabaseSelectPaged<T>(
  table: string,
  options: Omit<LocalSupabaseSelectOptions, "limit" | "offset">,
  totalLimit?: number,
  pageSize?: number,
): Promise<T[]> {
  try {
    return await supabaseSelectPaged<T>(table, options, totalLimit, pageSize);
  } catch {
    return [];
  }
}

export async function searchSupabaseAssets(query: string, limit = 8) {
  const status = getSupabaseConnectionStatus();
  const normalized = query
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "");

  if (!status.configured || normalized.length < 2) return [];

  try {
    const rows = await supabaseSelect<AssetRow>("assets", {
      select: "ticker,name,company_name,sector,industry,kind",
      filters: {
        or: `(ticker.ilike.*${normalized}*,name.ilike.*${normalized}*,company_name.ilike.*${normalized}*)`,
      },
      order: "ticker.asc",
      limit,
    });

    return rows.map((row) => ({
      symbol: row.ticker,
      name: row.name ?? row.company_name ?? row.ticker,
      sector:
        row.sector ?? row.industry ?? (row.kind === "fii" ? "FII" : undefined),
      type: row.kind,
      source: "supabase" as const,
    }));
  } catch {
    return [];
  }
}


export type SupabaseStockRawRows = {
  asset: AssetRow;
  quotes: QuoteRow[];
  historyRows: HistoryRow[];
  financials: FinancialRow[];
  dividendRows: DividendRow[];
  indicatorRows: IndicatorRow[];
};

export function buildStockDataFromSupabaseRows(args: SupabaseStockRawRows): StockData {
  const { asset, quotes, historyRows, financials, dividendRows, indicatorRows } = args;

const quote = latest(quotes);
const latestIndicator = latest(indicatorRows);
const orderedHistoryRows = [...historyRows]
  .map((row) => ({
    ...row,
    close: numberOrNull(row.close),
    volume: numberOrNull(row.volume),
  }))
  .filter(
    (row): row is HistoryRow => Boolean(row.date) && row.close !== null,
  )
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
const latestHistoryRow = orderedHistoryRows.at(-1) ?? null;
const previousHistoryRow = orderedHistoryRows.at(-2) ?? null;
const history = orderedHistoryRows.map((row) => ({
  date: row.date,
  close: numberOrNull(row.close) ?? 0,
}));

const quotePrice = numberOrNull(quote?.price);
const quotePreviousClose = numberOrNull(quote?.previous_close);
const quoteChangeValue = numberOrNull(quote?.change_value);
const quoteChangePercent = normalizePercentValue(quote?.change_percent);
const quoteOpen = numberOrNull(quote?.open);
const quoteHigh = numberOrNull(quote?.high);
const quoteLow = numberOrNull(quote?.low);
const quoteVolume = numberOrNull(quote?.volume);
const quoteMarketCap = numberOrNull(quote?.market_cap);

const latestHistoryClose = numberOrNull(latestHistoryRow?.close);
const previousHistoryClose = numberOrNull(previousHistoryRow?.close);

const effectivePrice = quotePrice ?? latestHistoryClose ?? null;
const effectivePreviousClose =
  quotePreviousClose ?? previousHistoryClose ?? null;
const effectiveChangeValue =
  quoteChangeValue ??
  (effectivePrice !== null && effectivePreviousClose !== null
    ? effectivePrice - effectivePreviousClose
    : null);
const effectiveChangePercent =
  quoteChangePercent ??
  (effectiveChangeValue !== null &&
  effectivePreviousClose !== null &&
  effectivePreviousClose !== 0
    ? (effectiveChangeValue / effectivePreviousClose) * 100
    : null);
const effectiveVolume =
  quoteVolume ?? numberOrNull(latestHistoryRow?.volume) ?? null;
const referenceDate = quote?.quote_date
  ? new Date(quote.quote_date)
  : latestHistoryRow?.date
    ? new Date(latestHistoryRow.date)
    : new Date();
const isFii = asset.kind === "fii";

const dividends12m = dividendsLast12Months(
  dividendRows,
  referenceDate,
  effectivePrice,
  asset.kind,
);
const calculatedDividendYield =
  effectivePrice && dividends12m
    ? (dividends12m / effectivePrice) * 100
    : null;
const marketCap =
  quoteMarketCap ?? numberOrNull(latestIndicator?.market_cap) ?? null;
const effectiveIndicatorRows = computedIndicatorRowsFromFinancials({
  financials,
  existingIndicators: indicatorRows,
  historyRows: orderedHistoryRows,
  latestMarketCap: marketCap,
  latestSharesOutstanding: numberOrNull(latestIndicator?.shares_outstanding),
  assetKind: asset.kind,
});
const latestEffectiveIndicator = latest(effectiveIndicatorRows) ?? latestIndicator;
const dividendYield =
  plausibleDividendYield(calculatedDividendYield, asset.kind) ??
  normalizePercentValue(latestEffectiveIndicator?.dividend_yield, isFii ? 35 : 25);
const cleanName =
  sanitizeNullable(asset.name) ??
  sanitizeNullable(asset.company_name) ??
  asset.ticker;
const cleanCompanyName = sanitizeNullable(asset.company_name) ?? cleanName;
const cleanSector =
  sanitizeNullable(asset.sector) ??
  (isFii ? "Fundos Imobiliários" : "Não disponível");
const cleanIndustry = usefulSegment(asset.industry);
const cleanSegment = usefulSegment(asset.segment);
const displaySubsector =
  cleanIndustry && !sameDisplayText(cleanIndustry, cleanSector)
    ? cleanIndustry
    : cleanSegment && !sameDisplayText(cleanSegment, cleanSector)
      ? cleanSegment
      : undefined;
const dividendRows5y = lastFiveYears(dividendRows, referenceDate);

const keyIndicators = isFii
  ? [
      indicator(
        "Div. Yield",
        safeAlreadyPercent(dividendYield, 35),
        "Dividend yield dos últimos 12 meses.",
      ),
      indicator(
        "P/VP",
        numberOrNull(latestEffectiveIndicator?.pvp) === null
          ? null
          : formatNumber(numberOrNull(latestEffectiveIndicator?.pvp)),
        "Preço da cota dividido pelo valor patrimonial por cota.",
      ),
      indicator(
        "VP/Cota",
        numberOrNull(latestEffectiveIndicator?.vp_per_share) === null
          ? null
          : formatCurrency(numberOrNull(latestEffectiveIndicator?.vp_per_share)),
        "Valor patrimonial por cota.",
      ),
      indicator(
        "Dividendo/Cota",
        dividends12m === null ? null : formatCurrency(dividends12m),
        "Proventos distribuídos por cota nos últimos 12 meses.",
      ),
      indicator(
        "Valor de mercado",
        marketCap === null ? null : formatLargeCurrency(marketCap),
        "Valor de mercado do fundo.",
      ),
      indicator(
        "Nº de cotas",
        numberOrNull(latestEffectiveIndicator?.shares_outstanding) === null
          ? null
          : formatInteger(
              numberOrNull(latestEffectiveIndicator?.shares_outstanding),
            ),
        "Quantidade de cotas.",
      ),
    ]
  : [
      indicator(
        "P/L",
        numberOrNull(latestEffectiveIndicator?.pe) === null
          ? null
          : formatNumber(numberOrNull(latestEffectiveIndicator?.pe)),
        "Relação entre preço e lucro por ação.",
      ),
      indicator(
        "P/VP",
        numberOrNull(latestEffectiveIndicator?.pvp) === null
          ? null
          : formatNumber(numberOrNull(latestEffectiveIndicator?.pvp)),
        "Relação entre preço e valor patrimonial.",
      ),
      indicator(
        "DY 12m",
        safeAlreadyPercent(dividendYield, 25),
        "Dividend yield dos últimos 12 meses.",
      ),
      indicator(
        "ROE",
        safePercent(latestEffectiveIndicator?.roe),
        "Retorno sobre patrimônio líquido.",
      ),
      indicator(
        "ROIC",
        safePercent(latestEffectiveIndicator?.roic),
        "Retorno sobre capital investido.",
      ),
      indicator(
        "Mg. Líquida",
        safePercent(latestEffectiveIndicator?.net_margin),
        "Margem líquida da empresa.",
      ),
      indicator(
        "EV/EBITDA",
        numberOrNull(latestEffectiveIndicator?.ev_ebitda) === null
          ? null
          : formatNumber(numberOrNull(latestEffectiveIndicator?.ev_ebitda)),
        "Valor da firma dividido pelo EBITDA.",
      ),
      indicator(
        "Dív.Líq/EBITDA",
        numberOrNull(latestEffectiveIndicator?.debt_ebitda) === null
          ? null
          : formatNumber(numberOrNull(latestEffectiveIndicator?.debt_ebitda)),
        "Dívida líquida dividida pelo EBITDA.",
      ),
      indicator(
        "VPA",
        numberOrNull(latestEffectiveIndicator?.book_value_per_share) === null
          ? null
          : formatCurrency(
              numberOrNull(latestEffectiveIndicator?.book_value_per_share),
            ),
        "Valor patrimonial por ação.",
      ),
      indicator(
        "Valor de mercado",
        marketCap === null ? null : formatLargeCurrency(marketCap),
        "Valor de mercado da empresa.",
      ),
    ];

const hasIntradayQuote =
  quoteOpen !== null || quoteHigh !== null || quoteLow !== null;
const dayQuoteRows = hasIntradayQuote
  ? [
      quoteRow(
        "Abertura",
        quoteOpen === null ? null : formatCurrency(quoteOpen),
        "Preço de abertura.",
      ),
      quoteRow(
        "Máxima",
        quoteHigh === null ? null : formatCurrency(quoteHigh),
        "Máxima do dia.",
      ),
      quoteRow(
        "Mínima",
        quoteLow === null ? null : formatCurrency(quoteLow),
        "Mínima do dia.",
      ),
      quoteRow(
        "Fech. anterior",
        effectivePreviousClose === null ||
          effectivePreviousClose === undefined
          ? null
          : formatCurrency(effectivePreviousClose),
        "Fechamento anterior.",
      ),
      quoteRow(
        "Volume",
        effectiveVolume === null || effectiveVolume === undefined
          ? null
          : formatInteger(effectiveVolume),
        "Volume negociado.",
      ),
      quoteRow(
        "Valor de mercado",
        marketCap === null ? null : formatLargeCurrency(marketCap),
        "Valor de mercado.",
      ),
    ]
  : [
      quoteRow(
        "Último fechamento",
        effectivePrice === null ? null : formatCurrency(effectivePrice),
        "Último preço de fechamento disponível no histórico.",
      ),
      quoteRow(
        "Fech. anterior",
        effectivePreviousClose === null ||
          effectivePreviousClose === undefined
          ? null
          : formatCurrency(effectivePreviousClose),
        "Fechamento anterior.",
      ),
      quoteRow(
        "Variação",
        safeAlreadyPercent(effectiveChangePercent, 100),
        "Variação calculada com base no histórico disponível.",
      ),
      quoteRow(
        "Volume",
        effectiveVolume === null || effectiveVolume === undefined
          ? null
          : formatInteger(effectiveVolume),
        "Volume negociado.",
      ),
      quoteRow(
        "Valor de mercado",
        marketCap === null ? null : formatLargeCurrency(marketCap),
        "Valor de mercado.",
      ),
    ];

const companyInfo = isFii
  ? [
      { label: "Nome", value: cleanName },
      { label: "Segmento", value: displaySubsector ?? "Fundo imobiliário" },
      { label: "Setor", value: cleanSector },
      { label: "Moeda", value: sanitizeNullable(asset.currency) ?? "BRL" },
    ]
  : [
      { label: "Razão social", value: cleanCompanyName },
      ...(sanitizeNullable(asset.cnpj)
        ? [{ label: "CNPJ", value: sanitizeNullable(asset.cnpj) as string }]
        : []),
      { label: "Setor", value: cleanSector },
      { label: "Indústria", value: displaySubsector ?? "Não disponível" },
      ...(sanitizeNullable(asset.website)
        ? [
            {
              label: "Site",
              value: sanitizeNullable(asset.website) as string,
            },
          ]
        : []),
      { label: "Moeda", value: sanitizeNullable(asset.currency) ?? "BRL" },
    ];

return {
  ticker: asset.ticker,
  companyName: cleanName,
  fullName: cleanCompanyName === cleanName ? undefined : cleanCompanyName,
  sector: cleanSector,
  subsector: displaySubsector,
  source: "Base Foco Invest",
  updatedAt: formatDateTime(
    quote?.updated_at ?? latestHistoryRow?.date ?? asset.updated_at,
  ),
  quote: {
    price: effectivePrice,
    changeValue: effectiveChangeValue,
    changePercent: effectiveChangePercent,
    open: quoteOpen,
    dayHigh: quoteHigh,
    dayLow: quoteLow,
    previousClose: effectivePreviousClose,
    volume: effectiveVolume,
    marketCap,
  },
  dividendSummary: {
    yield12m:
      safeAlreadyPercent(dividendYield, isFii ? 35 : 25) ??
      "Não disponível",
    cash12m:
      dividends12m === null
        ? "Não disponível"
        : `${formatCurrency(dividends12m)}/${isFii ? "cota" : "ação"}`,
  },
  indicators: keyIndicators,
  dayQuoteRows,
  companyInfo,
  history,
  oscillations: buildOscillations(
    history,
    effectivePrice,
    effectiveChangePercent,
  ),
  fundamentalAnalysis: buildFinancialAnalysis(
    financials,
    effectiveIndicatorRows,
    asset.kind,
  ),
  dividends: dividendRows5y.map((row): DividendEvent => ({
    type: sanitizeNullable(row.type) ?? (isFii ? "Rendimento" : "Provento"),
    value:
      numberOrNull(row.value) === null
        ? "Não disponível"
        : formatCurrency(numberOrNull(row.value)),
    comDate: formatDate(row.com_date),
    paymentDate: formatDate(row.payment_date),
    status: "Não informado",
  })),
  related: [],
  warnings:
    quotePrice === null && effectivePrice !== null
      ? [
          "Cotação atual calculada a partir do último fechamento histórico disponível.",
        ]
      : [],
};
}

export async function getStockFromSupabase(
  ticker: string,
): Promise<StockData | null> {
  const status = getSupabaseConnectionStatus();
  if (!status.configured) return null;

  const normalizedTicker = normalizeTicker(ticker);

  try {
    const [asset] = await supabaseSelect<AssetRow>("assets", {
      select: "*",
      filters: { ticker: `eq.${normalizedTicker}` },
      limit: 1,
    });

    if (!asset) return null;

    const [quotes, historyRows, financials, dividendRows, indicatorRows] =
      await Promise.all([
        safeSupabaseSelect<QuoteRow>("asset_quotes", {
          select: "*",
          filters: { ticker: `eq.${normalizedTicker}` },
          order: "quote_date.desc",
          limit: 1,
        }),
        safeSupabaseSelectPaged<HistoryRow>(
          "asset_price_history",
          {
            select: "date,close,volume,source",
            filters: { ticker: `eq.${normalizedTicker}` },
            // Trazemos os registros mais recentes primeiro para evitar o limite padrão
            // de 1.000 linhas da API REST do Supabase. Depois reordenamos em ordem
            // crescente para o gráfico.
            order: "date.desc",
          },
          2600,
          1000,
        ),
        safeSupabaseSelect<FinancialRow>("asset_financials", {
          select: "*",
          filters: { ticker: `eq.${normalizedTicker}` },
          order: "reference_date.desc",
          limit: 120,
        }),
        safeSupabaseSelect<DividendRow>("asset_dividends", {
          select: "*",
          filters: { ticker: `eq.${normalizedTicker}` },
          order: "payment_date.desc",
          limit: 300,
        }),
        safeSupabaseSelect<IndicatorRow>("asset_indicators", {
          select: "*",
          filters: { ticker: `eq.${normalizedTicker}` },
          order: "reference_date.desc",
          limit: 80,
        }),
      ]);

    return buildStockDataFromSupabaseRows({
      asset,
      quotes,
      historyRows,
      financials,
      dividendRows,
      indicatorRows,
    });

  } catch {
    return null;
  }
}
