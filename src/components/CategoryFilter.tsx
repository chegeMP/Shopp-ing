"use client";

import { type Category, categories } from "@/data/products";
import { useMemo } from "react";

import { useCatalog } from "@/components/CatalogContext";

interface CategoryFilterProps {
  selected: Category | null;
  onSelect: (cat: Category | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const { products } = useCatalog();

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of categories) {
      map[cat] = products.filter((p) => p.category === cat).length;
    }
    return map;
  }, [products]);

  return (
    <select
      value={selected ?? ""}
      onChange={(e) =>
        onSelect(e.target.value ? (e.target.value as Category) : null)
      }
      className="w-full px-3.5 py-2.5 border border-[#d8dce2] dark:border-[#505860] rounded-xl text-sm bg-white dark:bg-[#252525] dark:text-[#ececec] shadow-sm cursor-pointer focus:outline-none focus:border-[#1a5dab] dark:focus:border-[#5b9bd5] focus:ring-2 focus:ring-[#1a5dab]/10 dark:focus:ring-[#5b9bd5]/15 transition-shadow"
    >
      <option value="">All categories ({products.length})</option>
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat} ({counts[cat]})
        </option>
      ))}
    </select>
  );
}
