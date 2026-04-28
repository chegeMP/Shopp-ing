"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useBasket } from "@/components/BasketContext";
import { StoreBadge } from "@/components/StoreBadge";
import { ProductImage } from "@/components/ProductImage";
import { useCatalog } from "@/components/CatalogContext";
import Link from "next/link";
import { saveReceiptToStorage, type ReceiptData } from "@/lib/receipt";

function CheckoutContent() {
  const { products, supermarkets } = useCatalog();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("store");
  const store = supermarkets.find((s) => s.id === storeId);
  const { items, clearBasket } = useBasket();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    payment: "mpesa",
  });
  const [submitted, setSubmitted] = useState(false);
  const [orderNo] = useState(
    () => `PS-${Date.now().toString(36).toUpperCase()}`
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [completedReceipt, setCompletedReceipt] =
    useState<ReceiptData | null>(null);

  const basketProducts = useMemo(() => {
    return items
      .map((item) => ({
        ...item,
        product: products.find((p) => p.id === item.productId),
      }))
      .filter((item) => item.product !== undefined);
  }, [items, products]);

  const orderTotal = useMemo(() => {
    if (!store) return 0;
    return basketProducts.reduce((sum, item) => {
      const pp = item.product!.prices.find(
        (p) => p.supermarketId === store.id
      );
      return sum + (pp ? pp.price * item.quantity : 0);
    }, 0);
  }, [basketProducts, store]);

  const paymentLabel =
    form.payment === "mpesa"
      ? "M-Pesa / mobile money"
      : form.payment === "card"
        ? "Card (Paystack)"
        : "Cash on delivery";

  if (!store) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h1 className="text-lg font-bold text-[#222] mb-2">
          No store selected
        </h1>
        <p className="text-sm text-[#666] mb-4">
          Go back to your basket and choose a supermarket.
        </p>
        <Link href="/basket" className="text-sm text-[#1a5dab]">
          &larr; Back to basket
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !submitted) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h1 className="text-lg font-bold text-[#222] mb-2">
          Your basket is empty
        </h1>
        <Link href="/" className="text-sm text-[#1a5dab]">
          &larr; Browse products
        </Link>
      </div>
    );
  }

  if (submitted && completedReceipt) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-14 h-14 bg-[#e8f5e9] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-[#2e7d32]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#222] mb-1 dark:text-[#eee]">
          Order placed!
        </h1>
        <p className="text-sm text-[#666] mb-4 dark:text-[#bbb]">
          Your order <strong>{completedReceipt.orderNo}</strong> has been placed at{" "}
          <strong>{store.name}</strong>.
        </p>
        <div className="bg-[#f7f7f7] dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] rounded p-4 text-left text-sm text-[#555] dark:text-[#ccc] mb-6 mx-auto max-w-sm">
          <div className="flex justify-between mb-1">
            <span>Order number</span>
            <span className="font-semibold text-[#222] dark:text-[#eee]">{completedReceipt.orderNo}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Store</span>
            <span className="font-medium text-[#222] dark:text-[#eee]">{store.name}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Items</span>
            <span>{completedReceipt.items.length}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Payment</span>
            <span>{completedReceipt.paymentMethod}</span>
          </div>
          <div className="flex justify-between border-t border-[#ddd] dark:border-[#555] pt-1.5 mt-1.5 font-bold text-[#222] dark:text-[#eee]">
            <span>Total</span>
            <span>KSh {completedReceipt.grandTotal.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex justify-center mb-5">
          <Link
            href="/checkout/receipt"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#1a5dab] text-white text-sm font-semibold no-underline hover:opacity-90"
          >
            View & download receipt
          </Link>
        </div>
        <p className="text-xs text-[#999] mb-5 dark:text-[#888]">
          A confirmation will be sent to{" "}
          <strong>{completedReceipt.email || completedReceipt.phone || "your details"}</strong> when email is configured.
        </p>
        <Link href="/" className="text-sm text-[#1a5dab] no-underline hover:underline">
          &larr; Continue shopping
        </Link>
      </div>
    );
  }

  const isValid = form.name.trim() && (form.phone.trim() || form.email.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitError(null);
    setSubmitting(true);

    const lineItems = basketProducts.map(({ product, quantity }) => {
      const pp = product!.prices.find((x) => x.supermarketId === store!.id);
      const unitPrice = pp?.price ?? 0;
      return {
        name: product!.name,
        quantity,
        unitPrice,
        total: unitPrice * quantity,
      };
    });

    try {
      if (form.payment === "card") {
        const mail = form.email.trim();
        if (!mail.includes("@")) {
          setSubmitError("Email is required for card payment.");
          return;
        }
        const draft = {
          orderNo,
          storeName: store!.name,
          storeId: store!.id,
          customerName: form.name.trim(),
          email: mail,
          deliveryAddress: form.address.trim() || undefined,
          basketProducts: lineItems,
          orderTotal,
        };
        sessionStorage.setItem("pricesnap_card_checkout", JSON.stringify(draft));

        const appUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        const initRes = await fetch("/api/payments/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: mail,
            amount: orderTotal,
            callbackUrl: `${appUrl}/checkout/return`,
            metadata: {
              orderNo,
              storeId: store!.id,
            },
          }),
        });
        const initData = await initRes.json();
        if (!initRes.ok || !initData.authorizationUrl) {
          throw new Error(initData.error || "Could not start card payment.");
        }
        window.location.href = initData.authorizationUrl as string;
        return;
      }

      if (form.payment === "mpesa") {
        const phone = form.phone.trim();
        if (!phone) {
          setSubmitError("Phone number is required for mobile money.");
          return;
        }
        const stkRes = await fetch("/api/payments/airtel/stk-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phone.replace(/\s/g, ""),
            amount: orderTotal,
            transactionId: orderNo,
          }),
        });
        const stkData = await stkRes.json();
        if (!stkRes.ok) {
          throw new Error(stkData.error || "Could not initiate payment prompt.");
        }
      }

      const mail = form.email.trim();
      if (
        mail &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)
      ) {
        await fetch("/api/email/order-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: mail,
            customerName: form.name.trim(),
            orderNo,
            storeName: store!.name,
            items: lineItems,
            total: orderTotal,
            paymentMethod: paymentLabel,
            deliveryAddress: form.address.trim() || undefined,
          }),
        }).catch(() => {});
      }

      const receipt: ReceiptData = {
        orderNo,
        placedAt: new Date().toISOString(),
        storeName: store!.name,
        storeId: store!.id,
        customerName: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        deliveryAddress: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
        paymentMethod: paymentLabel,
        items: lineItems,
        grandTotal: orderTotal,
      };
      saveReceiptToStorage(receipt);
      setCompletedReceipt(receipt);

      setSubmitted(true);
      clearBasket();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link
        href="/basket"
        className="text-xs text-[#1a5dab] mb-4 inline-block"
      >
        &larr; Back to basket
      </Link>
      <h1 className="text-xl font-bold text-[#222] mb-1">Checkout</h1>
      {submitError && (
        <p
          className="text-sm text-[#c62828] bg-[#ffebee] border border-[#ffcdd2] rounded px-3 py-2 mb-4 dark:bg-[#401418] dark:text-[#ffcdd2] dark:border-[#661f24]"
          role="alert"
        >
          {submitError}
        </p>
      )}
      <p className="text-sm text-[#666] mb-6">
        Shopping at{" "}
        <span className="inline-flex items-center gap-1">
          <StoreBadge store={store} />
          <strong className="text-[#222]">{store.name}</strong>
        </span>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Form */}
          <div className="space-y-5">
            {/* Customer info */}
            <fieldset className="border border-[#ddd] rounded">
              <legend className="px-2 ml-2 text-xs font-semibold text-[#888] uppercase tracking-wide">
                Your details
              </legend>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#555] mb-1">
                    Full name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-[#ccc] rounded text-sm bg-white focus:outline-none focus:border-[#4a90d9]"
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#555] mb-1">
                      Phone number *
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-[#ccc] rounded text-sm bg-white focus:outline-none focus:border-[#4a90d9]"
                      placeholder="0712 345 678"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#555] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-[#ccc] rounded text-sm bg-white focus:outline-none focus:border-[#4a90d9]"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Delivery */}
            <fieldset className="border border-[#ddd] rounded">
              <legend className="px-2 ml-2 text-xs font-semibold text-[#888] uppercase tracking-wide">
                Delivery
              </legend>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#555] mb-1">
                    Delivery address
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-[#ccc] rounded text-sm bg-white focus:outline-none focus:border-[#4a90d9] resize-none"
                    placeholder="Building, street, area..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#555] mb-1">
                    Order notes (optional)
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-[#ccc] rounded text-sm bg-white focus:outline-none focus:border-[#4a90d9]"
                    placeholder="Any special instructions..."
                  />
                </div>
              </div>
            </fieldset>

            {/* Payment */}
            <fieldset className="border border-[#ddd] rounded">
              <legend className="px-2 ml-2 text-xs font-semibold text-[#888] uppercase tracking-wide">
                Payment method
              </legend>
              <div className="p-4 space-y-2">
                {[
                  {
                    id: "mpesa",
                    label: "Mobile money",
                    desc: "STK-style prompt (Airtel Money API or mock sandbox)",
                  },
                  { id: "card", label: "Card", desc: "Visa / Mastercard" },
                  { id: "cash", label: "Cash on delivery", desc: "Pay when you receive" },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                      form.payment === method.id
                        ? "border-[#1a5dab] bg-[#e8f0fe]"
                        : "border-[#ddd] hover:bg-[#fafafa]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={form.payment === method.id}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, payment: e.target.value }))
                      }
                      className="accent-[#1a5dab]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#222]">
                        {method.label}
                      </p>
                      <p className="text-xs text-[#999]">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Order summary */}
          <div>
            <div className="border border-[#ddd] rounded sticky top-16">
              <div className="px-3 py-2 border-b border-[#eee] bg-[#f7f7f7]">
                <p className="text-xs font-semibold text-[#888] uppercase tracking-wide">
                  Order summary — {store.name}
                </p>
              </div>
              <div className="divide-y divide-[#f0f0f0] max-h-[40vh] overflow-y-auto">
                {basketProducts.map(({ product, quantity, productId }) => {
                  if (!product) return null;
                  const pp = product.prices.find(
                    (p) => p.supermarketId === store.id
                  );
                  const price = pp?.price ?? 0;
                  return (
                    <div
                      key={productId}
                      className="px-3 py-2.5 flex items-center gap-2.5"
                    >
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        category={product.category}
                        size={36}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#222] truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-[#999]">
                          {quantity} &times; KSh {price}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#222] tabular-nums shrink-0">
                        {(price * quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="px-3 py-3 border-t border-[#ddd] bg-[#f7f7f7]">
                <div className="flex justify-between font-bold text-[#222] text-sm">
                  <span>Total</span>
                  <span className="tabular-nums">
                    KSh {orderTotal.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className={`w-full py-3 rounded font-semibold text-sm transition-colors ${
                    isValid && !submitting
                      ? "bg-[#2e7d32] text-white hover:bg-[#256d28] cursor-pointer"
                      : "bg-[#ccc] text-[#888] cursor-not-allowed"
                  }`}
                >
                  {submitting
                    ? "Please wait…"
                    : `Place order — KSh ${orderTotal.toLocaleString()}`}
                </button>
                <p className="text-[11px] text-[#999] text-center mt-2">
                  By placing this order you agree to our terms of service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-[#999]">
          Loading checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
