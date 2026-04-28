"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OrderReceipt } from "@/components/OrderReceipt";
import {
  loadReceiptFromStorage,
  type ReceiptData,
  downloadReceiptAsHtmlFile,
} from "@/lib/receipt";

export default function ReceiptPage() {
  const [data, setData] = useState<ReceiptData | null | undefined>(undefined);

  useEffect(() => {
    setData(loadReceiptFromStorage());
  }, []);

  if (data === undefined) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-sm text-[#999]">
        Loading receipt…
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-lg font-bold text-[#222] dark:text-[#eee] mb-2">
          No receipt found
        </h1>
        <p className="text-sm text-[#666] dark:text-[#aaa] mb-6">
          Complete a checkout to generate a receipt. This page only shows your
          most recent order in this browser session.
        </p>
        <Link
          href="/"
          className="text-[#1a5dab] text-sm no-underline hover:underline"
        >
          &larr; Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          href="/"
          className="text-xs text-[#1a5dab] no-underline hover:underline"
        >
          &larr; Home
        </Link>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded text-sm font-medium bg-[#1a5dab] text-white hover:bg-[#155299] cursor-pointer border-0"
          >
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={() => downloadReceiptAsHtmlFile(data)}
            className="px-4 py-2 rounded text-sm font-medium bg-white dark:bg-[#2a2a2a] text-[#222] dark:text-[#eee] border border-[#ccc] dark:border-[#555] hover:bg-[#f5f5f5] dark:hover:bg-[#333] cursor-pointer"
          >
            Download HTML
          </button>
        </div>
      </div>

      <p className="no-print text-sm text-[#666] dark:text-[#aaa] mb-6 text-center">
        Use <strong>Print / Save as PDF</strong> for a PDF file, or{" "}
        <strong>Download HTML</strong> to save an offline copy.
      </p>

      <OrderReceipt data={data} />
    </div>
  );
}
