"use client";

import Link from "next/link";
import { useBasket } from "./BasketContext";
import { type Product, getLowestPrice } from "@/data/products";

import { useCatalog } from "@/components/CatalogContext";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const { supermarkets } = useCatalog();
  const { addItem, getQuantity, updateQuantity } = useBasket();
  const lowest = getLowestPrice(product);
  const qty = getQuantity(product.id);

  return (
    <tr className="border-b border-[#eaecef] dark:border-[#2e3238] hover:bg-[#f6f8fa]/90 dark:hover:bg-[#222628]/90 group transition-colors duration-150">
      <td className="py-3.5 pr-3">
        <div className="flex items-center gap-2.5">
          <ProductImage
            src={product.image}
            alt={product.name}
            category={product.category}
            size={36}
          />
          <div className="min-w-0">
            <Link
              href={`/compare?product=${product.id}`}
            className="font-medium text-[#1a5dab] dark:text-[#82b1ff] text-sm no-underline hover:underline"
            >
              {product.name}
            </Link>
            <p className="text-[11px] text-[#999] dark:text-[#777] leading-tight">{product.unit}</p>
          </div>
        </div>
      </td>
      {supermarkets.map((store) => {
        const pp = product.prices.find((p) => p.supermarketId === store.id);
        const isCheapest = pp?.price === lowest.price;
        return (
          <td
            key={store.id}
            className={`py-3 text-right tabular-nums whitespace-nowrap text-sm px-1 transition-colors ${
              isCheapest
                ? "font-bold text-[#2e7d32] dark:text-[#81c784] bg-[#f1f8e9] dark:bg-[#1b2f1f]"
                : "text-[#333] dark:text-[#dcdcdc]"
            }`}
          >
            {pp ? (
              <>
                {pp.price}
                {pp.onSale && (
                  <span className="text-[10px] text-[#c62828] font-bold ml-0.5 align-super">
                    *
                  </span>
                )}
              </>
            ) : (
              <span className="text-[#ccc] dark:text-[#555]">&ndash;</span>
            )}
          </td>
        );
      })}
      <td className="py-3.5 pl-2 text-right">
        {qty > 0 ? (
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-[#e2e4e8] dark:border-[#454a52] p-0.5 bg-[#fafbfc] dark:bg-[#24272c]">
            <button
              type="button"
              onClick={() => updateQuantity(product.id, qty - 1)}
              className="w-7 h-7 border-0 rounded-md text-[#5c6370] dark:text-[#bbb] hover:bg-white dark:hover:bg-[#363a42] cursor-pointer text-xs flex items-center justify-center transition-colors"
            >
              &minus;
            </button>
            <span className="w-5 text-center text-xs tabular-nums font-semibold text-[#222] dark:text-[#ececec]">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(product.id, qty + 1)}
              className="w-7 h-7 border-0 rounded-md text-[#5c6370] dark:text-[#bbb] hover:bg-white dark:hover:bg-[#363a42] cursor-pointer text-xs flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => addItem(product.id)}
            className="text-xs text-[#1a5dab] dark:text-[#90caf9] hover:bg-[#e8f0fe] dark:hover:bg-[#1e3550] cursor-pointer font-semibold rounded-lg px-2.5 py-1.5 border border-[#1a5dab]/25 dark:border-[#5b9bd5]/30 opacity-80 group-hover:opacity-100 transition-all shadow-sm"
          >
            + Add
          </button>
        )}
      </td>
    </tr>
  );
}
