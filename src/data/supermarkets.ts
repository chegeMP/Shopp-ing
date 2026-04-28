export interface Supermarket {
  id: string;
  name: string;
  initial: string;
  color: string;
  bgLight: string;
  tagline: string;
  rating: number;
}

export const supermarkets: Supermarket[] = [
  {
    id: "naivas",
    name: "Naivas",
    initial: "N",
    color: "#16a34a",
    bgLight: "#f0fdf4",
    tagline: "You deserve the best",
    rating: 4.2,
  },
  {
    id: "quickmart",
    name: "QuickMart",
    initial: "Q",
    color: "#2563eb",
    bgLight: "#eff6ff",
    tagline: "Quick, convenient & affordable",
    rating: 4.0,
  },
  {
    id: "carrefour",
    name: "Carrefour",
    initial: "C",
    color: "#dc2626",
    bgLight: "#fef2f2",
    tagline: "Low prices every day",
    rating: 4.3,
  },
  {
    id: "cleanshelf",
    name: "Cleanshelf",
    initial: "Cl",
    color: "#ca8a04",
    bgLight: "#fefce8",
    tagline: "Clean deals, every day",
    rating: 3.8,
  },
  {
    id: "chandarana",
    name: "Chandarana",
    initial: "Ch",
    color: "#ea580c",
    bgLight: "#fff7ed",
    tagline: "Foodplus experience",
    rating: 4.1,
  },
];
