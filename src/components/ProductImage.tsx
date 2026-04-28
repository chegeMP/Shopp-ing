"use client";

import { useState } from "react";

const categoryColors: Record<string, string> = {
  "Cereals & Grains": "#f59e0b",
  "Cooking Oil": "#84cc16",
  Dairy: "#3b82f6",
  Beverages: "#8b5cf6",
  Snacks: "#f97316",
  "Personal Care": "#ec4899",
  Cleaning: "#06b6d4",
  "Fresh Produce": "#22c55e",
  "Meat & Poultry": "#ef4444",
  Bakery: "#d97706",
  Alcohol: "#7c3aed",
};

export function ProductImage({
  src,
  alt,
  category,
  size = 40,
}: {
  src: string;
  alt: string;
  category: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const color = categoryColors[category] ?? "#6b7280";
  const initials = alt
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (failed || !src) {
    return (
      <div
        className="rounded flex items-center justify-center text-white font-bold shrink-0"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          fontSize: size * 0.3,
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded object-cover shrink-0 bg-[#f5f5f5]"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
