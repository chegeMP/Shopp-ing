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

const SUPERMARKET_ID = "carrefour";
const ORIGIN = "https://www.carrefour.ke";

/**
 * Carrefour KE runs on a VTEX-like stack. The product search endpoint
 * (path may need adjustment per locale) responds with JSON.
 *
 * NOTE: confirm the actual path by running this scraper in dry-run once
 * (the cron route accepts ?dryRun=1) and inspecting the logged response.
 * Common paths seen in the wild:
 *   /api/catalog_system/pub/products/search/<query>
 *   /_v/api/intelligent-search/product_search?query=<query>
 */
const SEARCH_PATHS = [
  (q: string) =>
    `/_v/api/intelligent-search/product_search?query=${encodeURIComponent(q)}&count=5`,
  (q: string) =>
    `/api/catalog_system/pub/products/search/${encodeURIComponent(q)}?_from=0&_to=4`,
];

interface VtexProduct {
  productName?: string;
  productId?: string;
  linkText?: string;
  items?: Array<{
    itemId?: string;
    sellers?: Array<{
      commertialOffer?: {
        Price?: number;
        ListPrice?: number;
        IsAvailable?: boolean;
      };
    }>;
  }>;
}

function pickPrice(p: VtexProduct): {
  price: number | null;
  originalPrice: number | null;
} {
  const offer = p.items?.[0]?.sellers?.[0]?.commertialOffer;
  if (!offer || offer.IsAvailable === false) return { price: null, originalPrice: null };
  const price = typeof offer.Price === "number" ? offer.Price : null;
  const list = typeof offer.ListPrice === "number" ? offer.ListPrice : null;
  return { price, originalPrice: list && list > (price ?? 0) ? list : null };
}

async function searchCarrefour(
  query: string,
  log: ScrapeLogger,
): Promise<VtexProduct | null> {
  for (const buildPath of SEARCH_PATHS) {
    const url = `${ORIGIN}${buildPath(query)}`;
    try {
      const res = await politeFetch(url, { logger: log });
      if (!res.ok) {
        log.warn(`search ${res.status}`, { url });
        continue;
      }
      const json = (await res.json()) as unknown;
      const list: VtexProduct[] = Array.isArray(json)
        ? (json as VtexProduct[])
        : Array.isArray((json as { products?: unknown }).products)
          ? (json as { products: VtexProduct[] }).products
          : [];
      if (list.length === 0) continue;
      return list[0]!;
    } catch (err) {
      log.warn(`search failed`, { url, err: String(err) });
    }
  }
  return null;
}

export async function runCarrefourScrape(
  opts: {
    dryRun?: boolean;
    logger?: ScrapeLogger;
    /** Max products per invocation (default: SCRAPE_CRON_LIMIT or 15). */
    limit?: number;
    /** If set, scrape this slice only; otherwise UTC day rotation. */
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
      const cached = p.prices[0];
      let result: VtexProduct | null = null;

      if (cached?.externalUrl && cached.externalSku) {
        const url = `${ORIGIN}/api/catalog_system/pub/products/search?fq=productId:${encodeURIComponent(cached.externalSku)}`;
        const res = await politeFetch(url, { logger: log });
        if (res.ok) {
          const json = (await res.json()) as VtexProduct[];
          result = json[0] ?? null;
        }
      }
      if (!result) result = await searchCarrefour(p.name, log);
      if (!result) {
        summary.skipped++;
        log.warn(`no match`, { product: p.name });
        continue;
      }

      const { price, originalPrice } = pickPrice(result);
      if (price == null) {
        summary.skipped++;
        log.warn(`no price`, { product: p.name, match: result.productName });
        continue;
      }

      const externalSku = result.productId ?? null;
      const externalUrl = result.linkText
        ? `${ORIGIN}/${result.linkText}/p`
        : null;

      log.info(`match`, {
        product: p.name,
        match: result.productName,
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
            source: "carrefour-scraper",
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
