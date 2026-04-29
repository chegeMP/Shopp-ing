"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Subscribe failed");
      }
      setStatus("ok");
      setEmail("");
    } catch {
      setStatus("err");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 w-full max-w-xs rounded-2xl border border-[#e2e4e8] dark:border-[#35383d] bg-white/80 dark:bg-[#232326]/80 backdrop-blur-sm p-4 shadow-sm"
    >
      <p className="text-[13px] font-semibold text-[#444] dark:text-[#ccc] mb-0.5">
        Price alerts &amp; deals
      </p>
      <p className="text-[11px] text-[#888] dark:text-[#aaa] leading-snug">
        Get occasional emails when prices drop (no spam).
      </p>
      <div className="flex gap-2 mt-1">
        <label htmlFor="footer-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-email"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          className="flex-1 min-w-0 px-3 py-2 text-[13px] border border-[#d8dce2] dark:border-[#444] rounded-xl bg-white dark:bg-[#262626] dark:text-[#eee] placeholder:text-[#999] dark:placeholder:text-[#666] shadow-sm focus:outline-none focus:border-[#1a5dab] dark:focus:border-[#5b9bd5]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 px-4 py-2 text-[12px] font-semibold rounded-xl bg-[#1a5dab] text-white hover:bg-[#155299] disabled:opacity-60 shadow-md shadow-[#1a5dab]/25 transition-all active:scale-[0.98]"
        >
          {status === "loading" ? "…" : "Join"}
        </button>
      </div>
      {status === "ok" && (
        <p className="text-[11px] text-[#2e7d32] dark:text-[#81c784]">
          Thanks! Check your inbox.
        </p>
      )}
      {status === "err" && (
        <p className="text-[11px] text-[#c62828] dark:text-[#ef9a9a]">
          Could not subscribe — try again later.
        </p>
      )}
    </form>
  );
}
