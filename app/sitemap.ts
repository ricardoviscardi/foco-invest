import type { MetadataRoute } from "next";
import { glossaryItems } from "@/lib/glossary-data";
import { getBaseUrl } from "@/lib/seo";
import { popularFIIs, popularStocks } from "@/lib/stocks/stock-list";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticRoutes = ["", "/acoes", "/fiis", "/glossario", "/metodologia", "/sobre", "/contato", "/privacidade", "/termos", "/rankings"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7
  }));

  const stockRoutes = popularStocks.map((ticker) => ({
    url: `${baseUrl}/acoes/${ticker.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9
  }));

  const fiiRoutes = popularFIIs.map((ticker) => ({
    url: `${baseUrl}/fiis/${ticker.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.85
  }));

  const glossaryRoutes = glossaryItems.map((item) => ({
    url: `${baseUrl}/glossario/${item.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75
  }));

  return [...staticRoutes, ...stockRoutes, ...fiiRoutes, ...glossaryRoutes];
}
