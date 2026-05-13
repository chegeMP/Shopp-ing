import "server-only";
import { getPrisma } from "@/lib/prisma";
import {
  politeFetch,
  upsertPrice,
  startSummary,
  computeDailyBatchOffset,
  type ScrapeLogger,
  type ScrapeSummary,
  consoleLogger,
} from "./common";

const SUPERMARKET_ID = "naivas";
const ORIGIN = "https://naivas.online";

/**
 * Naivas Online uses a non-public JSON API. The exact path is not documented;
 * the two most common shapes seen are:
 *   /api/products?search=<q>
 *   /api/catalog/search?keyword=<q>
 * Confirm by running the scraper in dry-run once and inspecting the logs.
 */
const SEARCH_PATHS = [
  (q: string) => `/api/products?search=${encodeURIComponent(q)}&limit=5`,
  (q: string) => `/api/catalog/search?keyword=${encodeURIComponent(q)}&limit=5`,
];

interface NaivasProduct {
  id?: string | number;
  sku?: string;
  name?: string;
  title?: string;
  slug?: string;
  url?: string;
  price?: number | string;
  sale_price?: number | string;
  regular_price?: number | string;
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^0-9.]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickPrice(p: NaivasProduct): {
  price: number | null;
  originalPrice: number | null;
} {
  const sale = toNumber(p.sale_price);
  const list = toNumber(p.regular_price ?? p.price);
  if (sale != null && list != null && sale < list) {
    return { price: sale, originalPrice: list };
  }
  return { price: list ?? sale, originalPrice: null };
}

async function searchNaivas(
  query: string,
  log: ScrapeLogger,
): Promise<NaivasProduct | null> {
  for (const buildPath of SEARCH_PATHS) {
    const url = `${ORIGIN}${buildPath(query)}`;
    try {
      const res = await politeFetch(url, { logger: log });
      if (!res.ok) {
        log.warn(`search ${res.status}`, { url });
        continue;
      }
      const json = (await res.json()) as unknown;
      const list: NaivasProduct[] = Array.isArray(json)
        ? (json as NaivasProduct[])
        : Array.isArray((json as { data?: unknown }).data)
          ? ((json as { data: NaivasProduct[] }).data)
          : Array.isArray((json as { products?: unknown }).products)
            ? ((json as { products: NaivasProduct[] }).products)
            : [];
      if (list.length === 0) continue;
      return list[0]!;
    } catch (err) {
      log.warn(`search failed`, { url, err: String(err) });
    }
  }
  return null;
}

export async function runNaivasScrape(
  opts: {
    dryRun?: boolean;
    logger?: ScrapeLogger;
    limit?: number;
    offset?: number;
  } = {},
): Promise<ScrapeSummary> {
  const log = opts.logger ?? consoleLogger;
  const summary = startSummary(SUPERMARKET_ID);
  const t0 = Date.now();

  const prisma = getPrisma();

  const envBatch = Number(process.env.SCRAPE_CRON_LIMIT);
  let batchSize =
    Number.isFinite(envBatch) && envBatch > 0 ? Math.floor(envBatch) : 15;
  if (opts.limit != null && Number.isFinite(opts.limit) && opts.limit > 0) {
    batchSize = Math.min(500, Math.floor(opts.limit));
  }

  const all = await prisma.product.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      prices: {
        where: { supermarketId: SUPERMARKET_ID },
        select: { externalSku: true, externalUrl: true },
      },
    },
  });

  const total = all.length;
  const { offset, batchIndex, batchCount } = computeDailyBatchOffset(
    total,
    batchSize,
    opts.offset,
  );
  const products = all.slice(offset, offset + batchSize);
  summary.batch = {
    totalProducts: total,
    offset,
    limit: batchSize,
    batchIndex,
    batchCount,
  };

  for (const p of products) {
    summary.attempted++;
    try {
      // Naivas doesn't have a clean "fetch by id" path we can rely on yet,
      // so we always go through search. Once you confirm the JSON shape,
      // you can short-circuit using cached externalSku.
      const match = await searchNaivas(p.name, log);
      if (!match) {
        summary.skipped++;
        log.warn(`no match`, { product: p.name });
        continue;
      }

      const { price, originalPrice } = pickPrice(match);
      if (price == null) {
        summary.skipped++;
        log.warn(`no price`, { product: p.name, match: match.name ?? match.title });
        continue;
      }

      const externalSku = match.sku ?? (match.id != null ? String(match.id) : null);
      const externalUrl =
        match.url ??
        (match.slug ? `${ORIGIN}/products/${match.slug}` : null);

      log.info(`match`, {
        product: p.name,
        match: match.name ?? match.title,
        price,
        originalPrice,
      });

      if (!opts.dryRun) {
        const r = await upsertPrice(
          {
            productId: p.id,
            supermarketId: SUPERMARKET_ID,
            price,
            onSale: originalPrice != null,
            originalPrice,
            externalSku,
            externalUrl,
            source: "naivas-scraper",
          },
          log,
        );
        if (r.applied) summary.applied++;
        else summary.skipped++;
      } else {
        summary.applied++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      summary.errors.push(`${p.name}: ${msg}`);
      log.error(`error scraping`, { product: p.name, err: msg });
    }
  }

  summary.durationMs = Date.now() - t0;
  return summary;
}
