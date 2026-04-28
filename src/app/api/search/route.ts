import { NextRequest, NextResponse } from "next/server";
import { listProducts, getLowestPrice } from "@/lib/store";
import { supermarkets } from "@/data/supermarkets";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q");
    if (!q || q.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const { data } = listProducts({ search: q.trim(), limit: 10 });

    const results = data.map((p) => {
      const lowest = getLowestPrice(p);
      const store = supermarkets.find((s) => s.id === lowest.supermarketId);
      return {
        id: p.id,
        name: p.name,
        unit: p.unit,
        category: p.category,
        bestPrice: lowest.price,
        cheapestStore: store?.name ?? null,
      };
    });

    return NextResponse.json({ data: results, query: q.trim() });
  } catch {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
