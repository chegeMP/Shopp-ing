"use client";

import Link from "next/link";
import { useBasket } from "./BasketContext";
import { useTheme } from "./ThemeProvider";
import { usePathname } from "next/navigation";

export function Header() {
  const { itemCount } = useBasket();
  const { theme, toggle } = useTheme();
  const path = usePathname();

  const isActive = (href: string) => path === href;

  return (
    <header className="border-b border-[#ddd] dark:border-[#333] bg-white dark:bg-[#1a1a1a] sticky top-0 z-40 transition-colors">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="flex items-center justify-between h-12 gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[15px] font-bold text-[#222] dark:text-[#f0f0f0] no-underline hover:no-underline"
          >
            <svg className="w-5 h-5 text-[#1a5dab]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            PriceSnap
          </Link>
          <nav className="flex items-center gap-1 shrink-0">
            {[
              { href: "/", label: "Home", icon: null },
              { href: "/compare", label: "Compare", icon: null },
              {
                href: "/basket",
                label: "Basket",
                icon: itemCount > 0 ? itemCount : null,
              },
            ].map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 text-[13px] rounded no-underline hover:no-underline transition-colors flex items-center gap-1 ${
                  isActive(href)
                    ? "bg-[#e8f0fe] dark:bg-[#1e3550] text-[#1a5dab] dark:text-[#90caf9] font-medium"
                    : "text-[#555] dark:text-[#bdbdbd] hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a2a]"
                }`}
              >
                {label}
                {icon !== null && (
                  <span className="inline-flex items-center justify-center bg-[#1a5dab] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1">
                    {icon}
                  </span>
                )}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => toggle()}
              className="ml-2 p-2 rounded text-[13px] text-[#555] dark:text-[#bbb] hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors cursor-pointer border border-transparent dark:border-transparent"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? (
                <span className="text-base leading-none" aria-hidden>☀️</span>
              ) : (
                <span className="text-base leading-none" aria-hidden>🌙</span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
