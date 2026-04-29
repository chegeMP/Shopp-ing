"use client";

import type { ReceiptData } from "@/lib/receipt";

const appName =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_APP_NAME ?? "PriceSnap"
    : "PriceSnap";

export function OrderReceipt({ data }: { data: ReceiptData }) {
  const placed = new Date(data.placedAt);
  const when = Number.isFinite(placed.getTime())
    ? placed.toLocaleString()
    : data.placedAt;

  return (
    <div
      id="order-receipt-print"
      className="bg-white dark:bg-[#1e1e1e] border border-[#e0e0e0] dark:border-[#444] rounded-lg p-6 max-w-md mx-auto text-left text-[#222] dark:text-[#ececec] shadow-sm"
    >
      <div className="border-b border-[#eee] dark:border-[#444] pb-4 mb-4">
        <h2 className="text-lg font-bold text-[#1a5dab] dark:text-[#90caf9] m-0">
          {appName}
        </h2>
        <p className="text-xs text-[#666] dark:text-[#aaa] mt-1 m-0">
          Order <span className="font-mono font-semibold text-[#333] dark:text-[#ddd]">
            {data.orderNo}
          </span>
        </p>
        <p className="text-xs text-[#888] dark:text-[#999] m-0 mt-0.5">{when}</p>
      </div>

      <dl className="text-sm space-y-1 m-0 mb-4">
        <div className="flex justify-between gap-3">
          <dt className="text-[#888] shrink-0">Store</dt>
          <dd className="m-0 font-medium text-right">{data.storeName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#888] shrink-0">Payment</dt>
          <dd className="m-0 text-right">{data.paymentMethod}</dd>
        </div>
      </dl>

      <div className="text-sm space-y-0.5 mb-4 pb-4 border-b border-[#eee] dark:border-[#444]">
        <p className="m-0">
          <span className="text-[#888]">Name · </span>
          <strong>{data.customerName}</strong>
        </p>
        {data.phone ? (
          <p className="m-0">
            <span className="text-[#888]">Phone · </span>
            {data.phone}
          </p>
        ) : null}
        {data.email ? (
          <p className="m-0">
            <span className="text-[#888]">Email · </span>
            {data.email}
          </p>
        ) : null}
        {data.deliveryAddress ? (
          <p className="m-0 mt-2">
            <span className="text-[#888] block mb-0.5">Delivery</span>
            {data.deliveryAddress}
          </p>
        ) : null}
        {data.notes ? (
          <p className="m-0 mt-2 text-[#555] dark:text-[#bbb] italic">
            Notes: {data.notes}
          </p>
        ) : null}
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-[#888] border-b border-[#ddd] dark:border-[#555]">
            <th className="text-left font-semibold pb-2 pr-2">Item</th>
            <th className="text-center font-semibold pb-2 px-1 w-10">Qty</th>
            <th className="text-right font-semibold pb-2 pl-2 w-[4.5rem]">
              KSh
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((line, i) => (
            <tr key={`${line.name}-${i}`} className="border-b border-[#f0f0f0] dark:border-[#383838]">
              <td className="py-2 pr-2 align-top">{line.name}</td>
              <td className="py-2 text-center tabular-nums">{line.quantity}</td>
              <td className="py-2 text-right tabular-nums align-top">
                <span className="block text-[11px] text-[#999]">
                  @ {line.unitPrice.toLocaleString()}
                </span>
                <span className="font-medium">{line.total.toLocaleString()}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-baseline mt-4 pt-3 border-t-2 border-[#333] dark:border-[#ccc]">
        <span className="text-sm font-semibold">You pay</span>
        <span className="text-lg font-bold tabular-nums">
          KSh {data.grandTotal.toLocaleString()}
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-[#e3e8ef] dark:border-[#3d4654] bg-[#f7f9fc] dark:bg-[#252a32] px-3 py-3 text-sm">
        <p className="text-xs font-semibold text-[#555] dark:text-[#bbb] uppercase tracking-wide mb-2">
          Settlement (from your payment)
        </p>
        <div className="flex justify-between gap-2 text-[#444] dark:text-[#ccc]">
          <span>{appName} fee</span>
          <span className="tabular-nums font-medium">
            KSh {data.platformFeeKes.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between gap-2 text-[#444] dark:text-[#ccc] mt-1">
          <span>{data.storeName} receives</span>
          <span className="tabular-nums font-medium">
            KSh {data.supermarketPayoutKes.toLocaleString()}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-[#999] dark:text-[#777] mt-6 mb-0 text-center">
        Thank you for shopping with {appName}.
      </p>
    </div>
  );
}
