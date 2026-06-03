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

const SUPERMARKET_ID = "greenspoon";
const ORIGIN = "https://greenspoon.co.ke";

/**
 * Greenspoon runs WordPress + WooCommerce. We use the public, unauthenticated
 * WooCommerce Store API: GET /wp-json/wc/store/v1/products?search=<q>.
 *
 * Returns clean JSON with sku, permalink, prices.{price,regular_price,sale_price}.
 * Names are searchable, but Greenspoon is upmarket: many of our local catalog
 * items won't exist there. A simple name-similarity guard prevents accepting
 * unrelated top hits.
 */

interface WcStoreProduct {
  id?: number;
  name?: string;
  sku?: string;
  permalink?: string;
  on_sale?: boolean;
  is_in_stock?: boolean;
  prices?: {
    price?: string | number;
    regular_price?: string | number;
    sale_price?: string | number;
    currency_code?: string;
  };
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—");
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3),
  );
}

/**
 * Jaccard similarity (0..1) of the two token sets. We require ≥0.4 to accept
 * a match — covers brand+keyword overlaps without being too strict.
 */
function nameSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersect = 0;
  for (const t of ta) if (tb.has(t)) intersect++;
  const union = ta.size + tb.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

const MIN_SIMILARITY = 0.4;

function readPrices(p: WcStoreProduct): {
  price: number | null;
  originalPrice: number | null;
} {
  const pr = p.prices ?? {};
  const toNum = (v: unknown): number | null => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const current = toNum(pr.price);
  const list = toNum(pr.regular_price);
  if (current != null && list != null && list > current) {
    return { price: current, originalPrice: list };
  }
  return { price: current ?? list, originalPrice: null };
}

async function searchGreenspoon(
  query: string,
  log: ScrapeLogger,
): Promise<WcStoreProduct | null> {
  const url = `${ORIGIN}/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=5`;
  try {
    const res = await politeFetch(url, { logger: log });
    if (!res.ok) {
      log.warn(`search ${res.status}`, { url });
      return null;
    }
    const list = (await res.json()) as WcStoreProduct[];
    if (!Array.isArray(list) || list.length === 0) return null;

    // Rank by name similarity to our local query.
    const ranked = list
      .map((p) => ({
        product: p,
        score: nameSimilarity(query, decodeHtml(p.name ?? "")),
      }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best || best.score < MIN_SIMILARITY) {
      log.warn("no similar enough match", {
        query,
        bestName: best?.product.name,
        bestScore: best?.score,
      });
      return null;
    }
    return best.product;
  } catch (err) {
    log.warn("search failed", { url, err: String(err) });
    return null;
  }
}

async function ensureSupermarketExists(): Promise<void> {
  const prisma = getPrisma();
  await prisma.supermarket.upsert({
    where: { id: SUPERMARKET_ID },
    update: {},
    create: {
      id: SUPERMARKET_ID,
      name: "Greenspoon",
      initial: "G",
      color: "#15803d",
      bgLight: "#ecfdf5",
      tagline: "Quality groceries, delivered",
      rating: 4.4,
    },
  });
}

export async function runGreenspoonScrape(
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

  await ensureSupermarketExists();

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
      const hit = await searchGreenspoon(p.name, log);
      if (!hit) {
        summary.skipped++;
        continue;
      }
      const { price, originalPrice } = readPrices(hit);
      if (price == null) {
        summary.skipped++;
        log.warn("no price", { product: p.name, match: hit.name });
        continue;
      }

      log.info("match", {
        product: p.name,
        match: decodeHtml(hit.name ?? ""),
        price,
        originalPrice,
        sku: hit.sku,
      });

      if (!opts.dryRun) {
        const r = await upsertPrice(
          {
            productId: p.id,
            supermarketId: SUPERMARKET_ID,
            price,
            onSale: originalPrice != null || hit.on_sale === true,
            originalPrice,
            externalSku: hit.sku ?? (hit.id != null ? String(hit.id) : null),
            externalUrl: hit.permalink ?? null,
            source: "greenspoon-scraper",
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
      log.error("error scraping", { product: p.name, err: msg });
    }
  }

  summary.durationMs = Date.now() - t0;
  return summary;
}
