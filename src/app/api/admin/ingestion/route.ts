import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/admin/ingestion — per-source health: last run, counts, live jobs. */
export async function GET() {
  const rows = await query(
    `SELECT s.key, s.name, s.connector, s.enabled,
            r.started_at AS last_run_at, r.status AS last_status, r.error AS last_error,
            r.jobs_found, r.jobs_new, r.jobs_updated,
            (SELECT count(*) FROM jobs j
              WHERE j.source_id = s.id AND j.is_active
                AND j.posted_at >= now() - interval '60 days') AS live_jobs
       FROM sources s
       LEFT JOIN LATERAL (
         SELECT * FROM ingestion_runs ir
          WHERE ir.source_id = s.id
          ORDER BY ir.started_at DESC LIMIT 1
       ) r ON true
      ORDER BY s.id`
  );
  return NextResponse.json({ sources: rows });
}
