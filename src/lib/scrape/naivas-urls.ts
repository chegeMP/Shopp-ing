import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

import { getPrisma } from "@/lib/prisma";
import {
  startSummary,
  type ScrapeLogger,
  type ScrapeSummary,
  consoleLogger,
} from "./common";

const SUPERMARKET_ID = "naivas";
const DEFAULT_FILE = "data/naivas-urls.csv";

/**
 * Seed ProductPrice.externalUrl for the Naivas store from a CSV.
 * Format:
 *   productId,externalUrl
 *   brookside-milk-1l,https://www.naivas.online/brookside-fresh-milk-1l
 *
 * Does NOT change prices — that happens in `runNaivasScrape`.
 * Lines starting with `#` are treated as comments.
 */
export async function runNaivasUrlImport(
  opts: {
    dryRun?: boolean;
    filePath?: string;
    csvContent?: string;
    logger?: ScrapeLogger;
    limit?: number;
    offset?: number;
  } = {},
): Promise<ScrapeSummary> {
  const log = opts.logger ?? consoleLogger;
  const summary = startSummary("naivas-urls");
  const t0 = Date.now();

  let raw = opts.csvContent;
  if (!raw) {
    const filePath = opts.filePath ?? path.join(process.cwd(), DEFAULT_FILE);
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
  const prisma = getPrisma();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const fields = line.split(",").map((f) => f.trim());

    if (!header) {
      header = fields.map((h) => h.toLowerCase());
      const need = ["productid", "externalurl"];
      const missing = need.filter((r) => !header!.includes(r));
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
    const externalUrl = row["externalurl"];
    if (!productId || !externalUrl) {
      summary.skipped++;
      log.warn("skip: missing column", { row });
      continue;
    }
    if (!/^https?:\/\/(www\.)?naivas\.online\//i.test(externalUrl)) {
      summary.skipped++;
      log.warn("skip: not a naivas URL", { externalUrl });
      continue;
    }

    if (opts.dryRun) {
      log.info("would upsert URL", { productId, externalUrl });
      summary.applied++;
      continue;
    }

    try {
      await prisma.productPrice.upsert({
        where: {
          productId_supermarketId: {
            productId,
            supermarketId: SUPERMARKET_ID,
          },
        },
        update: { externalUrl },
        create: {
          productId,
          supermarketId: SUPERMARKET_ID,
          price: 0,
          externalUrl,
          source: "naivas-url-map",
        },
      });
      summary.applied++;
    } catch (err) {
      summary.errors.push(`${productId}: ${String(err)}`);
      summary.skipped++;
    }
  }

  summary.durationMs = Date.now() - t0;
  return summary;
}
