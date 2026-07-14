import { getPool } from "../db";
import { searchJobs, type JobFilters, type JobRow } from "../jobs";
import { sendWhatsApp } from "./whatsapp";

interface SavedSearchRow {
  id: string;
  name: string | null;
  query: JobFilters;
  last_notified_at: string;
  whatsapp_phone: string;
}

/**
 * For every active saved search: find jobs first seen since the last
 * notification, send one WhatsApp digest, and advance the watermark.
 * Run after each ingestion cycle (scripts/notify.ts or your scheduler).
 */
export async function notifySavedSearches(): Promise<{ sent: number; checked: number }> {
  const pool = getPool();
  const { rows } = await pool.query<SavedSearchRow>(
    `SELECT ss.id, ss.name, ss.query, ss.last_notified_at, u.whatsapp_phone
       FROM saved_searches ss
       JOIN users u ON u.id = ss.user_id
      WHERE ss.active AND u.whatsapp_phone IS NOT NULL`
  );

  let sent = 0;
  for (const ss of rows) {
    const result = await searchJobs({ ...ss.query, page: 1, pageSize: 5 });
    const fresh = await filterFirstSeenAfter(result.jobs, ss.last_notified_at);
    if (fresh.length === 0) continue;

    const ok = await sendDigest(ss, fresh);
    if (ok) {
      await pool.query(
        "UPDATE saved_searches SET last_notified_at = now() WHERE id = $1",
        [ss.id]
      );
      sent++;
    }
  }
  return { sent, checked: rows.length };
}

/** Keep only jobs the aggregator first saw after the watermark. */
async function filterFirstSeenAfter(jobs: JobRow[], watermark: string): Promise<JobRow[]> {
  if (jobs.length === 0) return [];
  const pool = getPool();
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM jobs WHERE id = ANY($1) AND first_seen_at > $2`,
    [jobs.map((j) => j.id), watermark]
  );
  const freshIds = new Set(rows.map((r) => r.id));
  return jobs.filter((j) => freshIds.has(j.id));
}

async function sendDigest(ss: SavedSearchRow, jobs: JobRow[]): Promise<boolean> {
  const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
  const label = ss.name || ss.query.q || "your saved search";
  const lines = jobs
    .map((j) => `• ${j.title} — ${j.company_name} (${j.location_city})\n  ${base}/jobs/${j.id}`)
    .join("\n");
  const body =
    `🇶🇦 New Qatar jobs matching "${label}":\n\n${lines}\n\n` +
    `Reply STOP to unsubscribe.`;
  const res = await sendWhatsApp(ss.whatsapp_phone, body);
  if (!res.ok) console.error(`whatsapp send failed for ${ss.id}: ${res.detail}`);
  return res.ok;
}
