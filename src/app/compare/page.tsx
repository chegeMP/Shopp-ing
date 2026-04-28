"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  products,
  type Category,
  getLowestPrice,
  getHighestPrice,
  getSavings,
} from "@/data/products";
import { supermarkets } from "@/data/supermarkets";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PriceBar } from "@/components/PriceBar";
import { StoreBadge } from "@/components/StoreBadge";
import { ProductImage } from "@/components/ProductImage";
import { useBasket } from "@/components/BasketContext";

function CompareContent() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("product");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(
    preselected
  );
  const { addItem, getQuantity, updateQuantity } = useBasket();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !category || p.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  const active = selectedProduct
    ? products.find((p) => p.id === selectedProduct)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-[#222] mb-1">Compare Prices</h1>
      <p className="text-sm text-[#666] mb-5">
        Select a product to see how prices differ across supermarkets.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <div>
          <div className="flex flex-col gap-2 mb-3">
            <SearchBar value={search} onChange={setSearch} />
            <CategoryFilter selected={category} onSelect={setCategory} />
          </div>
          <div className="border border-[#ddd] rounded overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#eee]">
              {filtered.map((product) => {
                const lowest = getLowestPrice(product);
                const isSelected = selectedProduct === product.id;
                return (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product.id)}
                    className={`w-full text-left px-3 py-2.5 cursor-pointer flex items-center gap-2.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-[#e8f0fe] font-medium"
                        : "hover:bg-[#f5f5f5]"
                    }`}
                  >
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      category={product.category}
                      size={32}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[#222]">{product.name}</p>
                      <p className="text-xs text-[#999]">{product.unit}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#222] tabular-nums shrink-0">
                      {lowest.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {active ? (
            <div className="border border-[#ddd] rounded">
              {/* Header */}
              <div className="px-4 py-4 border-b border-[#eee] flex items-center gap-4">
                <ProductImage
                  src={active.image}
                  alt={active.name}
                  category={active.category}
                  size={64}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-[#222]">
                    {active.name}
                  </h2>
                  <p className="text-xs text-[#999]">
                    {active.unit} &middot; {active.category}
                  </p>
                </div>
                {getQuantity(active.id) > 0 ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(active.id, getQuantity(active.id) - 1)}
                      className="w-8 h-8 border border-[#ccc] rounded text-[#666] hover:bg-[#f0f0f0] cursor-pointer text-sm flex items-center justify-center"
                    >
                      &minus;
                    </button>
                    <span className="w-6 text-center text-sm tabular-nums font-semibold text-[#222]">
                      {getQuantity(active.id)}
                    </span>
                    <button
                      onClick={() => updateQuantity(active.id, getQuantity(active.id) + 1)}
                      className="w-8 h-8 border border-[#ccc] rounded text-[#666] hover:bg-[#f0f0f0] cursor-pointer text-sm flex items-center justify-center"
                    >
                      +
                    </button>
                    <span className="text-xs text-[#999] ml-1">in basket</span>
                  </div>
                ) : (
                  <button
                    onClick={() => addItem(active.id)}
                    className="text-sm text-white bg-[#1a5dab] hover:bg-[#155299] px-4 py-2 rounded cursor-pointer font-medium shrink-0"
                  >
                    + Add to basket
                  </button>
                )}
              </div>

              {/* Savings note */}
              {getSavings(active) > 0 && (
                <div className="px-4 py-2.5 bg-[#e8f5e9] border-b border-[#c8e6c9] text-sm text-[#2e7d32]">
                  You can save <strong>KSh {getSavings(active)}</strong> by
                  buying at{" "}
                  <strong>
                    {
                      supermarkets.find(
                        (s) =>
                          s.id === getLowestPrice(active).supermarketId
                      )?.name
                    }
                  </strong>{" "}
                  instead of{" "}
                  <strong>
                    {
                      supermarkets.find(
                        (s) =>
                          s.id === getHighestPrice(active).supermarketId
                      )?.name
                    }
                  </strong>
                  .
                </div>
              )}

              {/* Visual bars */}
              <div className="p-4 border-b border-[#eee]">
                <PriceBar product={active} />
              </div>

              {/* Detailed table */}
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ddd] text-xs text-[#888] uppercase tracking-wide">
                      <th className="text-left py-2 font-medium">
                        Supermarket
                      </th>
                      <th className="text-right py-2 font-medium">Price</th>
                      <th className="text-right py-2 font-medium">
                        Difference
                      </th>
                      <th className="text-right py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...active.prices]
                      .sort((a, b) => a.price - b.price)
                      .map((pp) => {
                        const store = supermarkets.find(
                          (s) => s.id === pp.supermarketId
                        )!;
                        const cheapest = getLowestPrice(active).price;
                        const diff = pp.price - cheapest;
                        return (
                          <tr
                            key={pp.supermarketId}
                            className="border-b border-[#f0f0f0]"
                          >
                            <td className="py-2">
                              <div className="flex items-center gap-1.5">
                                <StoreBadge store={store} />
                                <span className="text-[#333]">
                                  {store.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 text-right font-semibold text-[#222] tabular-nums">
                              KSh {pp.price}
                              {pp.onSale && pp.originalPrice && (
                                <span className="ml-1 text-xs text-[#999] line-through">
                                  {pp.originalPrice}
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right tabular-nums">
                              {diff === 0 ? (
                                <span className="text-[#2e7d32] font-medium">
                                  Cheapest
                                </span>
                              ) : (
                                <span className="text-[#c62828]">
                                  +{diff}
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right text-xs text-[#999]">
                              {pp.onSale ? (
                                <span className="text-[#c62828] font-semibold">
                                  On sale
                                </span>
                              ) : (
                                "Regular price"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border border-[#ddd] rounded flex flex-col items-center justify-center h-80 text-sm text-[#999]">
              <svg className="w-10 h-10 text-[#ddd] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              Select a product from the list to compare prices.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-[#999]">
          Loading...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
