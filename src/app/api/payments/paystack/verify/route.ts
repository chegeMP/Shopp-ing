import { NextRequest, NextResponse } from "next/server";
import { paystackVerify } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "reference is required" },
        { status: 400 }
      );
    }

    const result = await paystackVerify(reference);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Paystack verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed" },
      { status: 500 }
    );
  }
}
