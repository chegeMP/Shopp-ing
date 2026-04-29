"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  type Category,
  getLowestPrice,
  getHighestPrice,
  getSavings,
} from "@/data/products";
import { useCatalog } from "@/components/CatalogContext";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PriceBar } from "@/components/PriceBar";
import { StoreBadge } from "@/components/StoreBadge";
import { ProductImage } from "@/components/ProductImage";
import { useBasket } from "@/components/BasketContext";

function CompareContent() {
  const { products, supermarkets } = useCatalog();
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
  }, [search, category, products]);

  const active = selectedProduct
    ? products.find((p) => p.id === selectedProduct)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-[#1a1d21] dark:text-[#f4f4f5] mb-1">
        Compare Prices
      </h1>
      <p className="text-sm text-[#5c6370] dark:text-[#b8bdc6] mb-8 max-w-lg leading-relaxed">
        Select a product to see how prices differ across supermarkets.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 lg:gap-8">
        {/* Sidebar */}
        <div>
          <div className="flex flex-col gap-3 mb-3">
            <SearchBar value={search} onChange={setSearch} />
            <CategoryFilter selected={category} onSelect={setCategory} />
          </div>
          <div className="rounded-2xl border border-[#e2e4e8] dark:border-[#35383d] bg-white dark:bg-[#1a1b1f] shadow-lg shadow-black/[0.05] dark:shadow-black/30 overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#eef0f3] dark:divide-[#2e3238]">
              {filtered.map((product) => {
                const lowest = getLowestPrice(product);
                const isSelected = selectedProduct === product.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProduct(product.id)}
                    className={`w-full text-left px-3 py-3 cursor-pointer flex items-center gap-2.5 text-sm transition-all duration-150 ${
                      isSelected
                        ? "bg-[#e8f0fe] dark:bg-[#1e3550] font-semibold ring-inset ring-1 ring-[#1a5dab]/15 dark:ring-[#5b9bd5]/25"
                        : "hover:bg-[#f6f8fa] dark:hover:bg-[#252628]"
                    }`}
                  >
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      category={product.category}
                      size={32}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[#1a1d21] dark:text-[#ececec]">
                        {product.name}
                      </p>
                      <p className="text-xs text-[#8b939e] dark:text-[#9aa3af]">
                        {product.unit}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#1a1d21] dark:text-[#ececec] tabular-nums shrink-0">
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
            <div className="rounded-2xl border border-[#e2e4e8] dark:border-[#35383d] bg-white dark:bg-[#1a1b1f] shadow-lg shadow-black/[0.06] dark:shadow-black/30 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-5 border-b border-[#eef0f3] dark:border-[#2e3238] flex items-center gap-4 bg-[#fafbfc] dark:bg-[#22252b]/50">
                <ProductImage
                  src={active.image}
                  alt={active.name}
                  category={active.category}
                  size={64}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-[#1a1d21] dark:text-[#f4f4f5] tracking-tight">
                    {active.name}
                  </h2>
                  <p className="text-xs text-[#8b939e] dark:text-[#9aa3af] mt-0.5">
                    {active.unit} &middot; {active.category}
                  </p>
                </div>
                {getQuantity(active.id) > 0 ? (
                  <div className="flex items-center gap-1.5 shrink-0 rounded-lg border border-[#e2e4e8] dark:border-[#454a52] p-0.5 bg-white dark:bg-[#252628]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(active.id, getQuantity(active.id) - 1)}
                      className="w-8 h-8 rounded-md border-0 text-[#5c6370] dark:text-[#ccc] hover:bg-[#f0f2f5] dark:hover:bg-[#363a42] cursor-pointer text-sm flex items-center justify-center transition-colors"
                    >
                      &minus;
                    </button>
                    <span className="w-6 text-center text-sm tabular-nums font-bold text-[#1a1d21] dark:text-[#ececec]">
                      {getQuantity(active.id)}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(active.id, getQuantity(active.id) + 1)}
                      className="w-8 h-8 rounded-md border-0 text-[#5c6370] dark:text-[#ccc] hover:bg-[#f0f2f5] dark:hover:bg-[#363a42] cursor-pointer text-sm flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                    <span className="text-[11px] text-[#8b939e] dark:text-[#9aa3af] ml-1 pr-2">
                      in basket
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addItem(active.id)}
                    className="text-sm text-white bg-[#1a5dab] hover:bg-[#155299] px-4 py-2.5 rounded-xl cursor-pointer font-semibold shrink-0 shadow-md shadow-[#1a5dab]/25 active:scale-[0.98] transition-all"
                  >
                    + Add to basket
                  </button>
                )}
              </div>

              {/* Savings note */}
              {getSavings(active) > 0 && (
                <div className="px-5 py-3 bg-[#e8f5e9] dark:bg-[#1a2e1c] border-b border-[#c8e6c9] dark:border-[#2d4a32] text-sm text-[#2e7d32] dark:text-[#a5d6a7] leading-relaxed">
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
              <div className="p-5 border-b border-[#eef0f3] dark:border-[#2e3238]">
                <PriceBar product={active} />
              </div>

              {/* Detailed table */}
              <div className="p-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#eef0f3] dark:border-[#2e3238] text-[11px] text-[#8b939e] dark:text-[#9aa3af] uppercase tracking-wider">
                      <th className="text-left py-2.5 font-semibold">
                        Supermarket
                      </th>
                      <th className="text-right py-2.5 font-semibold">Price</th>
                      <th className="text-right py-2.5 font-semibold">
                        Difference
                      </th>
                      <th className="text-right py-2.5 font-semibold">Notes</th>
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
                            className="border-b border-[#f0f2f5] dark:border-[#2a2d33] last:border-0"
                          >
                            <td className="py-2.5">
                              <div className="flex items-center gap-1.5">
                                <StoreBadge store={store} />
                                <span className="text-[#333] dark:text-[#e2e4e8]">
                                  {store.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right font-semibold text-[#1a1d21] dark:text-[#ececec] tabular-nums">
                              KSh {pp.price}
                              {pp.onSale && pp.originalPrice && (
                                <span className="ml-1 text-xs text-[#8b939e] line-through">
                                  {pp.originalPrice}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right tabular-nums">
                              {diff === 0 ? (
                                <span className="text-[#2e7d32] dark:text-[#81c784] font-semibold">
                                  Cheapest
                                </span>
                              ) : (
                                <span className="text-[#c62828] dark:text-[#ff8a80] font-medium">
                                  +{diff}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right text-xs text-[#8b939e] dark:text-[#9aa3af]">
                              {pp.onSale ? (
                                <span className="text-[#c62828] dark:text-[#ff8a80] font-semibold">
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
            <div className="rounded-2xl border border-dashed border-[#d8dce2] dark:border-[#404040] bg-white/60 dark:bg-[#1a1b1f]/50 flex flex-col items-center justify-center min-h-[320px] px-6 text-sm text-[#8b939e] dark:text-[#9aa3af]">
              <svg
                className="w-12 h-12 text-[#d8dce2] dark:text-[#454a52] mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.25}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
              <p className="text-center max-w-[220px] leading-relaxed">
                Select a product from the list to compare prices.
              </p>
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
        <div className="max-w-5xl mx-auto px-4 py-12 text-sm text-[#8b939e] dark:text-[#9aa3af]">
          Loading...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
