import "server-only";
import { parse } from "node-html-parser";

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
const ORIGIN = "https://www.naivas.online";

/**
 * Naivas Online runs on Bagisto (Webkul / Laravel). Each product detail page
 * embeds a Schema.org Product blob in a <script type="application/ld+json">
 * tag (Bagisto HTML-encodes the contents, so we decode before JSON.parse).
 *
 * We only scrape products that have a manually-mapped `externalUrl`. This
 * avoids Naivas's poor search relevance returning wrong products.
 *
 * To map a product, set ProductPrice.externalUrl for (productId, "naivas")
 * — either via /api/cron/scrape/naivas-urls (CSV import) or directly in DB.
 */

interface ProductSchema {
  name?: string;
  sku?: string;
  url?: string;
  offers?: {
    priceCurrency?: string;
    price?: string | number;
    availability?: string;
  };
}

const HTML_ENTITIES: Record<string, string> = {
  "&quot;": '"',
  "&amp;": "&",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&#39;": "'",
};

function decodeEntities(s: string): string {
  return s.replace(/&(quot|amp|apos|lt|gt|#39);/g, (m) => HTML_ENTITIES[m] ?? m);
}

function parseProductSchema(html: string): ProductSchema | null {
  const root = parse(html);
  const scripts = root.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    const raw = script.text?.trim();
    if (!raw) continue;
    const decoded = decodeEntities(raw);
    let json: unknown;
    try {
      json = JSON.parse(decoded);
    } catch {
      continue;
    }
    const candidates: unknown[] = Array.isArray(json) ? json : [json];
    for (const c of candidates) {
      if (
        c &&
        typeof c === "object" &&
        (c as { "@type"?: string })["@type"] === "Product"
      ) {
        return c as ProductSchema;
      }
    }
  }
  return null;
}

function readPrice(schema: ProductSchema): {
  price: number | null;
  inStock: boolean;
} {
  const o = schema.offers;
  if (!o) return { price: null, inStock: false };
  const raw =
    typeof o.price === "string"
      ? Number(o.price)
      : typeof o.price === "number"
        ? o.price
        : NaN;
  const price = Number.isFinite(raw) && raw > 0 ? raw : null;
  const inStock = (o.availability ?? "").toLowerCase().includes("instock");
  return { price, inStock };
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

  // Only consider products with a mapped externalUrl. Without it, we cannot
  // reliably identify the Naivas SKU (search relevance is unreliable).
  const all = await prisma.product.findMany({
    where: {
      prices: { some: { supermarketId: SUPERMARKET_ID, externalUrl: { not: null } } },
    },
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

  if (total === 0) {
    log.info("nothing to do: no Naivas-mapped products yet", {
      hint: "POST URLs to /api/cron/scrape/naivas-urls or set ProductPrice.externalUrl manually",
    });
    summary.durationMs = Date.now() - t0;
    return summary;
  }

  for (const p of products) {
    summary.attempted++;
    try {
      const url = p.prices[0]?.externalUrl;
      if (!url) {
        summary.skipped++;
        continue;
      }
      const res = await politeFetch(url, { logger: log });
      if (!res.ok) {
        summary.skipped++;
        log.warn(`${res.status}`, { product: p.name, url });
        continue;
      }
      const html = await res.text();
      const schema = parseProductSchema(html);
      if (!schema) {
        summary.skipped++;
        log.warn("no Product schema on page", { product: p.name, url });
        continue;
      }
      const { price, inStock } = readPrice(schema);
      if (price == null) {
        summary.skipped++;
        log.warn("no price in schema", { product: p.name, schema });
        continue;
      }

      log.info("match", {
        product: p.name,
        match: schema.name,
        price,
        inStock,
        sku: schema.sku,
      });

      if (!opts.dryRun) {
        const r = await upsertPrice(
          {
            productId: p.id,
            supermarketId: SUPERMARKET_ID,
            price,
            onSale: false,
            originalPrice: null,
            externalSku: schema.sku ?? p.prices[0]?.externalSku ?? null,
            externalUrl: url,
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
      log.error("error scraping", { product: p.name, err: msg });
    }
  }

  summary.durationMs = Date.now() - t0;
  return summary;
}
