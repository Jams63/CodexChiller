# QatarJobs — Qatar job classifieds aggregator

A Google Jobs-style aggregator focused exclusively on Qatar: publicly listed
jobs from multiple sources in one searchable feed. Listings are never older
than 2 months, always sorted newest first, and every job links back to the
original posting to apply.

## Features

- **Aggregated feed** from pluggable per-source connectors (RSS + fixture sample today; see `docs/DATA_SOURCES.md` for the source roadmap and ToS research)
- **Freshness**: only jobs posted within the last 60 days; older listings auto-expire
- **Search**: Postgres full-text search (keyword) + location, Google Jobs style
- **Filters**: category/industry, experience level, job type, salary (when disclosed), city, company
- **Job detail pages** with an Apply link to the original source
- **Cross-source dedupe** by normalized title + company + city
- **WhatsApp alerts** (optional): save a search, get a digest when new matches arrive (Twilio or Meta Cloud API)
- **Admin view** at `/admin` for per-source ingestion health

## Stack

Next.js 15 (App Router, SSR) · Tailwind CSS 4 · PostgreSQL 16 · Node 22

## Quick start

```bash
npm install
cp .env.example .env            # set DATABASE_URL

# create the database (adjust to your setup)
createdb qatarjobs

npm run db:migrate              # apply db/migrations/*.sql
npm run ingest                  # run all enabled connectors (sample data works offline)
npm run dev                     # http://localhost:3000
```

## Ingestion

Connectors live in `src/lib/ingestion/connectors/` and implement one interface
(`fetchJobs(source) → NormalizedJob[]`). The pipeline
(`src/lib/ingestion/pipeline.ts`) normalizes city/category/experience/salary,
dedupes across sources, upserts, and expires listings older than 60 days.
Sources are configured as rows in the `sources` table.

Scheduling options:

- `npm run ingest:watch` — long-running loop, every `INGEST_INTERVAL_MINUTES` (default 180)
- `GET /api/cron/ingest` with `Authorization: Bearer $CRON_SECRET` — for Vercel Cron or any external scheduler
- plain cron: `0 */3 * * * cd /app && npm run ingest && npm run notify`

## WhatsApp notifications

Set `WHATSAPP_PROVIDER=twilio` or `meta` plus the provider credentials in `.env`
(see `.env.example`). With the provider unset, digests are logged to stdout
instead of sent — safe for development. `npm run notify` checks each saved
search for jobs first seen since its last notification and sends one digest.

Note for Meta Cloud API: production alerts outside a 24-hour session require a
pre-approved message template.

## Project layout

```
db/migrations/            SQL schema (jobs, sources, companies, users, saved_searches, ingestion_runs)
docs/DATA_SOURCES.md      Source availability + ToS research — read before enabling sources
scripts/                  migrate / ingest / notify CLIs
src/lib/ingestion/        connector framework, normalization, dedupe pipeline
src/lib/jobs.ts           search & filter query layer
src/lib/notifications/    WhatsApp senders (Twilio/Meta) + saved-search matcher
src/app/                  pages (feed, job detail, admin) + API routes
```

## API

- `GET /api/jobs?q=&city=&category=&experience=&jobType=&company=&salaryMin=&page=`
- `GET /api/jobs/:id`
- `GET /api/meta` — filter facets
- `POST /api/saved-searches` — `{ whatsappPhone, query }`
- `GET /api/admin/ingestion` — source health
- `GET /api/cron/ingest` — run connectors (Bearer `CRON_SECRET`)

## Adding a source connector

1. Implement `Connector` (see `src/lib/ingestion/connectors/sample.ts`)
2. Register it in `connectors/index.ts`
3. `INSERT INTO sources (key, name, connector, config, enabled) VALUES (...)`
4. Check `docs/DATA_SOURCES.md` — confirm API terms / ToS before enabling
