/**
 * Data access layer. Currently backed by in-memory data.
 * Swap this module to read from Postgres/Mongo/Redis when ready —
 * every consumer goes through these functions so the migration is a single-file change.
 */

import {
  products as allProducts,
  categories as allCategories,
  getLowestPrice,
  getHighestPrice,
  getSavings,
  getSavingsPercentage,
  type Product,
  type Category,
} from "@/data/products";
import {
  supermarkets as allSupermarkets,
  type Supermarket,
} from "@/data/supermarkets";

// ── Products ────────────────────────────────────────────────────────

export function listProducts(opts?: {
  category?: Category;
  search?: string;
  limit?: number;
  offset?: number;
}): { data: Product[]; total: number } {
  let filtered = allProducts;

  if (opts?.category) {
    filtered = filtered.filter((p) => p.category === opts.category);
  }
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? total;
  const data = filtered.slice(offset, offset + limit);

  return { data, total };
}

export function getProduct(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id);
}

export function getTopSavings(limit = 6): Product[] {
  return [...allProducts]
    .sort((a, b) => getSavings(b) - getSavings(a))
    .slice(0, limit);
}

// ── Supermarkets ────────────────────────────────────────────────────

export function listSupermarkets(): Supermarket[] {
  return allSupermarkets;
}

export function getSupermarket(id: string): Supermarket | undefined {
  return allSupermarkets.find((s) => s.id === id);
}

export function getSupermarketStats(id: string) {
  const store = getSupermarket(id);
  if (!store) return null;

  const cheapestCount = allProducts.filter(
    (p) => getLowestPrice(p).supermarketId === id
  ).length;

  const totalCost = allProducts.reduce((sum, p) => {
    const pp = p.prices.find((pr) => pr.supermarketId === id);
    return sum + (pp?.price ?? 0);
  }, 0);

  const avgAboveCheapest = Math.round(
    allProducts.reduce((sum, p) => {
      const pp = p.prices.find((pr) => pr.supermarketId === id);
      if (!pp) return sum;
      return sum + (pp.price - getLowestPrice(p).price);
    }, 0) / allProducts.length
  );

  const saleCount = allProducts.filter((p) =>
    p.prices.some((pp) => pp.supermarketId === id && pp.onSale)
  ).length;

  return { store, cheapestCount, totalCost, avgAboveCheapest, saleCount };
}

// ── Categories ──────────────────────────────────────────────────────

export function listCategories(): Category[] {
  return allCategories;
}

// ── Re-exports for convenience ──────────────────────────────────────

export { getLowestPrice, getHighestPrice, getSavings, getSavingsPercentage };
export type { Product, Category, Supermarket };
