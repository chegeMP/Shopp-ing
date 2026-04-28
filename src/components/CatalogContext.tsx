"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import type { Product } from "@/data/products";
import type { Supermarket } from "@/data/supermarkets";

interface CatalogValue {
  products: Product[];
  supermarkets: Supermarket[];
}

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({
  products,
  supermarkets,
  children,
}: CatalogValue & { children: ReactNode }) {
  return (
    <CatalogContext.Provider value={{ products, supermarkets }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}
