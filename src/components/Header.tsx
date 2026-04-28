"use client";

import Link from "next/link";
import { useBasket } from "./BasketContext";
import { usePathname } from "next/navigation";

export function Header() {
  const { itemCount } = useBasket();
  const path = usePathname();

  const isActive = (href: string) => path === href;

  return (
    <header className="border-b border-[#ddd] bg-white sticky top-0 z-40">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[15px] font-bold text-[#222] no-underline hover:no-underline"
          >
            <svg className="w-5 h-5 text-[#1a5dab]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            PriceSnap
          </Link>
          <nav className="flex items-center gap-1">
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
                    ? "bg-[#e8f0fe] text-[#1a5dab] font-medium"
                    : "text-[#555] hover:bg-[#f0f0f0]"
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
          </nav>
        </div>
      </div>
    </header>
  );
}
