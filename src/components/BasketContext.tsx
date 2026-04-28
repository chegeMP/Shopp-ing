"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useCatalog } from "@/components/CatalogContext";

export interface BasketItem {
  productId: string;
  quantity: number;
}

interface Toast {
  id: number;
  message: string;
}

interface BasketContextType {
  items: BasketItem[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearBasket: () => void;
  itemCount: number;
  selectedStore: string | null;
  setSelectedStore: (storeId: string | null) => void;
  getQuantity: (productId: string) => number;
}

const STORAGE_KEY = "pricesnap_basket";
const STORE_KEY = "pricesnap_store";

function loadBasket(): BasketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

function loadStore(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORE_KEY);
  } catch {}
  return null;
}

const BasketContext = createContext<BasketContextType | null>(null);

export function BasketProvider({ children }: { children: ReactNode }) {
  const catalog = useCatalog();
  const [items, setItems] = useState<BasketItem[]>([]);
  const [selectedStore, setSelectedStoreState] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadBasket());
    setSelectedStoreState(loadStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (selectedStore) {
        localStorage.setItem(STORE_KEY, selectedStore);
      } else {
        localStorage.removeItem(STORE_KEY);
      }
    } catch {}
  }, [selectedStore, hydrated]);

  const setSelectedStore = useCallback((storeId: string | null) => {
    setSelectedStoreState(storeId);
  }, []);

  const showToast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  const addItem = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...prev, { productId, quantity: 1 }];
      });
      const product = catalog.products.find((p) => p.id === productId);
      showToast(product ? `${product.name} added to basket` : "Added to basket");
    },
    [showToast, catalog.products]
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        )
      );
    },
    [removeItem]
  );

  const clearBasket = useCallback(() => {
    setItems([]);
    setSelectedStoreState(null);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const getQuantity = useCallback(
    (productId: string) => {
      return items.find((i) => i.productId === productId)?.quantity ?? 0;
    },
    [items]
  );

  return (
    <BasketContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearBasket,
        itemCount,
        selectedStore,
        setSelectedStore,
        getQuantity,
      }}
    >
      {children}

      {/* Toast notifications */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-[#333] text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fade-in pointer-events-auto"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const context = useContext(BasketContext);
  if (!context)
    throw new Error("useBasket must be used within BasketProvider");
  return context;
}
