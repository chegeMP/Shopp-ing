"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Product } from "@/data/products";
import type { Supermarket } from "@/data/supermarkets";
import {
  getLowestPrice,
  getHighestPrice,
  getSavings,
  categories,
} from "@/data/products";
import { useCatalog } from "@/components/CatalogContext";

interface Message {
  id: number;
  from: "user" | "msaidizi";
  text: string;
}

function generateReply(
  input: string,
  ctx: { products: Product[]; supermarkets: Supermarket[] }
): string {
  const { products, supermarkets } = ctx;
  const q = input.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|habari|mambo|sasa|niaje|sup)/.test(q)) {
    return "Habari! I'm Msaidizi, your shopping assistant. Ask me anything — cheapest prices, product comparisons, store info, or help finding a deal.";
  }

  // Thanks
  if (/^(thanks|thank you|asante|shukran)/.test(q)) {
    return "You're welcome! Let me know if you need anything else.";
  }

  // Help / what can you do
  if (/help|what can you do|how do you work|what do you know/.test(q)) {
    return `I can help you with:\n\n• Finding the cheapest price for any product\n• Comparing prices across supermarkets\n• Telling you which store is cheapest overall\n• Finding products on sale\n• Suggesting where to shop to save the most\n• Info about any of our ${supermarkets.length} tracked supermarkets\n\nJust ask naturally — e.g. "Where is milk cheapest?" or "What's on sale?"`;
  }

  // What supermarkets do you track
  if (/supermarkets|stores|which shops|what shops/.test(q)) {
    const list = supermarkets
      .map((s) => `${s.name} (${s.rating}/5)`)
      .join(", ");
    return `We track ${supermarkets.length} supermarkets: ${list}.`;
  }

  // What categories
  if (/categor|what products|what do you sell|what items/.test(q)) {
    return `We track products in ${categories.length} categories: ${categories.join(", ")}. ${products.length} products total.`;
  }

  // Products on sale
  if (/sale|offer|discount|promo|deals/.test(q)) {
    const onSale = products.filter((p) =>
      p.prices.some((pp) => pp.onSale)
    );
    if (onSale.length === 0) return "No products are currently on sale.";
    const lines = onSale.map((p) => {
      const salePrice = p.prices.find((pp) => pp.onSale)!;
      const store = supermarkets.find((s) => s.id === salePrice.supermarketId)!;
      return `• ${p.name} (${p.unit}) — KSh ${salePrice.price} at ${store.name}${salePrice.originalPrice ? ` (was ${salePrice.originalPrice})` : ""}`;
    });
    return `Products currently on sale:\n\n${lines.join("\n")}`;
  }

  // Cheapest store overall
  if (/cheapest (store|supermarket|shop)|best (store|supermarket|shop)|where should i shop/.test(q)) {
    const totals = supermarkets.map((store) => {
      const total = products.reduce((sum, p) => {
        const pp = p.prices.find((pr) => pr.supermarketId === store.id);
        return sum + (pp?.price ?? 0);
      }, 0);
      return { name: store.name, total };
    }).sort((a, b) => a.total - b.total);

    const savings = totals[totals.length - 1].total - totals[0].total;
    return `If you bought all ${products.length} products, here's what you'd pay:\n\n${totals.map((t, i) => `${i + 1}. ${t.name} — KSh ${t.total.toLocaleString()}`).join("\n")}\n\n${totals[0].name} is cheapest overall, saving you KSh ${savings.toLocaleString()} vs. ${totals[totals.length - 1].name}.`;
  }

  // Specific store info
  for (const store of supermarkets) {
    if (q.includes(store.name.toLowerCase())) {
      const cheapCount = products.filter(
        (p) => getLowestPrice(p).supermarketId === store.id
      ).length;
      const total = products.reduce((sum, p) => {
        const pp = p.prices.find((pr) => pr.supermarketId === store.id);
        return sum + (pp?.price ?? 0);
      }, 0);
      const saleCount = products.filter((p) =>
        p.prices.some((pp) => pp.supermarketId === store.id && pp.onSale)
      ).length;
      return `${store.name}:\n• Tagline: "${store.tagline}"\n• Rating: ${store.rating}/5\n• Has the lowest price on ${cheapCount} out of ${products.length} products\n• Total for all products: KSh ${total.toLocaleString()}\n• Currently ${saleCount} item${saleCount !== 1 ? "s" : ""} on sale`;
    }
  }

  // Search for a specific product by name
  const matchedProducts = products.filter((p) =>
    p.name.toLowerCase().split(/\s+/).some((word) => q.includes(word) && word.length > 2)
  );

  // If asking about price / cheapest for a product
  if (matchedProducts.length > 0 && /(price|cheap|cost|how much|where|best deal|compare)/.test(q)) {
    if (matchedProducts.length === 1) {
      const p = matchedProducts[0];
      const lowest = getLowestPrice(p);
      const highest = getHighestPrice(p);
      const savings = getSavings(p);
      const cheapStore = supermarkets.find((s) => s.id === lowest.supermarketId)!;
      const expStore = supermarkets.find((s) => s.id === highest.supermarketId)!;
      const allPrices = [...p.prices]
        .sort((a, b) => a.price - b.price)
        .map((pp) => {
          const s = supermarkets.find((st) => st.id === pp.supermarketId)!;
          return `  ${s.name}: KSh ${pp.price}${pp.onSale ? " (SALE)" : ""}`;
        })
        .join("\n");
      return `${p.name} (${p.unit}):\n\n${allPrices}\n\nCheapest at ${cheapStore.name} (KSh ${lowest.price}). You save KSh ${savings} vs. ${expStore.name}.`;
    }
    const lines = matchedProducts.slice(0, 5).map((p) => {
      const lowest = getLowestPrice(p);
      const store = supermarkets.find((s) => s.id === lowest.supermarketId)!;
      return `• ${p.name} (${p.unit}) — KSh ${lowest.price} at ${store.name}`;
    });
    return `I found ${matchedProducts.length} matching product${matchedProducts.length > 1 ? "s" : ""}:\n\n${lines.join("\n")}\n\nAsk about a specific one for a full breakdown.`;
  }

  // General product mention (no price question)
  if (matchedProducts.length > 0) {
    const p = matchedProducts[0];
    const lowest = getLowestPrice(p);
    const highest = getHighestPrice(p);
    const cheapStore = supermarkets.find((s) => s.id === lowest.supermarketId)!;
    return `${p.name} (${p.unit}) ranges from KSh ${lowest.price} (${cheapStore.name}) to KSh ${highest.price}. Want a full comparison across all stores?`;
  }

  // Category search
  const matchedCategory = categories.find((c) =>
    q.includes(c.toLowerCase())
  );
  if (matchedCategory) {
    const catProducts = products.filter((p) => p.category === matchedCategory);
    const lines = catProducts.map((p) => {
      const lowest = getLowestPrice(p);
      const store = supermarkets.find((s) => s.id === lowest.supermarketId)!;
      return `• ${p.name} (${p.unit}) — from KSh ${lowest.price} at ${store.name}`;
    });
    return `${matchedCategory} (${catProducts.length} products):\n\n${lines.join("\n")}`;
  }

  // Most expensive product
  if (/most expensive|priciest|costly/.test(q)) {
    const sorted = [...products].sort(
      (a, b) => getHighestPrice(b).price - getHighestPrice(a).price
    );
    const top = sorted.slice(0, 5);
    const lines = top.map((p) => {
      const h = getHighestPrice(p);
      const store = supermarkets.find((s) => s.id === h.supermarketId)!;
      return `• ${p.name} — KSh ${h.price} at ${store.name}`;
    });
    return `Most expensive products:\n\n${lines.join("\n")}`;
  }

  // Biggest savings
  if (/biggest saving|most saving|save the most|best saving/.test(q)) {
    const sorted = [...products].sort((a, b) => getSavings(b) - getSavings(a));
    const top = sorted.slice(0, 5);
    const lines = top.map((p) => {
      const s = getSavings(p);
      const cheapStore = supermarkets.find(
        (st) => st.id === getLowestPrice(p).supermarketId
      )!;
      return `• ${p.name} — save KSh ${s} (buy at ${cheapStore.name})`;
    });
    return `Products with the biggest price differences:\n\n${lines.join("\n")}`;
  }

  // How many products
  if (/how many products|total products|product count/.test(q)) {
    return `We track ${products.length} products across ${categories.length} categories and ${supermarkets.length} supermarkets.`;
  }

  // Fallback
  return `I'm not sure I understood that. Try asking things like:\n\n• "Where is rice cheapest?"\n• "What's on sale right now?"\n• "Tell me about Carrefour"\n• "Which store is cheapest overall?"\n• "Compare milk prices"\n• "Show me beverages"`;
}

