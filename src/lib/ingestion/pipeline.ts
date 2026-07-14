import { getPool } from "../db";
import {
  dedupeHash,
  inferCategory,
  inferExperienceLevel,
  normalizeCity,
  parseSalary,
} from "./normalize";
import type { Connector, IngestStats, NormalizedJob, SourceRow } from "./types";

/** Listings older than this are never ingested and get expired from the feed. */
export const MAX_AGE_DAYS = 60;

/**
 * Run one connector: fetch → normalize → dedupe/upsert → expire stale rows.
 * Every run is recorded in ingestion_runs for the admin health view.
 */
export async function runIngestion(
  connector: Connector,
  source: SourceRow
): Promise<IngestStats> {
  const pool = getPool();
  const { rows: runRows } = await pool.query(
    "INSERT INTO ingestion_runs (source_id) VALUES ($1) RETURNING id",
    [source.id]
  );
  const runId: number = runRows[0].id;

  try {
    const jobs = await connector.fetchJobs(source);
    const stats = await upsertJobs(source, jobs);
    stats.expired = await expireStaleJobs();

    await pool.query(
      `UPDATE ingestion_runs
         SET finished_at = now(), status = 'success',
             jobs_found = $2, jobs_new = $3, jobs_updated = $4, jobs_expired = $5
       WHERE id = $1`,
      [runId, stats.found, stats.inserted, stats.updated, stats.expired]
    );
    return stats;
  } catch (err) {
    await pool.query(
      `UPDATE ingestion_runs
         SET finished_at = now(), status = 'error', error = $2
       WHERE id = $1`,
      [runId, err instanceof Error ? err.message : String(err)]
    );
    throw err;
  }
}

async function upsertJobs(source: SourceRow, jobs: NormalizedJob[]): Promise<IngestStats> {
  const pool = getPool();
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 3600 * 1000;
  const stats: IngestStats = { found: jobs.length, inserted: 0, updated: 0, expired: 0 };

  for (const job of jobs) {
    if (!job.title || !job.companyName || !job.applyUrl) continue;
    if (job.postedAt.getTime() < cutoff) continue; // freshness rule: skip anything > 2 months old

    const city = job.locationCity ?? normalizeCity(job.locationRaw);
    const hash = dedupeHash(job.title, job.companyName, city);
    const salary = parseSalary(job.description);

    const companyRows = await pool.query(
      `INSERT INTO companies (name, name_norm)
       VALUES ($1, lower(trim($1)))
       ON CONFLICT (name_norm) DO UPDATE SET name = companies.name
       RETURNING id`,
      [job.companyName.trim()]
    );
    const companyId: number = companyRows.rows[0].id;

    const res = await pool.query(
      `INSERT INTO jobs (
         source_id, external_id, dedupe_hash, title, company_id, company_name,
         description, location_city, location_raw, job_type, experience_level,
         category, salary_min, salary_max, salary_currency, salary_period,
         apply_url, posted_at, is_active
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,true)
       ON CONFLICT (dedupe_hash) DO UPDATE SET
         last_seen_at = now(),
         is_active    = true,
         -- refresh mutable fields from the latest sighting
         description  = EXCLUDED.description,
         apply_url    = EXCLUDED.apply_url,
         salary_min   = COALESCE(EXCLUDED.salary_min, jobs.salary_min),
         salary_max   = COALESCE(EXCLUDED.salary_max, jobs.salary_max),
         -- keep the earliest posted_at so reposts don't game "newest first"
         posted_at    = LEAST(jobs.posted_at, EXCLUDED.posted_at)
       RETURNING (xmax = 0) AS inserted`,
      [
        source.id,
        job.externalId,
        hash,
        job.title.trim(),
        companyId,
        job.companyName.trim(),
        job.description,
        city,
        job.locationRaw || null,
        job.jobType ?? "full-time",
        job.experienceLevel ?? inferExperienceLevel(job.title, job.description),
        job.category ?? inferCategory(job.title, job.description),
        job.salaryMin ?? salary.min ?? null,
        job.salaryMax ?? salary.max ?? null,
        job.salaryCurrency ?? "QAR",
        job.salaryPeriod ?? "month",
        job.applyUrl,
        job.postedAt.toISOString(),
      ]
    );
    if (res.rows[0].inserted) stats.inserted++;
    else stats.updated++;
  }
  return stats;
}

/** Deactivate listings older than MAX_AGE_DAYS (kept for history, hidden from feed). */
export async function expireStaleJobs(): Promise<number> {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE jobs SET is_active = false
     WHERE is_active AND posted_at < now() - make_interval(days => $1)`,
    [MAX_AGE_DAYS]
  );
  return res.rowCount ?? 0;
}
