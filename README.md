# Ma-bei — Many prices, one place

Compare grocery prices across Kenyan supermarkets. **Ma-bei** means *many prices* — find the cheapest deals, build a shopping basket, and see how much you save.

## Features

- **Price comparison** — side-by-side prices for 24+ products across 5 supermarkets (Naivas, QuickMart, Carrefour, Cleanshelf, Chandarana)
- **Smart basket** — add items and see total cost at each store, plus an optimal mix that buys each item at its cheapest store
- **Msaidizi assistant** — chat-based shopping assistant that answers questions about prices, deals, and stores
- **API layer** — REST endpoints at `/api/products`, `/api/supermarkets`, `/api/search`, `/api/health`
- **SEO ready** — sitemap, robots.txt, Open Graph meta, structured metadata
- **Mobile responsive** — works on phones, tablets, and desktop
- **Docker ready** — multi-stage Dockerfile with health checks

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3002
```

## Production Build

```bash
npm run build
npm start
```

## Docker

```bash
# Build image
docker build -t ma-bei .

# Run container
docker run -p 3002:3002 ma-bei

# With environment variables
docker run -p 3002:3002 \
  -e NEXT_PUBLIC_APP_URL=https://ma-bei.example.com \
  ma-bei
```

## Deploy on Render (Free)

This repo includes a `render.yaml` blueprint for one-click setup.

1. Push your code to GitHub
2. In Render, click **New +** -> **Blueprint**
3. Select this repository and deploy
4. Add all required environment variables from `.env.example` (and any payment/email keys you use)
5. After deploy, set `NEXT_PUBLIC_APP_URL` to your Render URL and redeploy

Notes:
- The app runs as a Docker web service on Render's assigned `PORT`
- Health checks use `/api/health`

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/products` | GET | List products. Query: `?q=`, `?category=`, `?limit=`, `?offset=` |
| `/api/supermarkets` | GET | List supermarkets with stats |
| `/api/search?q=` | GET | Quick search (min 2 chars) |
| `/api/health` | GET | Health check with uptime and data counts |

## Environment Variables

Copy `.env.example` to `.env.local`:

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Ma-bei | App display name |
| `NEXT_PUBLIC_APP_URL` | http://localhost:3002 | Canonical URL (used in sitemap/OG) |
| `DATA_SOURCE` | memory | Data backend (`memory` or `database`) |
| `CACHE_TTL` | 300 | Cache duration in seconds |
| `CRON_SECRET` | — | Required by the price scraper cron endpoints (any long random string) |
| `SCRAPE_CRON_LIMIT` | `15` | Max products scraped per cron run per store (keep low on Vercel Hobby 60s timeout) |

## Price Scraping

The default catalog in `src/data/products.ts` is **static sample data**. To
keep prices fresh against real supermarkets:

1. Switch to a database backend: set `DATA_SOURCE=database` and provision
   `DATABASE_URL`, then `npm run db:push && npm run db:seed`.
2. Set `CRON_SECRET` to a long random string in Vercel project settings.
3. Vercel Cron will hit two endpoints daily (see `vercel.json`):
   - `GET /api/cron/scrape/carrefour` — scrapes Carrefour KE's public JSON
   - `GET /api/cron/scrape/naivas`   — scrapes Naivas Online's public JSON
   Each run only processes a **batch** of products (default **15** per store)
   so the function finishes within Vercel's **60s** limit. The batch **rotates
   by UTC calendar day**, so over a week the full catalog is covered. Override
   with query params: `?limit=20&offset=40`. Set `SCRAPE_CRON_LIMIT` in Vercel
   env to change the default batch size (lower = safer on Hobby).
4. For stores without an online catalog (Cleanshelf, Chandarana, QuickMart),
   edit `data/manual-prices.csv` and trigger an import on demand:

   ```bash
   curl "https://your-app.vercel.app/api/cron/scrape/manual?secret=$CRON_SECRET"
   ```

### Confirming the scrapers work

Both scrapers ship with **two candidate JSON paths each**, because the
supermarkets' internal APIs aren't documented. Run once in dry-run mode and
inspect the response shape in the Vercel logs:

```bash
curl "https://your-app.vercel.app/api/cron/scrape/carrefour?secret=$CRON_SECRET&dryRun=1"
```

If neither path returns data, open `src/lib/scrape/carrefour.ts` (or
`naivas.ts`), adjust `SEARCH_PATHS`, and re-run.

### Politeness rules (built in)

- `User-Agent` identifies the bot and includes a contact address.
- `robots.txt` is fetched and honored (host + path + `Crawl-delay`).
- ≥2.5 s jittered delay between requests on the same host.
- One retry on 5xx, then give up.
- Out-of-bounds prices (< KES 5 or > KES 100 000) are dropped.

Stop scraping any store the moment they ask — comment out the cron entry in
`vercel.json` and redeploy.

## Project Structure

```
src/
├── app/
│   ├── api/          # REST API routes
│   │   ├── health/
│   │   ├── products/
│   │   ├── search/
│   │   └── supermarkets/
│   ├── basket/       # Basket page
│   ├── compare/      # Comparison page
│   ├── supermarket/  # Store detail page
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   ├── loading.tsx   # Loading skeleton
│   ├── not-found.tsx # 404 page
│   ├── sitemap.ts    # Dynamic sitemap
│   └── robots.ts     # robots.txt
├── components/       # UI components
├── data/             # Product & supermarket data
└── lib/
    └── store.ts      # Data access layer (swap for DB)
```

## Scaling Notes

The data access layer (`src/lib/store.ts`) abstracts all data reads. To migrate from in-memory data to a database:

1. Add your ORM/client (e.g. Prisma, Drizzle)
2. Replace the function bodies in `store.ts` with DB queries
3. Every page and API route automatically uses the new source — no other changes needed

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
