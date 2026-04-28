import { NextRequest, NextResponse } from "next/server";
import { parseAirtelCallback } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = parseAirtelCallback(body);

    console.log("Airtel Money callback:", result);

    // In production: update order status in the database,
    // send confirmation email, etc.

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("Airtel callback error:", error);
    return NextResponse.json(
      { error: "Invalid callback payload" },
      { status: 400 }
    );
  }
}
