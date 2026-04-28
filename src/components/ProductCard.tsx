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
    <tr className="border-b border-[#eee] dark:border-[#383838] hover:bg-[#fafafa] dark:hover:bg-[#252525] group">
      <td className="py-2 pr-3">
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
              className="font-medium text-[#1a5dab] dark:text-[#82b1ff] text-sm"
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
            className={`py-2 text-right tabular-nums whitespace-nowrap text-sm px-1 ${
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
      <td className="py-2 pl-2 text-right">
        {qty > 0 ? (
          <div className="inline-flex items-center gap-0.5">
            <button
              onClick={() => updateQuantity(product.id, qty - 1)}
              className="w-6 h-6 border border-[#ccc] dark:border-[#505050] rounded text-[#666] dark:text-[#bbb] hover:bg-[#f0f0f0] dark:hover:bg-[#363636] cursor-pointer text-xs flex items-center justify-center"
            >
              &minus;
            </button>
            <span className="w-5 text-center text-xs tabular-nums font-medium text-[#222] dark:text-[#ececec]">
              {qty}
            </span>
            <button
              onClick={() => updateQuantity(product.id, qty + 1)}
              className="w-6 h-6 border border-[#ccc] dark:border-[#505050] rounded text-[#666] dark:text-[#bbb] hover:bg-[#f0f0f0] dark:hover:bg-[#363636] cursor-pointer text-xs flex items-center justify-center"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => addItem(product.id)}
            className="text-xs text-[#1a5dab] hover:text-[#0d4a8a] cursor-pointer font-medium hover:underline opacity-60 group-hover:opacity-100 transition-opacity"
          >
            + Add
          </button>
        )}
      </td>
    </tr>
  );
}
