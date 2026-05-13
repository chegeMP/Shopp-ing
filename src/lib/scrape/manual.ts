import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

import {
  upsertPrice,
  startSummary,
  type ScrapeLogger,
  type ScrapeSummary,
  consoleLogger,
} from "./common";

const MANUAL_FILE = "data/manual-prices.csv";

/**
 * Manual CSV importer for stores without an online catalog
 * (Cleanshelf, Chandarana, QuickMart, and any other).
 *
 * Format: header row required.
 *   productId,supermarketId,price,onSale,originalPrice
 *   unga-2kg,cleanshelf,192,false,
 *   sugar-2kg,chandarana,310,true,330
 *
 * Comments allowed: any line starting with #.
 */
export async function runManualImport(
  opts: {
    dryRun?: boolean;
    filePath?: string;
    csvContent?: string;
    logger?: ScrapeLogger;
    /** Ignored — manual import is fast; kept for runner signature parity. */
    limit?: number;
    offset?: number;
  } = {},
): Promise<ScrapeSummary> {
  const log = opts.logger ?? consoleLogger;
  const summary = startSummary("manual");
  const t0 = Date.now();

  let raw = opts.csvContent;
  if (!raw) {
    const filePath = opts.filePath ?? path.join(process.cwd(), MANUAL_FILE);
    try {
      raw = await fs.readFile(filePath, "utf-8");
    } catch (err) {
      summary.errors.push(`could not read ${filePath}: ${String(err)}`);
      summary.durationMs = Date.now() - t0;
      return summary;
    }
  }

  const lines = raw.split(/\r?\n/);
  let header: string[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const fields = line.split(",").map((f) => f.trim());

    if (!header) {
      header = fields.map((h) => h.toLowerCase());
      const required = ["productid", "supermarketid", "price"];
      const missing = required.filter((r) => !header!.includes(r));
      if (missing.length) {
        summary.errors.push(`missing CSV columns: ${missing.join(", ")}`);
        summary.durationMs = Date.now() - t0;
        return summary;
      }
      continue;
    }

    summary.attempted++;
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = fields[i] ?? "";
    });

    const productId = row["productid"];
    const supermarketId = row["supermarketid"];
    const price = Number(row["price"]);
    if (!productId || !supermarketId || !Number.isFinite(price)) {
      summary.skipped++;
      log.warn("skip: malformed row", { row });
      continue;
    }

    const onSaleRaw = row["onsale"]?.toLowerCase();
    const onSale = onSaleRaw === "true" || onSaleRaw === "1" || onSaleRaw === "yes";
    const originalPriceRaw = row["originalprice"];
    const originalPrice =
      originalPriceRaw && originalPriceRaw !== ""
        ? Number(originalPriceRaw)
        : null;

    if (opts.dryRun) {
      summary.applied++;
      log.info("would apply", { productId, supermarketId, price, onSale, originalPrice });
      continue;
    }

    const r = await upsertPrice(
      {
        productId,
        supermarketId,
        price,
        onSale,
        originalPrice: originalPrice ?? null,
        source: "manual-csv",
      },
      log,
    );
    if (r.applied) summary.applied++;
    else summary.skipped++;
  }

  summary.durationMs = Date.now() - t0;
  return summary;
}
