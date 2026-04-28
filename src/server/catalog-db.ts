import "server-only";

import type { Product, Category } from "@/data/products";
import type { Supermarket } from "@/data/supermarkets";
import { getPrisma } from "@/lib/prisma";

export async function fetchProductsFromDb(): Promise<Product[]> {
  const prisma = getPrisma();
  const rows = await prisma.product.findMany({
    include: { prices: true },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => ({
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
  }));
}

export async function fetchSupermarketsFromDb(): Promise<Supermarket[]> {
  const prisma = getPrisma();
  const rows = await prisma.supermarket.findMany({
    orderBy: { name: "asc" },
  });

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
