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
    <header className="sticky top-0 z-40 border-b border-[#e6e8ec] dark:border-[#2c2c30] bg-white/85 dark:bg-[#1a1a1c]/90 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)] transition-colors">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-[#1a1d21] dark:text-[#f4f4f5] no-underline hover:no-underline group"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a5dab] to-[#124a8f] text-white shadow-md shadow-[#1a5dab]/25 ring-1 ring-white/20">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </span>
            <span className="group-hover:text-[#1a5dab] dark:group-hover:text-[#90caf9] transition-colors">
              PriceSnap
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0">
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
                className={`relative px-3 sm:px-3.5 py-2 text-[13px] rounded-full no-underline hover:no-underline transition-all duration-200 flex items-center gap-1.5 font-medium ${
                  isActive(href)
                    ? "bg-[#e8f0fe] dark:bg-[#1e3a5f] text-[#1a5dab] dark:text-[#90caf9] shadow-inner shadow-black/[0.04]"
                    : "text-[#5c6370] dark:text-[#c8cdd5] hover:bg-[#f0f2f6] dark:hover:bg-[#2a2a2e] active:scale-[0.98]"
                }`}
              >
                {label}
                {icon !== null && (
                  <span className="inline-flex items-center justify-center min-w-[19px] h-[19px] px-1 rounded-full bg-[#1a5dab] text-white text-[10px] font-bold shadow-sm ring-2 ring-white dark:ring-[#1e3a5f]">
                    {icon}
                  </span>
                )}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => toggle()}
              className="ml-1 p-2.5 rounded-full text-[#5c6370] dark:text-[#c8cdd5] hover:bg-[#f0f2f6] dark:hover:bg-[#2a2a2e] active:scale-[0.97] transition-all duration-200 cursor-pointer border border-transparent"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? (
                <span className="text-lg leading-none" aria-hidden>
                  ☀️
                </span>
              ) : (
                <span className="text-lg leading-none" aria-hidden>
                  🌙
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
