import { NextResponse, type NextRequest } from "next/server";

import { runCarrefourScrape } from "@/lib/scrape/carrefour";
import { runNaivasScrape } from "@/lib/scrape/naivas";
import { runManualImport } from "@/lib/scrape/manual";
import type { ScrapeSummary } from "@/lib/scrape/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Bumped to 60s; raise to 300 on Vercel Pro for safer scraping windows.
export const maxDuration = 60;

const RUNNERS: Record<string, (opts: { dryRun?: boolean }) => Promise<ScrapeSummary>> = {
  carrefour: runCarrefourScrape,
  naivas: runNaivasScrape,
  manual: runManualImport,
};

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  // Allow manual triggers from the dashboard with ?secret=
  const querySecret = req.nextUrl.searchParams.get("secret");
  if (querySecret && querySecret === secret) return true;

  return false;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ store: string }> },
) {
  if (process.env.DATA_SOURCE !== "database") {
    return NextResponse.json(
      { error: "DATA_SOURCE must be 'database' to run scrapers" },
      { status: 400 },
    );
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { store } = await ctx.params;
  const runner = RUNNERS[store];
  if (!runner) {
    return NextResponse.json(
      { error: `unknown store '${store}'`, valid: Object.keys(RUNNERS) },
      { status: 404 },
    );
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

  try {
    const summary = await runner({ dryRun });
    return NextResponse.json({ ok: true, dryRun, summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 },
    );
  }
}
