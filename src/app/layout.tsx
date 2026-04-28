import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { BasketProvider } from "@/components/BasketContext";
import { CatalogProvider } from "@/components/CatalogContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Msaidizi } from "@/components/Msaidizi";
import { getCachedCatalog } from "@/lib/catalog";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { products, supermarkets } = await getCachedCatalog();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='pricesnap_theme';var s=localStorage.getItem(k);var d=document.documentElement;var prefers=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&prefers))d.classList.add('dark');else d.classList.remove('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className="bg-white text-[#333] dark:bg-[#141414] dark:text-[#e8e8e8] min-h-screen flex flex-col font-sans transition-colors"
        suppressHydrationWarning
      >
        <CatalogProvider products={products} supermarkets={supermarkets}>
          <ThemeProvider>
            <BasketProvider>
              <Header />
              <ErrorBoundary>
                <main className="flex-1 bg-[#fafafa] dark:bg-[#121212] transition-colors">
                  {children}
                </main>
              </ErrorBoundary>
              <Msaidizi />
              <footer className="border-t border-[#ddd] dark:border-[#2a2a2a] bg-[#f5f5f5] dark:bg-[#1a1a1a] mt-10">
                <div className="max-w-[1100px] mx-auto px-4 py-6 flex flex-col lg:flex-row justify-between gap-6 lg:items-start">
                  <div className="text-xs text-[#888] dark:text-[#9a9a9a] max-w-xl space-y-1">
                    <p>
                      {appName} &mdash; Supermarket price comparison for Kenya.
                      Prices are approximate and may vary by branch.
                    </p>
                    <p className="shrink-0">Last updated April 2026</p>
                  </div>
                  <NewsletterSignup />
                </div>
              </footer>
            </BasketProvider>
          </ThemeProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
