"use client";

import { useState, useMemo } from "react";
import {
  type Category,
  categories,
  getSavings,
  getLowestPrice,
  getHighestPrice,
} from "@/data/products";
import { useCatalog } from "@/components/CatalogContext";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { StoreBadge } from "@/components/StoreBadge";
import { ProductImage } from "@/components/ProductImage";
import { useBasket } from "@/components/BasketContext";
import Link from "next/link";

type SortKey = "name" | "price" | "savings";

export default function HomePage() {
  const { products, supermarkets } = useCatalog();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const { addItem, getQuantity, updateQuantity } = useBasket();

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !category || p.category === category;
      return matchSearch && matchCat;
    });

    return list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price")
        return getLowestPrice(a).price - getLowestPrice(b).price;
      return getSavings(b) - getSavings(a);
    });
  }, [search, category, sortBy, products]);

  const totalProducts = products.length;

  const hotDeals = useMemo(
    () => products.filter((p) => p.prices.some((pp) => pp.onSale)).slice(0, 8),
    [products]
  );

  const topSavers = useMemo(
    () => [...products].sort((a, b) => getSavings(b) - getSavings(a)).slice(0, 4),
    [products]
  );

  const storeTotals = useMemo(() => {
    return supermarkets
      .map((store) => {
        const total = products.reduce((sum, p) => {
          const pp = p.prices.find((x) => x.supermarketId === store.id);
          return sum + (pp?.price ?? 0);
        }, 0);
        return { store, total };
      })
      .sort((a, b) => a.total - b.total);
  }, [products, supermarkets]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of categories) {
      map[cat] = products.filter((p) => p.category === cat).length;
    }
    return map;
  }, [products]);

  return (
    <div className="max-w-[1100px] mx-auto px-4">
      {/* Ticker bar */}
      <div className="flex items-center gap-4 py-2.5 border-b border-[#e0e0e0] dark:border-[#404040] text-xs text-[#555] dark:text-[#bdbdbd] overflow-x-auto">
        <span className="shrink-0 font-semibold text-[#222] dark:text-[#ececec]">
          Today&apos;s prices
        </span>
        <span className="text-[#bbb] dark:text-[#666]">|</span>
        <span className="shrink-0">
          {totalProducts} products tracked
        </span>
        <span className="text-[#bbb] dark:text-[#666]">|</span>
        <span className="shrink-0">
          {hotDeals.length} on sale now
        </span>
        <span className="text-[#bbb] dark:text-[#666]">|</span>
        {storeTotals.slice(0, 3).map(({ store }, i) => (
          <Link
            key={store.id}
            href={`/supermarket?id=${store.id}`}
            className="shrink-0 flex items-center gap-1 no-underline hover:no-underline text-[#555] dark:text-[#bdbdbd] hover:text-[#222] dark:hover:text-[#fff]"
          >
            <StoreBadge store={store} />
            <span>{store.name}</span>
            {i === 0 && (
              <span className="text-[#2e7d32] dark:text-[#81c784] font-semibold">(cheapest overall)</span>
            )}
          </Link>
        ))}
      </div>

      {/* Two-column top section: Deals + Top Savers */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 py-5">
        {/* On Sale — styled like a flyer */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-bold text-[#222] dark:text-[#ececec]">
              On Sale This Week
            </h2>
            <span className="text-xs text-[#999] dark:text-[#888]">{hotDeals.length} deals</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e5e5e5] dark:bg-[#404040] border border-[#e5e5e5] dark:border-[#404040]">
            {hotDeals.map((product) => {
              const lowest = getLowestPrice(product);
              const saleEntry = product.prices.find((p) => p.onSale);
              const savings = getSavings(product);
              return (
                <Link
                  key={product.id}
                  href={`/compare?product=${product.id}`}
                  className="bg-white dark:bg-[#252525] p-3 flex flex-col items-center text-center no-underline hover:no-underline hover:bg-[#fffde7] dark:hover:bg-[#343018] transition-colors relative group"
                >
                  {saleEntry?.originalPrice && (
                    <span className="absolute top-1.5 right-1.5 bg-[#d32f2f] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase leading-none">
                      Sale
                    </span>
                  )}
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    category={product.category}
                    size={52}
                  />
                  <p className="text-[11px] font-medium text-[#333] dark:text-[#ddd] mt-2 leading-tight line-clamp-2 group-hover:text-[#b71c1c] dark:group-hover:text-[#ff8a80]">
                    {product.name}
                  </p>
                  <p className="text-[10px] text-[#999] dark:text-[#888] mb-1">{product.unit}</p>
                  <p className="text-base font-extrabold text-[#b71c1c] tabular-nums">
                    KSh {lowest.price}
                  </p>
                  {saleEntry?.originalPrice && (
                    <p className="text-[10px] text-[#999] dark:text-[#888] line-through tabular-nums">
                      was {saleEntry.originalPrice}
                    </p>
                  )}
                  {savings > 0 && (
                    <p className="text-[10px] font-bold text-[#2e7d32] mt-0.5">
                      You save KSh {savings}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Top savers + store ranking */}
        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-bold text-[#222] dark:text-[#ececec] mb-2">
              Biggest Price Gaps
            </h2>
            <p className="text-[11px] text-[#888] dark:text-[#9a9a9a] mb-3">
              Products where shopping around saves you the most.
            </p>
            <div className="border border-[#e0e0e0] dark:border-[#404040] divide-y divide-[#eee] dark:divide-[#383838]">
              {topSavers.map((product) => {
                const lowest = getLowestPrice(product);
                const highest = getHighestPrice(product);
                const savings = getSavings(product);
                const cheapStore = supermarkets.find(
                  (s) => s.id === lowest.supermarketId
                )!;
                const expStore = supermarkets.find(
                  (s) => s.id === highest.supermarketId
                )!;
                return (
                  <Link
                    key={product.id}
                    href={`/compare?product=${product.id}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-[#252525] hover:bg-[#f9f9f9] dark:hover:bg-[#2f2f2f] no-underline hover:no-underline transition-colors"
                  >
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      category={product.category}
                      size={36}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#222] dark:text-[#ececec] truncate">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-[#888] dark:text-[#9a9a9a]">
                        <span className="text-[#2e7d32] font-semibold">
                          {cheapStore.name} {lowest.price}
                        </span>
                        {" vs "}
                        <span className="text-[#999]">
                          {expStore.name} {highest.price}
                        </span>
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#b71c1c] tabular-nums shrink-0">
                      &minus;{savings}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-[#222] dark:text-[#ececec] mb-2">
              Store Rankings
            </h2>
            <p className="text-[11px] text-[#888] dark:text-[#9a9a9a] mb-3">
              Total cost for all {totalProducts} products.
            </p>
            <div className="border border-[#e0e0e0] dark:border-[#404040] divide-y divide-[#eee] dark:divide-[#383838]">
              {storeTotals.map(({ store, total }, i) => {
                const diff = total - storeTotals[0].total;
                return (
                  <Link
                    key={store.id}
                    href={`/supermarket?id=${store.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 no-underline hover:no-underline transition-colors ${
                      i === 0
                        ? "bg-[#f1f8e9] hover:bg-[#e8f5e9] dark:bg-[#1e2a1a] dark:hover:bg-[#243320]"
                        : "bg-white hover:bg-[#f9f9f9] dark:bg-[#252525] dark:hover:bg-[#2f2f2f]"
                    }`}
                  >
                    <span className="text-xs font-bold text-[#888] dark:text-[#9a9a9a] w-4 text-right tabular-nums">
                      {i + 1}
                    </span>
                    <StoreBadge store={store} />
                    <span className="text-sm text-[#222] dark:text-[#ececec] font-medium flex-1">
                      {store.name}
                    </span>
                    <span className="text-sm font-semibold text-[#222] dark:text-[#ececec] tabular-nums">
                      KSh {total.toLocaleString()}
                    </span>
                    {diff > 0 && (
                      <span className="text-[10px] text-[#999] dark:text-[#888] tabular-nums">
                        +{diff.toLocaleString()}
                      </span>
                    )}
                    {i === 0 && (
                      <span className="text-[9px] font-bold text-[#2e7d32] uppercase">
                        best
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#ddd] dark:border-[#404040] mb-4" />

      {/* Category tabs — horizontal scroll */}
      <div className="flex items-center gap-0 overflow-x-auto mb-4 -mx-4 px-4 pb-1">
        <button
          onClick={() => setCategory(null)}
          className={`shrink-0 px-3 py-1.5 text-xs font-medium cursor-pointer border-b-2 transition-colors ${
            !category
              ? "border-[#222] text-[#222] dark:border-[#ececec] dark:text-[#ececec]"
              : "border-transparent text-[#888] hover:text-[#555] dark:text-[#9a9a9a] dark:hover:text-[#ccc]"
          }`}
        >
          All {totalProducts}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? null : cat)}
            className={`shrink-0 px-3 py-1.5 text-xs font-medium cursor-pointer border-b-2 transition-colors whitespace-nowrap ${
              category === cat
                ? "border-[#222] text-[#222] dark:border-[#ececec] dark:text-[#ececec]"
                : "border-transparent text-[#888] hover:text-[#555] dark:text-[#9a9a9a] dark:hover:text-[#ccc]"
            }`}
          >
            {cat} {categoryCounts[cat]}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="px-3 py-2 border border-[#ccc] dark:border-[#555] rounded text-sm bg-white dark:bg-[#252525] dark:text-[#ececec] cursor-pointer focus:outline-none focus:border-[#999] dark:focus:border-[#777]"
        >
          <option value="name">Sort: A-Z</option>
          <option value="price">Sort: Cheapest first</option>
          <option value="savings">Sort: Most savings</option>
        </select>
      </div>

      {/* Result count */}
      {(search || category) && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#888] dark:text-[#9a9a9a]">
            {filtered.length} of {totalProducts} products
            {category && <> in <strong>{category}</strong></>}
            {search && <> matching &ldquo;{search}&rdquo;</>}
          </p>
          <button
            onClick={() => { setSearch(""); setCategory(null); }}
            className="text-xs text-[#b71c1c] dark:text-[#ff8a80] hover:underline cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-[#999] dark:text-[#9a9a9a] mb-2">No products match your filters.</p>
          <button
            onClick={() => { setSearch(""); setCategory(null); }}
            className="text-sm text-[#b71c1c] dark:text-[#ff8a80] hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#ddd] dark:border-[#404040] text-xs text-[#888] dark:text-[#9a9a9a] uppercase tracking-wide">
                  <th className="py-2 text-left font-medium">Product</th>
                  {supermarkets.map((store) => (
                    <th key={store.id} className="py-2 text-right font-medium px-1">
                      <Link
                        href={`/supermarket?id=${store.id}`}
                        className="inline-flex items-center gap-1 text-[#888] hover:text-[#333] dark:hover:text-[#ececec] no-underline hover:no-underline"
                      >
                        <StoreBadge store={store} />
                        <span className="hidden lg:inline">{store.name}</span>
                      </Link>
                    </th>
                  ))}
                  <th className="py-2 pl-2 text-right font-medium w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-[#999] dark:text-[#888] mt-2">
              * = on sale &middot; All prices in KSh &middot; Prices may vary by branch
            </p>
          </div>

          {/* Mobile: cards with images */}
          <div className="md:hidden divide-y divide-[#eee] dark:divide-[#383838]">
            {filtered.map((product) => {
              const lowest = getLowestPrice(product);
              const qty = getQuantity(product.id);
              return (
                <div key={product.id} className="py-3">
                  <div className="flex items-start gap-3 mb-2">
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      category={product.category}
                      size={48}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/compare?product=${product.id}`}
                            className="text-sm font-medium text-[#333] dark:text-[#ececec] hover:text-[#b71c1c] dark:hover:text-[#ff8a80]"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-[#999] dark:text-[#888]">{product.unit}</p>
                        </div>
                        {qty > 0 ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => updateQuantity(product.id, qty - 1)}
                            className="w-7 h-7 border border-[#ccc] dark:border-[#555] rounded text-[#666] dark:text-[#bdbdbd] hover:bg-[#f0f0f0] dark:hover:bg-[#3a3a3a] cursor-pointer text-xs flex items-center justify-center"
                            >
                              &minus;
                            </button>
                            <span className="w-5 text-center text-xs tabular-nums font-medium text-[#222] dark:text-[#ececec]">
                              {qty}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, qty + 1)}
                            className="w-7 h-7 border border-[#ccc] dark:border-[#555] rounded text-[#666] dark:text-[#bdbdbd] hover:bg-[#f0f0f0] dark:hover:bg-[#3a3a3a] cursor-pointer text-xs flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem(product.id)}
                            className="text-xs text-[#333] dark:text-[#ececec] border border-[#ccc] dark:border-[#555] hover:border-[#999] dark:hover:border-[#777] bg-white dark:bg-[#252525] hover:bg-[#f5f5f5] dark:hover:bg-[#323232] px-3 py-1.5 rounded cursor-pointer shrink-0 font-medium transition-colors"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-[60px]">
                    {supermarkets.map((store) => {
                      const pp = product.prices.find(
                        (p) => p.supermarketId === store.id
                      );
                      const isCheapest = pp?.price === lowest.price;
                      return (
                        <div
                          key={store.id}
                          className={`flex items-center justify-between text-sm py-0.5 px-1.5 rounded ${
                            isCheapest ? "bg-[#f1f8e9] dark:bg-[#1e2a1a]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <StoreBadge store={store} />
                            <span className="text-xs text-[#555] dark:text-[#bdbdbd]">
                              {store.name}
                            </span>
                          </div>
                          <span
                            className={`tabular-nums text-xs ${
                              isCheapest
                                ? "font-bold text-[#2e7d32] dark:text-[#81c784]"
                                : "text-[#333] dark:text-[#ececec]"
                            }`}
                          >
                            {pp ? pp.price : "\u2013"}
                            {pp?.onSale && (
                              <span className="text-[#c62828] dark:text-[#ff8a80] ml-0.5">*</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="h-8" />
    </div>
  );
}
