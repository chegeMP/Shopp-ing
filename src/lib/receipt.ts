/** Last completed order receipt (session-only, overwritten on next checkout). */

export type ReceiptLineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export interface ReceiptData {
  orderNo: string;
  placedAt: string;
  storeName: string;
  storeId: string;
  customerName: string;
  email?: string;
  phone?: string;
  deliveryAddress?: string;
  notes?: string;
  paymentMethod: string;
  items: ReceiptLineItem[];
  /** What the customer pays (basket total). */
  grandTotal: number;
  /** PriceSnap fee retained from `grandTotal` (KSh). */
  platformFeeKes: number;
  /** Amount attributed to the supermarket after the platform fee (KSh). */
  supermarketPayoutKes: number;
}

export const RECEIPT_STORAGE_KEY = "pricesnap_last_receipt";

export function saveReceiptToStorage(data: ReceiptData): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(data));
}

export function loadReceiptFromStorage(): ReceiptData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RECEIPT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReceiptData;
    if (
      typeof parsed.orderNo !== "string" ||
      typeof parsed.grandTotal !== "number"
    )
      return null;
    if (typeof parsed.platformFeeKes !== "number") {
      parsed.platformFeeKes = 0;
      parsed.supermarketPayoutKes = parsed.grandTotal;
    }
    if (typeof parsed.supermarketPayoutKes !== "number") {
      parsed.supermarketPayoutKes = Math.max(
        0,
        parsed.grandTotal - (parsed.platformFeeKes ?? 0),
      );
    }
    return parsed;
  } catch {
    return null;
  }
}

export function receiptFilename(orderNo: string): string {
  const safe = orderNo.replace(/\W+/g, "-");
  return `PriceSnap-receipt-${safe}.html`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildStandaloneReceiptHtml(
  data: ReceiptData,
  appName = "PriceSnap",
): string {
  const rows = data.items
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;">${escapeHtml(row.name)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${row.quantity}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;">${row.unitPrice.toLocaleString()}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;">${row.total.toLocaleString()}</td>
        </tr>`,
    )
    .join("");

  const placed = new Date(data.placedAt);
  const when = Number.isFinite(placed.getTime())
    ? placed.toLocaleString()
    : data.placedAt;

  const metaLines: string[] = [
    `<p style="margin:4px 0;"><strong>Name:</strong> ${escapeHtml(data.customerName)}</p>`,
  ];
  if (data.phone)
    metaLines.push(
      `<p style="margin:4px 0;"><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>`,
    );
  if (data.email)
    metaLines.push(
      `<p style="margin:4px 0;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>`,
    );
  if (data.deliveryAddress)
    metaLines.push(
      `<p style="margin:4px 0;"><strong>Address:</strong> ${escapeHtml(data.deliveryAddress)}</p>`,
    );
  if (data.notes)
    metaLines.push(
      `<p style="margin:4px 0;"><strong>Notes:</strong> ${escapeHtml(data.notes)}</p>`,
    );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Receipt ${escapeHtml(data.orderNo)} — ${escapeHtml(appName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; color: #222; background: #fafafa; }
    .card { max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    .muted { color: #666; font-size: 13px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; padding: 8px 10px; border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; color: #666; }
    .total { text-align: right; font-size: 16px; font-weight: 700; margin-top: 16px; padding-top: 12px; border-top: 2px solid #333; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(appName)}</h1>
    <p class="muted">Order <strong>${escapeHtml(data.orderNo)}</strong> · ${escapeHtml(when)}</p>
    <p style="margin:8px 0 4px;"><strong>Store:</strong> ${escapeHtml(data.storeName)}</p>
    <p style="margin:4px 0 16px;"><strong>Payment:</strong> ${escapeHtml(data.paymentMethod)}</p>
    ${metaLines.join("")}
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit (KSh)</th>
          <th style="text-align:right;">Line (KSh)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="total">You pay: KSh ${data.grandTotal.toLocaleString()}</p>
    <div style="margin-top:12px;padding:12px;background:#f7f9fc;border-radius:8px;border:1px solid #e3e8ef;font-size:13px;color:#555">
      <p style="margin:0 0 6px;font-weight:600;color:#333">Settlement (from your payment)</p>
      <p style="margin:4px 0"><strong>${escapeHtml(appName)}</strong> fee: KSh ${data.platformFeeKes.toLocaleString()}</p>
      <p style="margin:4px 0"><strong>${escapeHtml(data.storeName)}</strong> receives: KSh ${data.supermarketPayoutKes.toLocaleString()}</p>
    </div>
    <p style="margin-top:20px;font-size:12px;color:#888;">Thank you for shopping with ${escapeHtml(appName)}.</p>
  </div>
</body>
</html>`;
}

export function downloadReceiptAsHtmlFile(data: ReceiptData): void {
  const name =
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_APP_NAME ?? "PriceSnap"
      : "PriceSnap");
  const html = buildStandaloneReceiptHtml(data, name);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = receiptFilename(data.orderNo);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
