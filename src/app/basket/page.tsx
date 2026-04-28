"use client";

import { useMemo } from "react";
import { useBasket } from "@/components/BasketContext";
import { StoreBadge } from "@/components/StoreBadge";
import { ProductImage } from "@/components/ProductImage";
import { getLowestPrice, getHighestPrice } from "@/data/products";
import Link from "next/link";
import { useCatalog } from "@/components/CatalogContext";

export default function BasketPage() {
  const { products, supermarkets } = useCatalog();
  const {
    items,
    removeItem,
    updateQuantity,
    clearBasket,
    selectedStore,
    setSelectedStore,
  } = useBasket();

  const basketProducts = useMemo(() => {
    return items
      .map((item) => ({
        ...item,
        product: products.find((p) => p.id === item.productId),
      }))
      .filter((item) => item.product !== undefined);
  }, [items, products]);

  const supermarketTotals = useMemo(() => {
    return supermarkets
      .map((store) => {
        const total = basketProducts.reduce((sum, item) => {
          const pp = item.product!.prices.find(
            (p) => p.supermarketId === store.id
          );
          return sum + (pp ? pp.price * item.quantity : 0);
        }, 0);
        return { store, total };
      })
      .sort((a, b) => a.total - b.total);
  }, [basketProducts]);

  const cheapestTotal = supermarketTotals[0]?.total ?? 0;
  const mostExpensiveTotal =
    supermarketTotals[supermarketTotals.length - 1]?.total ?? 0;

  const smartBasketTotal = useMemo(() => {
    return basketProducts.reduce((sum, item) => {
      const lowest = getLowestPrice(item.product!);
      return sum + lowest.price * item.quantity;
    }, 0);
  }, [basketProducts]);

  const chosenStoreTotal = useMemo(() => {
    if (!selectedStore) return null;
    return basketProducts.reduce((sum, item) => {
      const pp = item.product!.prices.find(
        (p) => p.supermarketId === selectedStore
      );
      return sum + (pp ? pp.price * item.quantity : 0);
    }, 0);
  }, [basketProducts, selectedStore]);

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <svg className="w-12 h-12 text-[#ddd] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        <h1 className="text-lg font-bold text-[#222] mb-1">
          Your basket is empty
        </h1>
        <p className="text-sm text-[#666] mb-4">
          Add products from the{" "}
          <Link href="/" className="text-[#1a5dab]">
            home page
          </Link>{" "}
          to see how much you&apos;d spend at each supermarket.
        </p>
      </div>
    );
  }

  const totalSavings = mostExpensiveTotal - cheapestTotal;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#222]">Your Basket</h1>
          <p className="text-sm text-[#666]">
            {items.length} item{items.length !== 1 && "s"} &mdash; compared
            across {supermarkets.length} supermarkets
          </p>
        </div>
        <button
          onClick={clearBasket}
          className="text-xs text-[#c62828] hover:underline cursor-pointer"
        >
          Clear basket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Items */}
        <div>
          <div className="space-y-0 divide-y divide-[#eee]">
            {basketProducts.map(({ product, quantity, productId }) => {
              if (!product) return null;
              const lowest = getLowestPrice(product);
              const highest = getHighestPrice(product);
              const storePrice = selectedStore
                ? product.prices.find(
                    (p) => p.supermarketId === selectedStore
                  )
                : null;
              const unitPrice = storePrice?.price ?? lowest.price;
              return (
                <div
                  key={productId}
                  className="flex items-center gap-3 py-3"
                >
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    category={product.category}
                    size={48}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#222] truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#999]">
                      {product.unit}
                      {" \u00B7 "}
                      {selectedStore
                        ? storePrice
                          ? `KSh ${storePrice.price}`
                          : "N/A"
                        : `${lowest.price} \u2013 ${highest.price}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateQuantity(productId, quantity - 1)
                      }
                      className="w-7 h-7 border border-[#ccc] rounded text-[#666] hover:bg-[#f0f0f0] cursor-pointer text-xs flex items-center justify-center"
                    >
                      &minus;
                    </button>
                    <span className="w-7 text-center text-sm tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(productId, quantity + 1)
                      }
                      className="w-7 h-7 border border-[#ccc] rounded text-[#666] hover:bg-[#f0f0f0] cursor-pointer text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right w-20 shrink-0">
                    <p className="text-sm font-semibold text-[#222] tabular-nums">
                      KSh {(unitPrice * quantity).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(productId)}
                    className="text-xs text-[#999] hover:text-[#c62828] cursor-pointer hover:underline shrink-0"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Choose your store */}
          <div className="border border-[#ddd] rounded">
            <div className="px-3 py-2 border-b border-[#eee] bg-[#f7f7f7]">
              <p className="text-xs font-semibold text-[#888] uppercase tracking-wide">
                Choose where to shop
              </p>
            </div>
            <div className="divide-y divide-[#f0f0f0]">
              {supermarketTotals.map(({ store, total }, i) => {
                const diff = total - cheapestTotal;
                const isSelected = selectedStore === store.id;
                return (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStore(store.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#e8f0fe] border-l-3 border-l-[#1a5dab]"
                        : i === 0 && !selectedStore
                          ? "bg-[#e8f5e9]"
                          : "hover:bg-[#fafafa]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <StoreBadge store={store} />
                      <span className="text-sm text-[#333] font-medium">
                        {store.name}
                      </span>
                      {i === 0 && (
                        <span className="text-[10px] font-bold text-[#2e7d32] uppercase">
                          cheapest
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-bold text-[#1a5dab] uppercase">
                          selected
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#222] tabular-nums">
                        KSh {total.toLocaleString()}
                      </span>
                      {diff > 0 && (
                        <span className="text-xs text-[#999] ml-1 tabular-nums">
                          (+{diff.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Order summary */}
          <div className="border border-[#ddd] rounded">
            <div className="px-3 py-2 border-b border-[#eee] bg-[#f7f7f7]">
              <p className="text-xs font-semibold text-[#888] uppercase tracking-wide">
                Order summary
              </p>
            </div>
            <div className="px-3 py-3 text-sm space-y-2">
              <div className="flex justify-between text-[#555]">
                <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                <span className="tabular-nums">
                  KSh{" "}
                  {(chosenStoreTotal ?? cheapestTotal).toLocaleString()}
                </span>
              </div>
              {selectedStore && chosenStoreTotal !== null && (
                <div className="flex justify-between text-[#555]">
                  <span>
                    vs. cheapest (
                    {supermarketTotals[0]?.store.name})
                  </span>
                  <span
                    className={`tabular-nums font-medium ${
                      chosenStoreTotal > cheapestTotal
                        ? "text-[#c62828]"
                        : "text-[#2e7d32]"
                    }`}
                  >
                    {chosenStoreTotal > cheapestTotal
                      ? `+KSh ${(chosenStoreTotal - cheapestTotal).toLocaleString()}`
                      : "Best price"}
                  </span>
                </div>
              )}
              <div className="border-t border-[#eee] pt-2 flex justify-between font-bold text-[#222]">
                <span>Total</span>
                <span className="tabular-nums">
                  KSh{" "}
                  {(chosenStoreTotal ?? cheapestTotal).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout button */}
          <Link
            href={
              selectedStore
                ? `/checkout?store=${selectedStore}`
                : `/checkout?store=${supermarketTotals[0]?.store.id}`
            }
            className="block w-full text-center py-3 bg-[#1a5dab] text-white font-semibold text-sm rounded hover:bg-[#155299] transition-colors no-underline hover:no-underline"
          >
            {selectedStore
              ? `Checkout at ${supermarkets.find((s) => s.id === selectedStore)?.name}`
              : `Checkout at ${supermarketTotals[0]?.store.name} (cheapest)`}
          </Link>
          <p className="text-[11px] text-[#999] text-center">
            {!selectedStore && "Select a store above, or we'll use the cheapest."}
          </p>

          {/* Savings summary */}
          <div className="border border-[#ddd] rounded">
            <div className="px-3 py-2 border-b border-[#eee] bg-[#f7f7f7]">
              <p className="text-xs font-semibold text-[#888] uppercase tracking-wide">
                Savings summary
              </p>
            </div>
            <div className="px-3 py-3 text-sm text-[#555] space-y-1.5">
              <div className="flex justify-between">
                <span>Best store vs. worst</span>
                <span className="font-semibold text-[#2e7d32] tabular-nums">
                  KSh {totalSavings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Optimal mix vs. worst</span>
                <span className="font-semibold text-[#2e7d32] tabular-nums">
                  KSh{" "}
                  {(mostExpensiveTotal - smartBasketTotal).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#eee] pt-1.5">
                <span>Annual savings (weekly)</span>
                <span className="font-bold text-[#222] tabular-nums">
                  KSh {(totalSavings * 52).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
