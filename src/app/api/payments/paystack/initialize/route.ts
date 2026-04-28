import { NextRequest, NextResponse } from "next/server";
import { paystackInitialize } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, callbackUrl, metadata } = body;

    if (!email || !amount) {
      return NextResponse.json(
        { error: "email and amount are required" },
        { status: 400 }
      );
    }

    const result = await paystackInitialize({
      email,
      amount: Number(amount),
      callbackUrl,
      metadata,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Paystack initialize error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment initialization failed" },
      { status: 500 }
    );
  }
}
