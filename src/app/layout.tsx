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
import { APP_DISPLAY_NAME_DEFAULT, themeBootstrapInlineScript } from "@/lib/branding";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? APP_DISPLAY_NAME_DEFAULT;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: `${appName} — Supermarket Price Comparison`,
    template: `%s | ${appName}`,
  },
  description:
    "Ma-bei — many prices. Compare grocery prices across Kenyan supermarkets, find the cheapest deals, build a basket, and save on every shop.",
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
            __html: themeBootstrapInlineScript(),
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
                <main className="flex-1 min-h-[70vh] bg-gradient-to-b from-[#eef3f9] via-[#f7f8fa] to-[#fafafa] dark:from-[#161d28] dark:via-[#141414] dark:to-[#121212] transition-colors">
                  {children}
                </main>
              </ErrorBoundary>
              <Msaidizi />
              <footer className="border-t border-[#e2e4e8] dark:border-[#2a2a2a] bg-[#f1f3f6]/90 dark:bg-[#18181b]/95 backdrop-blur-sm mt-12 shadow-[0_-1px_0_rgba(0,0,0,0.04)] dark:shadow-none">
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
