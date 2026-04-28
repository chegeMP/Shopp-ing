import { NextRequest, NextResponse } from "next/server";
import { airtelStkPush } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, transactionId } = body;

    if (!phoneNumber || !amount) {
      return NextResponse.json(
        { error: "phoneNumber and amount are required" },
        { status: 400 }
      );
    }

    const txId =
      transactionId || `ATX-${Date.now().toString(36).toUpperCase()}`;

    const result = await airtelStkPush({
      phoneNumber,
      amount: Number(amount),
      transactionId: txId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Airtel STK push error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "STK push failed" },
      { status: 500 }
    );
  }
}
