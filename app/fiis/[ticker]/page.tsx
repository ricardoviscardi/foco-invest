import type { Metadata } from "next";
import Script from "next/script";
import { ApiStatusNotice } from "@/components/stocks/ApiStatusNotice";
import { CompanyInfoCard } from "@/components/stocks/CompanyInfoCard";
import { DayQuoteCard } from "@/components/stocks/DayQuoteCard";
import { DividendSummaryCard } from "@/components/stocks/DividendSummaryCard";
import { DividendsTable } from "@/components/stocks/DividendsTable";
import { FundamentalAnalysisTable } from "@/components/stocks/FundamentalAnalysisTable";
import { KeyIndicatorsGrid } from "@/components/stocks/KeyIndicatorsGrid";
import { OscillationsCard } from "@/components/stocks/OscillationsCard";
import { PriceChartCard } from "@/components/stocks/PriceChartCard";
import { StockHeader } from "@/components/stocks/StockHeader";
import { getStockByTicker } from "@/lib/stocks/stock-service";
import { getBaseUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FiiPageProps = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function generateMetadata({
  params,
}: FiiPageProps): Promise<Metadata> {
  const { ticker } = await params;
  const fii = await getStockByTicker(ticker);
  const baseUrl = getBaseUrl();
  const canonicalPath = `/fiis/${fii.ticker.toLowerCase()}`;
  const title = `${fii.ticker}: cotação, rendimentos, dividend yield e dados do FII`;
  const description = `Consulte ${fii.ticker} com cotação atual, gráfico, oscilações, rendimentos, dividend yield, P/VP, VP por cota e informações do fundo imobiliário no Foco Invest.`;

  return {
    title,
    description,
    keywords: [
      fii.ticker,
      `${fii.ticker} cotação`,
      `${fii.ticker} dividendos`,
      `${fii.ticker} rendimentos`,
      `${fii.ticker} dividend yield`,
      `${fii.ticker} FII`,
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}${canonicalPath}`,
      siteName: "Foco Invest",
      locale: "pt_BR",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function FiiTickerPage({ params }: FiiPageProps) {
  const { ticker } = await params;
  const fii = await getStockByTicker(ticker);
  const baseUrl = getBaseUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${fii.ticker}: cotação, rendimentos e dados do FII`,
    description: `Página informativa sobre ${fii.ticker}, com cotação, gráfico, oscilações, dividendos e dados disponíveis do fundo imobiliário.`,
    url: `${baseUrl}/fiis/${fii.ticker.toLowerCase()}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Foco Invest",
      url: baseUrl,
    },
    about: {
      "@type": "InvestmentFund",
      name: fii.fullName ?? fii.companyName,
      tickerSymbol: fii.ticker,
    },
  };

  return (
    <section className="container-page overflow-x-hidden py-10">
      <Script
        id={`fii-jsonld-${fii.ticker}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <StockHeader stock={fii} />
      <ApiStatusNotice stock={fii} />

      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <PriceChartCard ticker={fii.ticker} history={fii.history} />
          <OscillationsCard oscillations={fii.oscillations} />
          <KeyIndicatorsGrid indicators={fii.indicators} />
        </div>

        <aside className="min-w-0 space-y-6">
          <DayQuoteCard rows={fii.dayQuoteRows} />
          <DividendSummaryCard summary={fii.dividendSummary} />
          <CompanyInfoCard rows={fii.companyInfo} />
        </aside>
      </div>

      <div className="mt-6 min-w-0 space-y-6">
        <FundamentalAnalysisTable
          data={fii.fundamentalAnalysis}
          indicators={fii.indicators}
          assetKind={fii.assetKind}
        />
        <DividendsTable dividends={fii.dividends} />
      </div>
    </section>
  );
}
