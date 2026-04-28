# PriceSnap — Supermarket Price Comparison

Compare grocery prices across Kenyan supermarkets. Find the cheapest deals, build a shopping basket, and see exactly how much you save.

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

# Open http://localhost:3000
```

## Production Build

```bash
npm run build
npm start
```

## Docker

```bash
# Build image
docker build -t pricesnap .

# Run container
docker run -p 3000:3000 pricesnap

# With environment variables
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APP_URL=https://pricesnap.example.com \
  pricesnap
```

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
| `NEXT_PUBLIC_APP_NAME` | PriceSnap | App display name |
| `NEXT_PUBLIC_APP_URL` | http://localhost:3000 | Canonical URL (used in sitemap/OG) |
| `DATA_SOURCE` | memory | Data backend (`memory` or `database`) |
| `CACHE_TTL` | 300 | Cache duration in seconds |

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
