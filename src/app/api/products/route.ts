import { NextRequest, NextResponse } from "next/server";
import { listProducts, getLowestPrice, getSavings, type Category } from "@/lib/store";
import { supermarkets } from "@/data/supermarkets";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") as Category | null;
    const search = searchParams.get("q") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const { data, total } = listProducts({ category: category ?? undefined, search, limit, offset });

    const enriched = data.map((p) => {
      const lowest = getLowestPrice(p);
      const cheapStore = supermarkets.find((s) => s.id === lowest.supermarketId);
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        bestPrice: lowest.price,
        cheapestStore: cheapStore?.name ?? null,
        savings: getSavings(p),
        prices: p.prices,
      };
    });

    return NextResponse.json(
      { data: enriched, total, limit, offset },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
