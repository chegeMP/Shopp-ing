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
                  <span className="text-[#555] text-sm">{store.name}</span>
                </div>
              </td>
              <td className="py-1.5 w-full">
                <div className="h-5 bg-[#f0f0f0] rounded-sm relative">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${Math.max(20, 20 + pct * 0.8)}%`,
                      backgroundColor: isCheapest ? "#2e7d32" : "#ccc",
                    }}
                  />
                </div>
              </td>
              <td className="py-1.5 pl-3 text-right whitespace-nowrap tabular-nums">
                <span
                  className={`font-semibold ${
                    isCheapest ? "text-[#2e7d32]" : "text-[#333]"
                  }`}
                >
                  {pp.price}
                </span>
                {pp.onSale && (
                  <span className="ml-1 text-[10px] font-bold text-[#c62828] uppercase">
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
