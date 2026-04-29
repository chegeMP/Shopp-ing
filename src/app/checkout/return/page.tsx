"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBasket } from "@/components/BasketContext";
import { saveReceiptToStorage } from "@/lib/receipt";
import { computeOrderMoneySplit } from "@/lib/order-split";

const DRAFT_KEY = "pricesnap_card_checkout";

type OrderDraft = {
  orderNo: string;
  storeName: string;
  storeId: string;
  customerName: string;
  email: string;
  deliveryAddress?: string;
  basketProducts: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  orderTotal: number;
  platformFeeKes?: number;
  supermarketPayoutKes?: number;
};

function ReturnContent() {
  const params = useSearchParams();
  const { clearBasket } = useBasket();
  const [state, setState] = useState<"checking" | "ok" | "fail">("checking");
  const [message, setMessage] = useState("");
  const refForDisplay = params.get("reference") || params.get("trxref") || "";

  useEffect(() => {
    async function run() {
      const ref =
        params.get("reference") ||
        params.get("trxref") ||
        "";

      if (!ref) {
        setState("fail");
        setMessage("Missing payment reference. Return home and try again.");
        return;
      }

      try {
        const verifyRes = await fetch("/api/payments/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref }),
        });

        const verifyData = await verifyRes.json();

        if (
          !verifyRes.ok ||
          verifyData.status !== "success"
        ) {
          setState("fail");
          setMessage(
            verifyData.error ||
              (verifyData.message as string) ||
              "We could not confirm this payment.",
          );
          return;
        }

        const raw =
          typeof window !== "undefined"
            ? sessionStorage.getItem(DRAFT_KEY)
            : null;

        const draft: OrderDraft | null = raw ? JSON.parse(raw) : null;

        if (draft?.email?.includes("@")) {
          const s =
            draft.platformFeeKes != null && draft.supermarketPayoutKes != null
              ? {
                  platformFeeKes: draft.platformFeeKes,
                  supermarketPayoutKes: draft.supermarketPayoutKes,
                }
              : computeOrderMoneySplit(draft.orderTotal);
          await fetch("/api/email/order-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: draft.email.trim(),
              customerName: draft.customerName,
              orderNo: draft.orderNo,
              storeName: draft.storeName,
              items: draft.basketProducts,
              total: draft.orderTotal,
              paymentMethod: "Card (Paystack)",
              deliveryAddress: draft.deliveryAddress || undefined,
              platformFeeKes: s.platformFeeKes,
              supermarketPayoutKes: s.supermarketPayoutKes,
            }),
          }).catch(() => {});
        }

        if (draft) {
          const s =
            draft.platformFeeKes != null && draft.supermarketPayoutKes != null
              ? {
                  platformFeeKes: draft.platformFeeKes,
                  supermarketPayoutKes: draft.supermarketPayoutKes,
                }
              : computeOrderMoneySplit(draft.orderTotal);
          saveReceiptToStorage({
            orderNo: draft.orderNo,
            placedAt: new Date().toISOString(),
            storeName: draft.storeName,
            storeId: draft.storeId,
            customerName: draft.customerName,
            email: draft.email,
            phone: undefined,
            deliveryAddress: draft.deliveryAddress,
            notes: undefined,
            paymentMethod: "Card (Paystack)",
            items: draft.basketProducts,
            grandTotal: draft.orderTotal,
            platformFeeKes: s.platformFeeKes,
            supermarketPayoutKes: s.supermarketPayoutKes,
          });
        }

        sessionStorage.removeItem(DRAFT_KEY);
        clearBasket();
        setState("ok");
      } catch (e) {
        setState("fail");
        setMessage(
          e instanceof Error ? e.message : "Something went wrong after payment.",
        );
      }
    }

    run();
  }, [params, clearBasket]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {state === "checking" && (
        <>
          <p className="text-sm text-[#666] dark:text-[#aaa] mb-4">
            Confirming payment{refForDisplay ? ` (${refForDisplay})` : ""}…
          </p>
          <div className="animate-pulse h-10 w-full max-w-[200px] mx-auto rounded bg-[#eee] dark:bg-[#333]" />
        </>
      )}
      {state === "ok" && (
        <>
          <div className="w-14 h-14 bg-[#e8f5e9] dark:bg-[#1b3d1f] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-bold text-[#222] dark:text-[#eee] mb-2">
            Payment received
          </h1>
          <p className="text-sm text-[#555] dark:text-[#bbb] mb-8">
            Your order was placed and confirmation was sent by email where
            possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
            <Link
              href="/checkout/receipt"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#1a5dab] text-white text-sm font-semibold no-underline hover:opacity-90"
            >
              View receipt
            </Link>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded border border-[#ccc] dark:border-[#555] text-[#222] dark:text-[#eee] text-sm font-medium no-underline hover:bg-[#f5f5f5] dark:hover:bg-[#333]"
            >
              Continue shopping
            </Link>
          </div>
        </>
      )}
      {state === "fail" && (
        <>
          <h1 className="text-xl font-bold text-[#222] dark:text-[#eee] mb-2">
            Could not confirm payment
          </h1>
          <p className="text-sm text-[#777] dark:text-[#bbb] mb-8">{message}</p>
          <Link
            href="/checkout"
            className="text-[#1a5dab] text-sm no-underline hover:underline"
          >
            Back to checkout
          </Link>
        </>
      )}
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-16 text-center text-sm text-[#999]">
          Loading payment result…
        </div>
      }
    >
      <ReturnContent />
    </Suspense>
  );
}
