import type { Metadata } from "next";
import "@/app/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getBaseUrl } from "@/lib/seo";

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Foco Invest | Cotação, Indicadores e Fundamentos de Ações",
    template: "%s | Foco Invest"
  },
  description:
    "Consulte cotação, gráfico, oscilações, dividendos, indicadores, balanços e fundamentos das principais ações brasileiras.",
  keywords: [
    "ações brasileiras",
    "cotação de ações",
    "indicadores fundamentalistas",
    "dividend yield",
    "P/L",
    "P/VP",
    "ROE",
    "fundamentos de ações"
  ],
  applicationName: "Foco Invest",
  authors: [{ name: "Foco Invest" }],
  creator: "Foco Invest",
  publisher: "Foco Invest",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Foco Invest",
    description: "Consulte ações brasileiras com clareza.",
    url: baseUrl,
    siteName: "Foco Invest",
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Foco Invest",
    description: "Consulte ações brasileiras com clareza."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1
    }
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
