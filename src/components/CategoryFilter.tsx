"use client";

import { type Category, categories, products } from "@/data/products";
import { useMemo } from "react";

interface CategoryFilterProps {
  selected: Category | null;
  onSelect: (cat: Category | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of categories) {
      map[cat] = products.filter((p) => p.category === cat).length;
    }
    return map;
  }, []);

  return (
    <select
      value={selected ?? ""}
      onChange={(e) =>
        onSelect(e.target.value ? (e.target.value as Category) : null)
      }
      className="px-3 py-2 border border-[#ccc] rounded text-sm bg-white cursor-pointer focus:outline-none focus:border-[#4a90d9]"
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
