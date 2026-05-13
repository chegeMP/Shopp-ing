import "server-only";
import { setDefaultResultOrder } from "node:dns";
import { getPrisma } from "@/lib/prisma";

// Akamai-fronted hosts (Carrefour KE) often return IPv6 addresses first.
// Many Kenyan ISPs have broken IPv6 paths, which makes fetch hang for ~30s
// before falling back. Forcing IPv4-first makes the scrape predictable.
try {
  setDefaultResultOrder("ipv4first");
} catch {
  /* ignore: not supported on older Node */
}

const USER_AGENT =
  "ma-bei-price-bot/0.1 (+https://shopp-ing-five.vercel.app; contact: ops@example.com)";

const robotsCache = new Map<string, RobotsRules | null>();
const lastHitAtByHost = new Map<string, number>();

export interface ScrapeLogger {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
}

export const consoleLogger: ScrapeLogger = {
  info: (msg, meta) => console.log(`[scrape] ${msg}`, meta ?? ""),
  warn: (msg, meta) => console.warn(`[scrape] ${msg}`, meta ?? ""),
  error: (msg, meta) => console.error(`[scrape] ${msg}`, meta ?? ""),
};

interface RobotsRules {
  // Simple Disallow list; we only enforce for our specific UA + "*".
  disallow: string[];
  crawlDelaySec: number;
}

function parseRobots(text: string): RobotsRules {
  const lines = text.split(/\r?\n/);
  const disallow: string[] = [];
  let crawlDelaySec = 0;
  let activeForUs = false;

  for (const raw of lines) {
    const line = raw.split("#")[0]!.trim();
    if (!line) continue;

    const [keyRaw, ...rest] = line.split(":");
    if (!keyRaw || rest.length === 0) continue;
    const key = keyRaw.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      activeForUs = value === "*" || value.toLowerCase().includes("ma-bei");
    } else if (activeForUs) {
      if (key === "disallow" && value) disallow.push(value);
      if (key === "crawl-delay") {
        const n = Number(value);
        if (Number.isFinite(n) && n > crawlDelaySec) crawlDelaySec = n;
      }
    }
  }
  return { disallow, crawlDelaySec };
}

export async function loadRobots(origin: string): Promise<RobotsRules | null> {
  if (robotsCache.has(origin)) return robotsCache.get(origin) ?? null;
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
      // robots.txt is small; cache for 1h between cron runs
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      robotsCache.set(origin, null);
      return null;
    }
    const rules = parseRobots(await res.text());
    robotsCache.set(origin, rules);
    return rules;
  } catch {
    robotsCache.set(origin, null);
    return null;
  }
}

export function isAllowedByRobots(rules: RobotsRules | null, pathname: string): boolean {
  if (!rules) return true; // no robots = allowed by convention
  return !rules.disallow.some((rule) => rule && pathname.startsWith(rule));
}

function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * ms * 0.4);
}

/**
 * Polite GET. Enforces:
 *  - robots.txt (host + path)
 *  - min delay between hits per host (default 2.5s, or Crawl-delay if higher)
 *  - sensible UA + Accept headers
 *  - one retry on 5xx
 */
export async function politeFetch(
  url: string,
  opts: { minDelayMs?: number; logger?: ScrapeLogger } = {},
): Promise<Response> {
  const u = new URL(url);
  const origin = `${u.protocol}//${u.host}`;
  const log = opts.logger ?? consoleLogger;

  const rules = await loadRobots(origin);
  if (!isAllowedByRobots(rules, u.pathname)) {
    throw new Error(`robots.txt disallows ${u.pathname} on ${origin}`);
  }

  const minDelay = Math.max(
    opts.minDelayMs ?? 2500,
    (rules?.crawlDelaySec ?? 0) * 1000,
  );
  const last = lastHitAtByHost.get(u.host) ?? 0;
  const wait = Math.max(0, last + minDelay - Date.now());
  if (wait > 0) await new Promise((r) => setTimeout(r, jitter(wait)));
  lastHitAtByHost.set(u.host, Date.now());

  const headers: HeadersInit = {
    "User-Agent": USER_AGENT,
    Accept: "application/json, text/html;q=0.9, */*;q=0.5",
    "Accept-Language": "en-KE,en;q=0.9",
  };

  let res: Response;
  try {
    res = await fetch(url, { headers, redirect: "follow" });
  } catch (err) {
    log.error(`fetch failed: ${url}`, { err: String(err) });
    throw err;
  }

  if (res.status >= 500 && res.status < 600) {
    log.warn(`retrying after ${res.status}`, { url });
    await new Promise((r) => setTimeout(r, 2000));
    res = await fetch(url, { headers, redirect: "follow" });
  }
  return res;
}

