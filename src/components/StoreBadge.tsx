"use client";

import type { Supermarket } from "@/data/supermarkets";

export function StoreBadge({ store }: { store: Supermarket }) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 text-[11px] font-semibold text-white rounded-sm"
      style={{ backgroundColor: store.color }}
    >
      {store.initial}
    </span>
  );
}
