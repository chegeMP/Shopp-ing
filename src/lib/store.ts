/**
 * Data access layer. Reads from Postgres when DATA_SOURCE=database, else in-memory JSON.
 */

import type { Prisma } from "@prisma/client";

import type { Category, Product } from "@/data/products";
import {
  products as memoryProducts,
  categories as allCategories,
  getLowestPrice as memLowest,
  getHighestPrice as memHighest,
  getSavings as memSavings,
  getSavingsPercentage as memSavingsPct,
} from "@/data/products";
import {
  supermarkets as memorySupermarkets,
  type Supermarket,
} from "@/data/supermarkets";

import { getPrisma } from "@/lib/prisma";

export function useDatabaseCatalog(): boolean {
  return process.env.DATA_SOURCE === "database";
}

function mapDbProduct(row: {
  id: string;
  name: string;
  category: string;
  unit: string;
  image: string;
  prices: {
    supermarketId: string;
    price: number;
    onSale: boolean;
    originalPrice: number | null;
  }[];
}): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    unit: row.unit,
    image: row.image,
    prices: row.prices.map((pp) => ({
      supermarketId: pp.supermarketId,
      price: pp.price,
      onSale: pp.onSale,
      originalPrice: pp.originalPrice ?? undefined,
    })),
  };
}

// ── Memory ─────────────────────────────────────────────────────────

function listProductsMemory(opts?: {
  category?: Category;
  search?: string;
  limit?: number;
  offset?: number;
}): { data: Product[]; total: number } {
  let filtered = memoryProducts;

  if (opts?.category) {
    filtered = filtered.filter((p) => p.category === opts.category);
  }
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(q),
    );
  }

  const total = filtered.length;
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? total;
  const data = filtered.slice(offset, offset + limit);

  return { data, total };
}

// ── Products ────────────────────────────────────────────────────────

export async function listProducts(opts?: {
  category?: Category;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: Product[]; total: number }> {
  if (!useDatabaseCatalog()) {
    return listProductsMemory(opts);
  }

  const prisma = getPrisma();

  const where: Prisma.ProductWhereInput = {};
  if (opts?.category) where.category = opts.category;
  if (opts?.search?.trim())
    where.name = { contains: opts.search.trim(), mode: "insensitive" };

  const total = await prisma.product.count({ where });
  const offset = opts?.offset ?? 0;
  const take = opts?.limit ?? total;

  const rows = await prisma.product.findMany({
    where,
    include: { prices: true },
    orderBy: { name: "asc" },
    skip: offset,
    take,
  });

  return { data: rows.map(mapDbProduct), total };
}

export async function getProduct(id: string): Promise<Product | undefined> {
  if (!useDatabaseCatalog()) {
    return memoryProducts.find((p) => p.id === id);
  }

  const prisma = getPrisma();
  const row = await prisma.product.findUnique({
    where: { id },
    include: { prices: true },
  });

  return row ? mapDbProduct(row) : undefined;
}

export async function getTopSavings(limit = 6): Promise<Product[]> {
  if (!useDatabaseCatalog()) {
    return [...memoryProducts]
      .sort((a, b) => memSavings(b) - memSavings(a))
      .slice(0, limit);
  }

  const prisma = getPrisma();
  const rows = await prisma.product.findMany({
    include: { prices: true },
  });
  const all = rows.map(mapDbProduct);
  return [...all].sort((a, b) => memSavings(b) - memSavings(a)).slice(0, limit);
}

// ── Supermarkets ────────────────────────────────────────────────────

export async function listSupermarkets(): Promise<Supermarket[]> {
  if (!useDatabaseCatalog()) return memorySupermarkets;

  const prisma = getPrisma();
  const rows = await prisma.supermarket.findMany({ orderBy: { name: "asc" } });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    initial: s.initial,
    color: s.color,
    bgLight: s.bgLight,
    tagline: s.tagline,
    rating: s.rating,
  }));
}

export async function getSupermarket(id: string): Promise<Supermarket | undefined> {
  const stores = await listSupermarkets();
  return stores.find((s) => s.id === id);
}

export async function getSupermarketStats(id: string) {
  const store = await getSupermarket(id);
  if (!store) return null;

  if (!useDatabaseCatalog()) {
    const cheapestCount = memoryProducts.filter(
      (p) => memLowest(p).supermarketId === id,
    ).length;

    const totalCost = memoryProducts.reduce((sum, p) => {
      const pp = p.prices.find((pr) => pr.supermarketId === id);
      return sum + (pp?.price ?? 0);
    }, 0);

    const avgAboveCheapest = Math.round(
      memoryProducts.reduce((sum, p) => {
        const pp = p.prices.find((pr) => pr.supermarketId === id);
        if (!pp) return sum;
        return sum + (pp.price - memLowest(p).price);
      }, 0) / memoryProducts.length,
    );

    const saleCount = memoryProducts.filter((p) =>
      p.prices.some((pp) => pp.supermarketId === id && pp.onSale),
    ).length;

    return {
      store,
      cheapestCount,
      totalCost,
      avgAboveCheapest,
      saleCount,
    };
  }

  const prisma = getPrisma();
  const rows = await prisma.product.findMany({ include: { prices: true } });
  const allProducts = rows.map(mapDbProduct);

  const cheapestCount = allProducts.filter(
    (p) => memLowest(p).supermarketId === id,
  ).length;

  const totalCost = allProducts.reduce((sum, p) => {
    const pp = p.prices.find((pr) => pr.supermarketId === id);
    return sum + (pp?.price ?? 0);
  }, 0);

  const avgAboveCheapest = Math.round(
    allProducts.reduce((sum, p) => {
      const pp = p.prices.find((pr) => pr.supermarketId === id);
      if (!pp) return sum;
      return sum + (pp.price - memLowest(p).price);
    }, 0) / allProducts.length,
  );

  const saleCount = allProducts.filter((p) =>
    p.prices.some((pp) => pp.supermarketId === id && pp.onSale),
  ).length;

  return {
    store,
    cheapestCount,
    totalCost,
    avgAboveCheapest,
    saleCount,
  };
}

// ── Categories ──────────────────────────────────────────────────────

export function listCategories(): Category[] {
  return allCategories;
}

// ── Helpers (pure, work on loaded Product graphs) ──────────────────

export function getLowestPrice(product: Product) {
  return memLowest(product);
}

export function getHighestPrice(product: Product) {
  return memHighest(product);
}

export function getSavings(product: Product) {
  return memSavings(product);
}

export function getSavingsPercentage(product: Product) {
  return memSavingsPct(product);
}

export type { Product, Category, Supermarket };
