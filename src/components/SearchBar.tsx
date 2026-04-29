"use client";

import { useRef, useEffect } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search products...",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "SELECT"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="relative rounded-xl border border-[#d8dce2] dark:border-[#3d4249] bg-white dark:bg-[#252525] shadow-sm hover:shadow-md hover:border-[#c5cad3] dark:hover:border-[#505860] transition-all duration-200 focus-within:border-[#1a5dab] dark:focus-within:border-[#5b9bd5] focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#1a5dab]/12 dark:focus-within:ring-[#5b9bd5]/15">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa3af] dark:text-[#7d8694] pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-[4.25rem] py-2.5 text-sm bg-transparent dark:text-[#ececec] placeholder:text-[#9aa3af] dark:placeholder:text-[#888] focus:outline-none rounded-xl border-0"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="w-6 h-6 rounded-full bg-[#e8eaee] dark:bg-[#3a3f46] hover:bg-[#dde0e6] dark:hover:bg-[#4a5058] text-[#5c6370] dark:text-[#d0d4dc] flex items-center justify-center cursor-pointer text-sm leading-none transition-colors"
            title="Clear search"
          >
            &times;
          </button>
        )}
        {!value && (
          <kbd className="hidden sm:inline-block text-[10px] text-[#8b939e] dark:text-[#8a9099] border border-[#d8dce2] dark:border-[#505860] rounded-md px-1.5 py-0.5 font-mono bg-[#f4f5f7] dark:bg-[#2e3238] shadow-sm">
            /
          </kbd>
        )}
      </div>
    </div>
  );
}
