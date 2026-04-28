import { NextResponse } from "next/server";
import { listSupermarkets, getSupermarketStats } from "@/lib/store";

export async function GET() {
  try {
    const stores = await listSupermarkets();
    const data = await Promise.all(
      stores.map(async (s) => {
        const stats = await getSupermarketStats(s.id);
        return {
          ...s,
          cheapestCount: stats?.cheapestCount ?? 0,
          totalCost: stats?.totalCost ?? 0,
          avgAboveCheapest: stats?.avgAboveCheapest ?? 0,
          saleCount: stats?.saleCount ?? 0,
        };
      }),
    );

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch supermarkets" },
      { status: 500 }
    );
  }
}