export function Msaidizi() {
  const { products, supermarkets } = useCatalog();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "msaidizi",
      text: "Habari! I'm Msaidizi, your shopping assistant. Ask me about prices, products, or supermarkets.",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: nextId.current++, from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const reply = generateReply(text, { products, supermarkets });
      const botMsg: Message = {
        id: nextId.current++,
        from: "msaidizi",
        text: reply,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 300 + Math.random() * 400);
  }, [input, products, supermarkets]);

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-5 z-50 w-14 h-14 bg-gradient-to-br from-[#1a5dab] to-[#124a8f] text-white rounded-full shadow-lg shadow-[#1a5dab]/35 flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95 transition-all duration-200 ring-4 ring-white/30 dark:ring-[#121212]/80"
        title="Chat with Msaidizi"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed z-50 bg-white dark:bg-[#1e1f24] border border-[#e2e4e8] dark:border-[#35383d] rounded-2xl shadow-2xl shadow-black/15 dark:shadow-black/50 flex flex-col bottom-24 right-3 left-3 sm:left-auto sm:right-5 sm:w-[380px] max-h-[70vh] sm:max-h-[500px] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-[#eef0f3] dark:border-[#2e3238] bg-[#fafbfc] dark:bg-[#252628] flex items-center justify-between shrink-0">
            <div>
              <p className="text-sm font-bold text-[#1a1d21] dark:text-[#f4f4f5]">
                Msaidizi
              </p>
              <p className="text-[11px] text-[#8b939e] dark:text-[#9aa3af]">
                Shopping assistant
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-[#8b939e] hover:text-[#333] dark:hover:text-[#ececec] hover:bg-[#eef0f3] dark:hover:bg-[#363a42] cursor-pointer transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] text-sm px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                    msg.from === "user"
                      ? "bg-[#1a5dab] text-white rounded-br-md"
                      : "bg-[#f0f2f6] dark:bg-[#32353d] text-[#1a1d21] dark:text-[#ececec] rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#eef0f3] dark:border-[#2e3238] bg-[#fafbfc] dark:bg-[#252628] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Msaidizi anything..."
                className="flex-1 px-3 py-2.5 border border-[#d8dce2] dark:border-[#454a52] rounded-xl text-sm bg-white dark:bg-[#1e1f24] dark:text-[#ececec] placeholder:text-[#9aa3af] focus:outline-none focus:border-[#1a5dab] dark:focus:border-[#5b9bd5] focus:ring-2 focus:ring-[#1a5dab]/10 transition-shadow"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#1a5dab] text-white text-sm font-semibold rounded-xl hover:bg-[#155299] cursor-pointer transition-all shadow-md shadow-[#1a5dab]/20 active:scale-[0.98]"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
