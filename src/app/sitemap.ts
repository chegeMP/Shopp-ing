import type { MetadataRoute } from "next";
import { getCachedCatalog } from "@/lib/catalog";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, supermarkets } = await getCachedCatalog();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/compare`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/basket`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  const storePages: MetadataRoute.Sitemap = supermarkets.map((s) => ({
    url: `${BASE_URL}/supermarket?id=${s.id}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/compare?product=${p.id}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...storePages, ...productPages];
}
