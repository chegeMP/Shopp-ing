import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { BasketProvider } from "@/components/BasketContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Msaidizi } from "@/components/Msaidizi";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "PriceSnap";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: `${appName} — Supermarket Price Comparison`,
    template: `%s | ${appName}`,
  },
  description:
    "Compare grocery prices across Kenyan supermarkets. Find the cheapest deals, build a basket, and save money on every shop.",
  metadataBase: new URL(appUrl),
  openGraph: {
    title: `${appName} — Compare Supermarket Prices in Kenya`,
    description:
      "Instantly compare prices across 5 major supermarkets. Find the cheapest deals on 24+ everyday products.",
    siteName: appName,
    type: "website",
    locale: "en_KE",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} — Compare Supermarket Prices`,
    description:
      "Compare grocery prices across Kenyan supermarkets and save money.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="bg-white text-[#333] min-h-screen flex flex-col font-sans">
        <BasketProvider>
          <Header />
          <ErrorBoundary>
            <main className="flex-1">{children}</main>
          </ErrorBoundary>
          <Msaidizi />
          <footer className="border-t border-[#ddd] bg-[#f5f5f5] mt-10">
            <div className="max-w-[1100px] mx-auto px-4 py-5 text-xs text-[#888] flex flex-col sm:flex-row justify-between gap-2">
              <p>
                {appName} &mdash; Supermarket price comparison for Kenya.
                Prices are approximate and may vary by branch.
              </p>
              <p className="shrink-0">Last updated April 2026</p>
            </div>
          </footer>
        </BasketProvider>
      </body>
    </html>
  );
}
