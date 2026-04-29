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
    <div className="max-w-[1100px] mx-auto px-4 pb-12 pt-2">
      {/* Live stats strip */}
      <div className="mb-6 flex items-center gap-3 sm:gap-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/75 dark:bg-[#1c1d21]/75 backdrop-blur-md px-4 py-3.5 text-xs text-[#5c6370] dark:text-[#b8bdc6] shadow-md shadow-black/[0.04] overflow-x-auto">
        <span className="shrink-0 inline-flex items-center gap-1.5 font-semibold text-[#1a1d21] dark:text-[#ececec]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2e7d32] shadow-[0_0_0_2px_rgba(46,125,50,0.25)]" aria-hidden />
          Today&apos;s prices
        </span>
        <span className="shrink-0 text-[#c5cad3] dark:text-[#5c6068]">·</span>
        <span className="shrink-0">{totalProducts} products tracked</span>
        <span className="shrink-0 text-[#c5cad3] dark:text-[#5c6068]">·</span>
        <span className="shrink-0">{hotDeals.length} on sale</span>
        <span className="shrink-0 text-[#c5cad3] dark:text-[#5c6068]">·</span>
        {storeTotals.slice(0, 3).map(({ store }, i) => (
          <Link
            key={store.id}
            href={`/supermarket?id=${store.id}`}
            className="shrink-0 inline-flex items-center gap-1.5 no-underline hover:no-underline text-[#5c6370] dark:text-[#b8bdc6] hover:text-[#1a5dab] dark:hover:text-[#90caf9] transition-colors rounded-lg hover:bg-[#f0f4fa] dark:hover:bg-white/[0.05] px-1.5 -mx-1.5 py-0.5"
          >
            <StoreBadge store={store} />
            <span>{store.name}</span>
            {i === 0 && (
              <span className="text-[#2e7d32] dark:text-[#81c784] font-semibold text-[11px]">
                (best overall)
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Two-column top section: Deals + Top Savers */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 py-2">
        {/* On Sale — styled like a flyer */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-bold tracking-tight text-[#1a1d21] dark:text-[#ececec]">
              On Sale This Week
            </h2>
            <span className="text-xs font-medium text-[#8b939e] dark:text-[#9aa3af] tabular-nums bg-[#f4f5f7] dark:bg-[#2a2d33] px-2 py-0.5 rounded-full">
              {hotDeals.length} deals
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden bg-[#d8dce2] dark:bg-[#3d4249] ring-1 ring-black/[0.05] dark:ring-white/[0.06] shadow-lg shadow-black/[0.07] dark:shadow-black/40">
            {hotDeals.map((product) => {
              const lowest = getLowestPrice(product);
              const saleEntry = product.prices.find((p) => p.onSale);
              const savings = getSavings(product);
              return (
                <Link
                  key={product.id}
                  href={`/compare?product=${product.id}`}
                  className="bg-white dark:bg-[#252525] p-3 flex flex-col items-center text-center no-underline hover:no-underline hover:bg-[#fffef5] dark:hover:bg-[#2c2a22] active:scale-[0.99] transition-all duration-200 relative group"
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
            <h2 className="text-sm font-bold tracking-tight text-[#1a1d21] dark:text-[#ececec] mb-2">
              Biggest Price Gaps
            </h2>
            <p className="text-[11px] text-[#8b939e] dark:text-[#9aa3af] mb-3 leading-relaxed">
              Products where shopping around saves you the most.
            </p>
            <div className="rounded-2xl border border-[#e2e4e8] dark:border-[#35383d] bg-white/90 dark:bg-[#1c1d21]/90 backdrop-blur-sm shadow-md shadow-black/[0.04] overflow-hidden divide-y divide-[#eef0f3] dark:divide-[#2e3238]">
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
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-white/0 dark:bg-transparent hover:bg-[#f6f8fa] dark:hover:bg-[#26282e] no-underline hover:no-underline transition-colors"
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
            <h2 className="text-sm font-bold tracking-tight text-[#1a1d21] dark:text-[#ececec] mb-2">
              Store Rankings
            </h2>
            <p className="text-[11px] text-[#8b939e] dark:text-[#9aa3af] mb-3 leading-relaxed">
              Total cost for all {totalProducts} products.
            </p>
            <div className="rounded-2xl border border-[#e2e4e8] dark:border-[#35383d] bg-white/90 dark:bg-[#1c1d21]/90 backdrop-blur-sm shadow-md shadow-black/[0.04] overflow-hidden divide-y divide-[#eef0f3] dark:divide-[#2e3238]">
              {storeTotals.map(({ store, total }, i) => {
                const diff = total - storeTotals[0].total;
                return (
                  <Link
                    key={store.id}
                    href={`/supermarket?id=${store.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2.5 no-underline hover:no-underline transition-colors ${
                      i === 0
                        ? "bg-[#eef7e8] hover:bg-[#e5f0de] dark:bg-[#1a2e1c] dark:hover:bg-[#1f3a24]"
                        : "hover:bg-[#f6f8fa] dark:hover:bg-[#26282e]"
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

      {/* Category filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-5 -mx-1 px-1 scroll-smooth [scrollbar-width:thin]">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-full cursor-pointer transition-all duration-200 ${
            !category
              ? "bg-[#1a5dab] text-white shadow-md shadow-[#1a5dab]/30"
              : "bg-white/90 dark:bg-white/[0.06] text-[#5c6370] dark:text-[#b8bdc6] border border-[#e2e4e8] dark:border-[#3d4249] hover:border-[#1a5dab]/35 dark:hover:border-[#5b9bd5]/40 shadow-sm"
          }`}
        >
          All {totalProducts}
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setCategory(category === cat ? null : cat)}
            className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-full cursor-pointer whitespace-nowrap transition-all duration-200 ${
              category === cat
                ? "bg-[#1a5dab] text-white shadow-md shadow-[#1a5dab]/30"
                : "bg-white/90 dark:bg-white/[0.06] text-[#5c6370] dark:text-[#b8bdc6] border border-[#e2e4e8] dark:border-[#3d4249] hover:border-[#1a5dab]/35 dark:hover:border-[#5b9bd5]/40 shadow-sm"
            }`}
          >
            {cat} {categoryCounts[cat]}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="sm:min-w-[200px] px-3.5 py-2.5 border border-[#d8dce2] dark:border-[#555] rounded-xl text-sm bg-white dark:bg-[#252525] dark:text-[#ececec] cursor-pointer shadow-sm focus:outline-none focus:border-[#1a5dab] dark:focus:border-[#5b9bd5] focus:ring-2 focus:ring-[#1a5dab]/10 dark:focus:ring-[#5b9bd5]/15 transition-shadow"
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
            type="button"
            onClick={() => {
              setSearch("");
              setCategory(null);
            }}
            className="text-xs font-semibold text-[#b71c1c] dark:text-[#ff8a80] hover:underline cursor-pointer rounded-lg px-2 py-1 hover:bg-[#ffebee]/80 dark:hover:bg-[#3d1f22]/50 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-[#d8dce2] dark:border-[#404040] bg-white/50 dark:bg-[#1c1d21]/50">
          <p className="text-sm text-[#8b939e] dark:text-[#9aa3af] mb-3">
            No products match your filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory(null);
            }}
            className="text-sm font-semibold text-[#1a5dab] dark:text-[#90caf9] hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-[#e2e4e8] dark:border-[#35383d] bg-white dark:bg-[#1a1b1f] shadow-lg shadow-black/[0.06] dark:shadow-black/30">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#eef0f3] dark:border-[#2e3238] text-[11px] text-[#8b939e] dark:text-[#9aa3af] uppercase tracking-wider bg-[#fafbfc] dark:bg-[#22252b]">
                    <th className="py-3 pl-4 text-left font-semibold">Product</th>
                    {supermarkets.map((store) => (
                    <th key={store.id} className="py-3 text-right font-semibold px-1">
                      <Link
                        href={`/supermarket?id=${store.id}`}
                        className="inline-flex items-center gap-1 text-[#8b939e] dark:text-[#9aa3af] hover:text-[#1a5dab] dark:hover:text-[#90caf9] no-underline hover:no-underline transition-colors"
                      >
                        <StoreBadge store={store} />
                        <span className="hidden lg:inline">{store.name}</span>
                      </Link>
                    </th>
                  ))}
                  <th className="py-3 pl-2 pr-4 text-right font-semibold w-24"></th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </tbody>
            </table>
            </div>
            <p className="text-[11px] text-[#8b939e] dark:text-[#888] px-4 pb-4 pt-1 border-t border-[#eef0f3] dark:border-[#2e3238] bg-[#fafbfc] dark:bg-[#22252b]">
              * = on sale &middot; All prices in KSh &middot; Prices may vary by branch
            </p>
          </div>

          {/* Mobile: cards with images */}
          <div className="md:hidden overflow-hidden rounded-2xl border border-[#e2e4e8] dark:border-[#35383d] bg-white dark:bg-[#1a1b1f] shadow-lg shadow-black/[0.06] dark:shadow-black/30 divide-y divide-[#eef0f3] dark:divide-[#2e3238]">
            {filtered.map((product) => {
              const lowest = getLowestPrice(product);
              const qty = getQuantity(product.id);
              return (
                <div key={product.id} className="py-4 px-3">
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
                              type="button"
                              onClick={() => updateQuantity(product.id, qty - 1)}
                            className="w-8 h-8 border border-[#e2e4e8] dark:border-[#454a52] rounded-lg text-[#5c6370] dark:text-[#bdbdbd] hover:bg-[#f6f8fa] dark:hover:bg-[#2a2d33] cursor-pointer text-xs flex items-center justify-center transition-colors"
                            >
                              &minus;
                            </button>
                            <span className="w-5 text-center text-xs tabular-nums font-medium text-[#222] dark:text-[#ececec]">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, qty + 1)}
                            className="w-8 h-8 border border-[#e2e4e8] dark:border-[#454a52] rounded-lg text-[#5c6370] dark:text-[#bdbdbd] hover:bg-[#f6f8fa] dark:hover:bg-[#2a2d33] cursor-pointer text-xs flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addItem(product.id)}
                            className="text-xs text-[#1a5dab] dark:text-[#90caf9] border border-[#1a5dab]/30 dark:border-[#5b9bd5]/35 bg-[#f7faff] dark:bg-[#1e3550]/40 hover:bg-[#e8f0fe] dark:hover:bg-[#1e3550] px-3 py-2 rounded-lg cursor-pointer shrink-0 font-semibold transition-colors shadow-sm"
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
                          className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg transition-colors ${
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
