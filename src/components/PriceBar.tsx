"use client";

import type { Product } from "@/data/products";
import { useCatalog } from "@/components/CatalogContext";
import { StoreBadge } from "./StoreBadge";

export function PriceBar({ product }: { product: Product }) {
  const { supermarkets } = useCatalog();
  const sorted = [...product.prices].sort((a, b) => a.price - b.price);
  const minPrice = sorted[0].price;
  const maxPrice = sorted[sorted.length - 1].price;
  const range = maxPrice - minPrice || 1;

  return (
    <table className="w-full text-sm">
      <tbody>
        {sorted.map((pp, i) => {
          const store = supermarkets.find((s) => s.id === pp.supermarketId);
          if (!store) return null;
          const pct = ((pp.price - minPrice) / range) * 100;
          const isCheapest = i === 0;

          return (
            <tr key={pp.supermarketId}>
              <td className="py-1.5 pr-3 whitespace-nowrap w-28">
                <div className="flex items-center gap-1.5">
                  <StoreBadge store={store} />
                  <span className="text-[#5c6370] dark:text-[#b8bdc6] text-sm">
                    {store.name}
                  </span>
                </div>
              </td>
              <td className="py-1.5 w-full">
                <div className="h-5 bg-[#e8eaee] dark:bg-[#333842] rounded-full overflow-hidden ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${
                      isCheapest
                        ? "bg-[#2e7d32] dark:bg-[#4caf50]"
                        : "bg-[#94a3b8] dark:bg-[#5c6578]"
                    }`}
                    style={{
                      width: `${Math.max(20, 20 + pct * 0.8)}%`,
                    }}
                  />
                </div>
              </td>
              <td className="py-1.5 pl-3 text-right whitespace-nowrap tabular-nums">
                <span
                  className={`font-semibold ${
                    isCheapest
                      ? "text-[#2e7d32] dark:text-[#81c784]"
                      : "text-[#333] dark:text-[#e2e4e8]"
                  }`}
                >
                  {pp.price}
                </span>
                {pp.onSale && (
                  <span className="ml-1 text-[10px] font-bold text-[#c62828] dark:text-[#ff8a80] uppercase">
                    sale
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
