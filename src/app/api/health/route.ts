import { NextResponse } from "next/server";
import { listProducts, listSupermarkets } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ total: productCount }, stores] = await Promise.all([
      listProducts(),
      listSupermarkets(),
    ]);
    const storeCount = stores.length;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      data: {
        products: productCount,
        supermarkets: storeCount,
      },
    });
  } catch {
    return NextResponse.json(
      { status: "unhealthy", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
