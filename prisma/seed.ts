import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { products } from "../src/data/products";
import { supermarkets } from "../src/data/supermarkets";

const prisma = new PrismaClient();

type SeedProduct = (typeof products)[number] & {
  variants?: {
    variantId: string;
    label: string;
    unit: string;
    prices: {
      supermarketId: string;
      price: number;
      onSale?: boolean;
      originalPrice?: number;
    }[];
  }[];
};

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to `.env` or `.env.local`.");
    process.exit(1);
  }

  await prisma.variantPrice.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supermarket.deleteMany();

  for (const s of supermarkets) {
    await prisma.supermarket.create({
      data: {
        id: s.id,
        name: s.name,
        initial: s.initial,
        color: s.color,
        bgLight: s.bgLight,
        tagline: s.tagline,
        rating: s.rating,
      },
    });
  }

  for (const raw of products) {
    const p = raw as SeedProduct;
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        image: p.image,
        prices: {
          create: p.prices.map((pp) => ({
            supermarketId: pp.supermarketId,
            price: pp.price,
            onSale: pp.onSale ?? false,
            originalPrice: pp.originalPrice ?? null,
          })),
        },
        variants: p.variants?.length
          ? {
              create: p.variants.map((v) => ({
                variantId: v.variantId,
                label: v.label,
                unit: v.unit,
                prices: {
                  create: v.prices.map((vp) => ({
                    supermarketId: vp.supermarketId,
                    price: vp.price,
                    onSale: vp.onSale ?? false,
                    originalPrice: vp.originalPrice ?? null,
                  })),
                },
              })),
            }
          : undefined,
      },
    });
  }

  console.log(
    `Seeded ${supermarkets.length} supermarkets and ${products.length} products.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
