import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmation, type OrderEmailData } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to,
      customerName,
      orderNo,
      storeName,
      items,
      total,
      paymentMethod,
      deliveryAddress,
      platformFeeKes,
      supermarketPayoutKes,
    } = body;

    if (!to || !customerName || !orderNo || !storeName || !items?.length || !total) {
      return NextResponse.json(
        { error: "Missing required fields: to, customerName, orderNo, storeName, items, total" },
        { status: 400 }
      );
    }

    const data: OrderEmailData = {
      to,
      customerName,
      orderNo,
      storeName,
      items,
      total,
      paymentMethod: paymentMethod || "Cash on delivery",
      deliveryAddress,
      platformFeeKes:
        typeof platformFeeKes === "number" ? platformFeeKes : undefined,
      supermarketPayoutKes:
        typeof supermarketPayoutKes === "number"
          ? supermarketPayoutKes
          : undefined,
    };

    const result = await sendOrderConfirmation(data);

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error("Order confirmation email failed:", error);

    if (error instanceof Error && error.message.includes("MAILGUN")) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send order confirmation" },
      { status: 500 }
    );
  }
}
