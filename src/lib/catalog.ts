import { cache } from "react";

import { products as memoryProducts } from "@/data/products";
import { supermarkets as memorySupermarkets } from "@/data/supermarkets";
import type { Product } from "@/data/products";
import type { Supermarket } from "@/data/supermarkets";

function useDatabaseCatalog(): boolean {
  return process.env.DATA_SOURCE === "database";
}

/** Server-only; avoid importing in client components — use CatalogContext instead. */
export const getCachedCatalog = cache(
  async (): Promise<{ products: Product[]; supermarkets: Supermarket[] }> => {
    if (!useDatabaseCatalog()) {
      return {
        products: memoryProducts,
        supermarkets: memorySupermarkets,
      };
    }

    const { fetchProductsFromDb, fetchSupermarketsFromDb } =
      await import("@/server/catalog-db");

    const [products, supermarkets] = await Promise.all([
      fetchProductsFromDb(),
      fetchSupermarketsFromDb(),
    ]);

    return { products, supermarkets };
  }
);