export interface PriceUpdate {
  productId: string;
  supermarketId: string;
  price: number;
  onSale?: boolean;
  originalPrice?: number | null;
  externalSku?: string | null;
  externalUrl?: string | null;
  source: string;
}

const MIN_PRICE_KES = 5;
const MAX_PRICE_KES = 100_000;

export async function upsertPrice(update: PriceUpdate, logger: ScrapeLogger = consoleLogger) {
  if (!Number.isFinite(update.price)) {
    logger.warn("skip: non-finite price", { update });
    return { applied: false, reason: "non-finite" };
  }
  const price = Math.round(update.price);
  if (price < MIN_PRICE_KES || price > MAX_PRICE_KES) {
    logger.warn("skip: price out of sane bounds", { update, price });
    return { applied: false, reason: "out-of-bounds" };
  }

  const prisma = getPrisma();
  await prisma.productPrice.upsert({
    where: {
      productId_supermarketId: {
        productId: update.productId,
        supermarketId: update.supermarketId,
      },
    },
    update: {
      price,
      onSale: update.onSale ?? false,
      originalPrice: update.originalPrice ?? null,
      externalSku: update.externalSku ?? undefined,
      externalUrl: update.externalUrl ?? undefined,
      source: update.source,
      lastVerifiedAt: new Date(),
    },
    create: {
      productId: update.productId,
      supermarketId: update.supermarketId,
      price,
      onSale: update.onSale ?? false,
      originalPrice: update.originalPrice ?? null,
      externalSku: update.externalSku ?? null,
      externalUrl: update.externalUrl ?? null,
      source: update.source,
      lastVerifiedAt: new Date(),
    },
  });
  return { applied: true };
}

export interface ScrapeSummary {
  store: string;
  startedAt: string;
  durationMs: number;
  attempted: number;
  applied: number;
  skipped: number;
  errors: string[];
  /** When batching, describes which slice of the catalog was processed */
  batch?: {
    totalProducts: number;
    offset: number;
    limit: number;
    batchIndex: number;
    batchCount: number;
  };
}

export function startSummary(store: string): ScrapeSummary {
  return {
    store,
    startedAt: new Date().toISOString(),
    durationMs: 0,
    attempted: 0,
    applied: 0,
    skipped: 0,
    errors: [],
  };
}

/** UTC calendar day index — used to rotate which catalog slice each cron run scrapes. */
export function utcDayBucket(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/**
 * Pick a stable batch window so daily crons cover the whole catalog over time
 * without exceeding serverless timeouts.
 */
export function computeDailyBatchOffset(
  totalProducts: number,
  batchSize: number,
  explicitOffset?: number,
): { offset: number; batchIndex: number; batchCount: number } {
  const size = Math.max(1, batchSize);
  const total = Math.max(0, totalProducts);
  const batchCount = total === 0 ? 1 : Math.ceil(total / size);

  if (explicitOffset != null) {
    const offset = Math.min(Math.max(0, explicitOffset), Math.max(0, total - 1));
    const batchIndex = Math.min(batchCount - 1, Math.floor(offset / size));
    return { offset, batchIndex, batchCount };
  }

  const day = utcDayBucket();
  const batchIndex = day % batchCount;
  const offset = batchIndex * size;
  return { offset, batchIndex, batchCount };
}
