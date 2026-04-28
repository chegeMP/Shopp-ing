// ---------------------------------------------------------------------------
// Payment service — Paystack (cards) & Airtel Money (STK push)
// Falls back to mock responses when API keys are not configured.
// ---------------------------------------------------------------------------

const PAYSTACK_SECRET = () => process.env.PAYSTACK_SECRET_KEY ?? "";
const PAYSTACK_BASE = "https://api.paystack.co";

const AIRTEL_CLIENT_ID = () => process.env.AIRTEL_CLIENT_ID ?? "";
const AIRTEL_CLIENT_SECRET = () => process.env.AIRTEL_CLIENT_SECRET ?? "";
const AIRTEL_ENV = () =>
  (process.env.AIRTEL_ENVIRONMENT as "sandbox" | "production") ?? "sandbox";
const AIRTEL_BASE = () =>
  AIRTEL_ENV() === "production"
    ? "https://openapi.airtel.africa"
    : "https://openapiuat.airtel.africa";

function isMockMode(provider: "paystack" | "airtel"): boolean {
  if (provider === "paystack") return !PAYSTACK_SECRET();
  return !AIRTEL_CLIENT_ID() || !AIRTEL_CLIENT_SECRET();
}

function mockRef() {
  return `MOCK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ========================== PAYSTACK ==========================

export interface PaystackInitParams {
  email: string;
  amount: number; // in KSh (will be converted to cents)
  currency?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResult {
  success: boolean;
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  mock: boolean;
}

export async function paystackInitialize(
  params: PaystackInitParams
): Promise<PaystackInitResult> {
  if (isMockMode("paystack")) {
    const ref = mockRef();
    return {
      success: true,
      authorizationUrl: `https://checkout.paystack.com/mock/${ref}`,
      accessCode: ref,
      reference: ref,
      mock: true,
    };
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amount * 100), // Paystack uses lowest currency unit
      currency: params.currency ?? "KES",
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Paystack initialization failed");
  }

  return {
    success: true,
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
    mock: false,
  };
}

export interface PaystackVerifyResult {
  success: boolean;
  status: "success" | "failed" | "abandoned" | "pending";
  reference: string;
  amount: number;
  currency: string;
  paidAt: string | null;
  mock: boolean;
}

export async function paystackVerify(
  reference: string
): Promise<PaystackVerifyResult> {
  if (isMockMode("paystack")) {
    return {
      success: true,
      status: "success",
      reference,
      amount: 0,
      currency: "KES",
      paidAt: new Date().toISOString(),
      mock: true,
    };
  }

  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET()}` },
    }
  );

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Paystack verification failed");
  }

  return {
    success: true,
    status: data.data.status,
    reference: data.data.reference,
    amount: data.data.amount / 100,
    currency: data.data.currency,
    paidAt: data.data.paid_at,
    mock: false,
  };
}

// ======================== AIRTEL MONEY ========================

let airtelToken: { token: string; expiresAt: number } | null = null;

async function getAirtelToken(): Promise<string> {
  if (airtelToken && Date.now() < airtelToken.expiresAt) {
    return airtelToken.token;
  }

  const res = await fetch(`${AIRTEL_BASE()}/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: AIRTEL_CLIENT_ID(),
      client_secret: AIRTEL_CLIENT_SECRET(),
      grant_type: "client_credentials",
    }),
  });

  const data = await res.json();
  airtelToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return airtelToken.token;
}

export interface AirtelStkPushParams {
  phoneNumber: string; // e.g. "0712345678" or "254712345678"
  amount: number;
  transactionId: string;
  currency?: string;
  country?: string;
}

export interface AirtelStkPushResult {
  success: boolean;
  transactionId: string;
  status: "pending" | "success" | "failed";
  message: string;
  mock: boolean;
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "").replace(/^0+/, "");
  if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

export async function airtelStkPush(
  params: AirtelStkPushParams
): Promise<AirtelStkPushResult> {
  if (isMockMode("airtel")) {
    return {
      success: true,
      transactionId: params.transactionId,
      status: "pending",
      message:
        "Mock STK push sent. In production, the user would receive a payment prompt on their phone.",
      mock: true,
    };
  }

  const token = await getAirtelToken();
  const phone = normalizePhone(params.phoneNumber);

  const res = await fetch(`${AIRTEL_BASE()}/merchant/v1/payments/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Country": params.country ?? "KE",
      "X-Currency": params.currency ?? "KES",
    },
    body: JSON.stringify({
      reference: params.transactionId,
      subscriber: {
        country: params.country ?? "KE",
        currency: params.currency ?? "KES",
        msisdn: phone,
      },
      transaction: {
        amount: params.amount,
        country: params.country ?? "KE",
        currency: params.currency ?? "KES",
        id: params.transactionId,
      },
    }),
  });

  const data = await res.json();

  if (data.status?.code !== "200") {
    throw new Error(
      data.status?.message || "Airtel Money STK push failed"
    );
  }

  return {
    success: true,
    transactionId: params.transactionId,
    status: "pending",
    message: "Payment prompt sent to your phone. Please enter your PIN to confirm.",
    mock: false,
  };
}

export interface AirtelCallbackPayload {
  transaction: {
    id: string;
    status_code: string;
    message: string;
  };
}

export function parseAirtelCallback(body: AirtelCallbackPayload): {
  transactionId: string;
  status: "success" | "failed";
  message: string;
} {
  const tx = body.transaction;
  return {
    transactionId: tx.id,
    status: tx.status_code === "TS" ? "success" : "failed",
    message: tx.message,
  };
}
