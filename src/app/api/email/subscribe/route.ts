import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmail({ to: email, name });

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error("Welcome email failed:", error);

    if (error instanceof Error && error.message.includes("MAILGUN")) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send welcome email" },
      { status: 500 }
    );
  }
}
