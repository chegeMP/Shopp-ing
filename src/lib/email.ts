import Mailgun from "mailgun.js";
import FormData from "form-data";

const mailgun = new Mailgun(FormData);

function getClient() {
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) throw new Error("MAILGUN_API_KEY is not set");
  return mailgun.client({ username: "api", key: apiKey });
}

function getDomain() {
  const domain = process.env.MAILGUN_DOMAIN;
  if (!domain) throw new Error("MAILGUN_DOMAIN is not set");
  return domain;
}

function getFrom() {
  return process.env.MAILGUN_FROM || `PriceSnap <noreply@${getDomain()}>`;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderEmailData {
  to: string;
  customerName: string;
  orderNo: string;
  storeName: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  deliveryAddress?: string;
}

export interface SubscriptionEmailData {
  to: string;
  name?: string;
}

export interface PriceAlertEmailData {
  to: string;
  customerName: string;
  alerts: {
    productName: string;
    oldPrice: number;
    newPrice: number;
    storeName: string;
    savings: number;
  }[];
}

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333">${item.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;color:#666;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;color:#666;text-align:right">KSh ${item.unitPrice.toLocaleString()}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;color:#222;text-align:right;font-weight:600">KSh ${item.total.toLocaleString()}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden">
      <!-- Header -->
      <div style="background:#2e7d32;padding:24px 20px;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Order Confirmed</h1>
        <p style="margin:6px 0 0;color:#c8e6c9;font-size:13px">Thank you for shopping with PriceSnap</p>
      </div>

      <!-- Order details -->
      <div style="padding:24px 20px">
        <p style="margin:0 0 16px;font-size:15px;color:#333">
          Hi <strong>${data.customerName}</strong>, your order has been placed successfully.
        </p>

        <div style="background:#f7f7f7;border:1px solid #e8e8e8;border-radius:4px;padding:14px 16px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:3px 0;font-size:13px;color:#888">Order number</td>
              <td style="padding:3px 0;font-size:13px;color:#222;text-align:right;font-weight:600">${data.orderNo}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:13px;color:#888">Store</td>
              <td style="padding:3px 0;font-size:13px;color:#222;text-align:right;font-weight:500">${data.storeName}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:13px;color:#888">Payment</td>
              <td style="padding:3px 0;font-size:13px;color:#222;text-align:right">${data.paymentMethod}</td>
            </tr>
            ${data.deliveryAddress ? `<tr>
              <td style="padding:3px 0;font-size:13px;color:#888">Delivery</td>
              <td style="padding:3px 0;font-size:13px;color:#222;text-align:right">${data.deliveryAddress}</td>
            </tr>` : ""}
          </table>
        </div>

        <!-- Items table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr style="background:#f9f9f9">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee">Item</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee">Price</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:12px;text-align:right;font-size:15px;font-weight:700;color:#222;border-top:2px solid #ddd">Total</td>
              <td style="padding:12px;text-align:right;font-size:15px;font-weight:700;color:#2e7d32;border-top:2px solid #ddd">KSh ${data.total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Footer -->
      <div style="background:#f9f9f9;padding:16px 20px;border-top:1px solid #eee;text-align:center">
        <p style="margin:0;font-size:12px;color:#999">
          Questions? Reply to this email or visit <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}" style="color:#1a5dab">PriceSnap</a>.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildWelcomeHtml(name?: string): string {
  const greeting = name ? `Hi ${name}` : "Hi there";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden">
      <div style="background:#1a5dab;padding:24px 20px;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Welcome to PriceSnap</h1>
      </div>
      <div style="padding:24px 20px">
        <p style="margin:0 0 14px;font-size:15px;color:#333">
          ${greeting}, welcome to <strong>PriceSnap</strong> — your smart supermarket price comparison tool.
        </p>
        <p style="margin:0 0 14px;font-size:14px;color:#555">Here&rsquo;s what you&rsquo;ll get:</p>
        <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#555;line-height:1.8">
          <li><strong>Weekly price drop alerts</strong> &mdash; we&rsquo;ll email you when products you care about go on sale.</li>
          <li><strong>Best deal roundups</strong> &mdash; a weekly summary of the biggest savings across supermarkets.</li>
          <li><strong>New product notifications</strong> &mdash; be the first to know when new items are tracked.</li>
        </ul>
        <div style="text-align:center;margin:20px 0">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}" style="display:inline-block;background:#1a5dab;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;font-weight:600">
            Start Comparing Prices
          </a>
        </div>
      </div>
      <div style="background:#f9f9f9;padding:16px 20px;border-top:1px solid #eee;text-align:center">
        <p style="margin:0;font-size:12px;color:#999">You received this because you subscribed on PriceSnap. You can unsubscribe anytime.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildPriceAlertHtml(data: PriceAlertEmailData): string {
  const alertRows = data.alerts
    .map(
      (a) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;font-weight:500">${a.productName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#999;text-decoration:line-through;text-align:right">KSh ${a.oldPrice.toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#b71c1c;font-weight:700;text-align:right">KSh ${a.newPrice.toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;color:#666;text-align:center">${a.storeName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;color:#2e7d32;font-weight:600;text-align:right">Save KSh ${a.savings.toLocaleString()}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden">
      <div style="background:#b71c1c;padding:24px 20px;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Price Drop Alert!</h1>
        <p style="margin:6px 0 0;color:#ffcdd2;font-size:13px">${data.alerts.length} product${data.alerts.length > 1 ? "s" : ""} just got cheaper</p>
      </div>
      <div style="padding:24px 20px">
        <p style="margin:0 0 16px;font-size:15px;color:#333">
          Hi <strong>${data.customerName}</strong>, prices just dropped on items you might like:
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <thead>
            <tr style="background:#f9f9f9">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;border-bottom:2px solid #eee">Product</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;border-bottom:2px solid #eee">Was</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;border-bottom:2px solid #eee">Now</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;color:#888;text-transform:uppercase;border-bottom:2px solid #eee">Store</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;border-bottom:2px solid #eee">Savings</th>
            </tr>
          </thead>
          <tbody>${alertRows}</tbody>
        </table>
        <div style="text-align:center">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}" style="display:inline-block;background:#b71c1c;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;font-weight:600">
            View All Deals
          </a>
        </div>
      </div>
      <div style="background:#f9f9f9;padding:16px 20px;border-top:1px solid #eee;text-align:center">
        <p style="margin:0;font-size:12px;color:#999">You&rsquo;re receiving this because you subscribed to price alerts on PriceSnap.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const mg = getClient();
  const domain = getDomain();

  return mg.messages.create(domain, {
    from: getFrom(),
    to: [data.to],
    subject: `Order confirmed — ${data.orderNo}`,
    html: buildOrderConfirmationHtml(data),
  });
}

export async function sendWelcomeEmail(data: SubscriptionEmailData) {
  const mg = getClient();
  const domain = getDomain();

  return mg.messages.create(domain, {
    from: getFrom(),
    to: [data.to],
    subject: "Welcome to PriceSnap — your price comparison assistant",
    html: buildWelcomeHtml(data.name),
  });
}

export async function sendPriceAlertEmail(data: PriceAlertEmailData) {
  const mg = getClient();
  const domain = getDomain();

  return mg.messages.create(domain, {
    from: getFrom(),
    to: [data.to],
    subject: `Price drop! ${data.alerts.length} item${data.alerts.length > 1 ? "s" : ""} just got cheaper`,
    html: buildPriceAlertHtml(data),
  });
}
