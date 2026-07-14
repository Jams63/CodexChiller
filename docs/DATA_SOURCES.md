# Data sources — availability & ToS research

Status of each candidate source for the Qatar jobs aggregator, researched July 2026.
**Re-verify ToS and robots.txt for each source before enabling its connector in
production** — job boards change their access policies frequently.

## Summary

| Source | Official API? | RSS? | Status in this repo |
|---|---|---|---|
| Indeed Qatar | ❌ Publisher API deprecated (2023), employer-side APIs only | ❌ removed | Not planned |
| Bayt.com | ❌ no public API | ⚠️ historically per-search RSS; unverified | `rss` connector seeded, **disabled** until feed URL + ToS confirmed |
| Qatar Living Jobs | ❌ no public API | ⚠️ Drupal-based, may expose feeds | `rss` connector seeded, **disabled** |
| GulfTalent | ❌ partner integrations only | ❌ | Would need scraping — ToS review required |
| Naukrigulf | ❌ no public API | ❌ | Would need scraping — ToS review required |
| Google Custom Search JSON API | ✅ with API key + CSE id | n/a | Planned `googlejobs` connector (100 free queries/day, then paid) |
| Qatar Ministry of Labour | ❌ no open-data jobs API found | ❌ | Monitor <https://www.mol.gov.qa> and Qatar Open Data portal |
| Kawader (gov. national employment platform) | ❌ no public API found | ❌ | Monitor |

## Details

### Indeed
The Indeed Publisher/Job Search API was deprecated in 2023 and is closed to new
integrations. All current Indeed APIs (Job Sync, Indeed Apply, Disposition Sync,
Sponsored Jobs) are employer/ATS-side — none expose job search. **Do not scrape
Indeed**: their ToS explicitly prohibit it and they actively block scrapers.

### Bayt.com
No public developer API. Bayt has historically exposed RSS feeds for search
result pages. The `bayt-qatar` source row is seeded with the generic `rss`
connector but disabled and with an empty `feedUrl`. To enable: confirm a working
feed URL from a Qatar search page, review <https://www.bayt.com/en/terms-and-conditions/>
(their ToS restrict automated access — RSS existence implies consent to feed
consumption, but confirm), then set the URL and flip `enabled`.

### Qatar Living Jobs
Community classifieds site (Drupal). No API. Check for `/rss.xml` style feeds on
the jobs section. ToS review required before scraping; attribute and link back.

### GulfTalent / Naukrigulf
No public APIs; both prohibit unauthorized scraping in their ToS. Options:
partnership/data-licensing outreach, or exclude. A Playwright-based scraper is
technically straightforward but **should not be enabled without written
permission** — flagged as a legal risk, not implemented.

### Google Custom Search JSON API
Legitimate, documented API. Create a Programmable Search Engine scoped to job
posting pages (e.g. site restricts on the boards above), then query with
`q=<keyword> jobs qatar`. Limits: 100 queries/day free, $5 per 1,000 after,
10k/day cap. Results are search snippets, not structured job data — a planned
`googlejobs` connector would parse JobPosting JSON-LD from result URLs (fetching
the canonical page a search result points to is generally acceptable, but apply
per-domain robots.txt rules).

Note: "Google for Jobs" itself has **no public consumer API** — the Cloud Talent
Solution API is for employers/job boards to *supply* data, not read it.

### Government / open data
Qatar's Open Data portal (<https://www.data.gov.qa>) has labour-market
statistics but no live job-postings dataset as of this research. Kawader
(national employment platform) has no public API. Worth monitoring; a
government feed would be the cleanest source in this list.

## General scraping policy for this project

1. Prefer RSS/API. Scraping is a last resort, per-site, after ToS + robots.txt review.
2. Respect robots.txt and rate limits (1 req/s max, off-peak schedules).
3. Always store and display attribution; every listing links back to the source
   via `apply_url` — we never host the application flow.
4. Store only listing metadata needed for search; don't republish full pages.
5. Honor takedown requests: `UPDATE sources SET enabled=false` + deactivate its jobs.
