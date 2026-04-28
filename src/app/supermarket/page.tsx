"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supermarkets } from "@/data/supermarkets";
import { products, getLowestPrice, categories } from "@/data/products";
import { useBasket } from "@/components/BasketContext";
import { StoreBadge } from "@/components/StoreBadge";
import { ProductImage } from "@/components/ProductImage";
import Link from "next/link";

function SupermarketContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id");
  const store = supermarkets.find((s) => s.id === storeId);
  const { addItem, getQuantity, updateQuantity } = useBasket();

  if (!store) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h1 className="text-lg font-bold text-[#222] mb-2">
          Store not found
        </h1>
        <Link href="/">Back to home</Link>
      </div>
    );
  }

  const storeProducts = products.map((product) => {
    const storePrice = product.prices.find(
      (p) => p.supermarketId === store.id
    );
    const lowest = getLowestPrice(product);
    const isCheapest = lowest.supermarketId === store.id;
    return { product, storePrice, isCheapest, lowestPrice: lowest.price };
  });

  const cheapestCount = storeProducts.filter((sp) => sp.isCheapest).length;
  const avgDiff = Math.round(
    storeProducts.reduce((sum, sp) => {
      if (!sp.storePrice) return sum;
      return sum + (sp.storePrice.price - sp.lowestPrice);
    }, 0) / storeProducts.length
  );

  const groupedByCategory = categories
    .map((cat) => ({
      category: cat,
      items: storeProducts.filter((sp) => sp.product.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <StoreBadge store={store} />
        <h1 className="text-xl font-bold text-[#222]">{store.name}</h1>
      </div>
      <p className="text-sm text-[#666] mb-5">{store.tagline}</p>

      {/* Stats row */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#555] mb-6 pb-5 border-b border-[#ddd]">
        <span>
          <strong className="text-[#222]">{products.length}</strong> products
        </span>
        <span>
          <strong className="text-[#222]">{cheapestCount}</strong> lowest
          prices
        </span>
        <span>
          <strong className="text-[#222]">{store.rating}</strong>/5 rating
        </span>
        <span>
          Avg.{" "}
          <strong className="text-[#222]">KSh {avgDiff}</strong> above
          cheapest
        </span>
      </div>

      {/* Products by category */}
      {groupedByCategory.map(({ category, items }) => (
        <div key={category} className="mb-6">
          <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">
            {category}
          </h2>
          <table className="w-full text-sm mb-2">
            <tbody>
              {items.map(
                ({ product, storePrice, isCheapest, lowestPrice }) => {
                  if (!storePrice) return null;
                  const diff = storePrice.price - lowestPrice;
                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-[#eee] hover:bg-[#fafafa] ${
                        isCheapest ? "bg-[#f1f8e9]" : ""
                      }`}
                    >
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <ProductImage
                            src={product.image}
                            alt={product.name}
                            category={product.category}
                            size={32}
                          />
                          <div>
                            <Link
                              href={`/compare?product=${product.id}`}
                              className="text-[#1a5dab] font-medium"
                            >
                              {product.name}
                            </Link>
                            <span className="text-xs text-[#999] ml-1.5">
                              {product.unit}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-right font-semibold text-[#222] tabular-nums whitespace-nowrap">
                        KSh {storePrice.price}
                      </td>
                      <td className="py-2 text-right tabular-nums whitespace-nowrap text-sm">
                        {isCheapest ? (
                          <span className="text-[#2e7d32] font-medium">
                            Best price
                          </span>
                        ) : diff > 0 ? (
                          <span className="text-[#999]">+{diff}</span>
                        ) : null}
                        {storePrice.onSale && (
                          <span className="ml-1.5 text-[10px] font-bold text-[#c62828] uppercase">
                            sale
                          </span>
                        )}
                      </td>
                      <td className="py-2 pl-3 text-right">
                        {getQuantity(product.id) > 0 ? (
                          <div className="inline-flex items-center gap-0.5">
                            <button
                              onClick={() => updateQuantity(product.id, getQuantity(product.id) - 1)}
                              className="w-6 h-6 border border-[#ccc] rounded text-[#666] hover:bg-[#f0f0f0] cursor-pointer text-xs flex items-center justify-center"
                            >
                              &minus;
                            </button>
                            <span className="w-5 text-center text-xs tabular-nums font-medium text-[#222]">
                              {getQuantity(product.id)}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, getQuantity(product.id) + 1)}
                              className="w-6 h-6 border border-[#ccc] rounded text-[#666] hover:bg-[#f0f0f0] cursor-pointer text-xs flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem(product.id)}
                            className="text-xs text-[#1a5dab] hover:underline cursor-pointer"
                          >
                            + Add
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default function SupermarketPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-[#999]">
          Loading...
        </div>
      }
    >
      <SupermarketContent />
    </Suspense>
  );
}
