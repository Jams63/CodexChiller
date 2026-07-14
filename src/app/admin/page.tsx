import { query } from "@/lib/db";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ingestion health" };

interface SourceHealth {
  key: string;
  name: string;
  connector: string;
  enabled: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  jobs_found: number | null;
  jobs_new: number | null;
  jobs_updated: number | null;
  live_jobs: string;
}

/**
 * Minimal ingestion-health dashboard. Read-only, per-source last-run status.
 * NOTE: add auth (or protect the /admin path at the proxy) before production.
 */
export default async function AdminPage() {
  const sources = await query<SourceHealth>(
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

  return (
    <div>
      <h1 className="text-xl font-bold">Ingestion health</h1>
      <p className="mt-1 text-sm text-slate-500">
        Last run per source. Run connectors with <code>npm run ingest</code> or the{" "}
        <code>/api/cron/ingest</code> endpoint.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Connector</th>
              <th className="px-4 py-3">Enabled</th>
              <th className="px-4 py-3">Last run</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Found</th>
              <th className="px-4 py-3">New</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Live jobs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sources.map((s) => (
              <tr key={s.key}>
                <td className="px-4 py-3 font-medium">
                  {s.name}
                  <div className="text-xs font-normal text-slate-400">{s.key}</div>
                </td>
                <td className="px-4 py-3">{s.connector}</td>
                <td className="px-4 py-3">{s.enabled ? "✅" : "—"}</td>
                <td className="px-4 py-3">{s.last_run_at ? timeAgo(s.last_run_at) : "never"}</td>
                <td className="px-4 py-3">
                  {s.last_status === "success" && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      success
                    </span>
                  )}
                  {s.last_status === "error" && (
                    <span
                      className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                      title={s.last_error ?? ""}
                    >
                      error
                    </span>
                  )}
                  {s.last_status === "running" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      running
                    </span>
                  )}
                  {!s.last_status && <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">{s.jobs_found ?? "—"}</td>
                <td className="px-4 py-3">{s.jobs_new ?? "—"}</td>
                <td className="px-4 py-3">{s.jobs_updated ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{s.live_jobs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sources.some((s) => s.last_error) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <h2 className="font-semibold">Last errors</h2>
          <ul className="mt-2 space-y-1">
            {sources
              .filter((s) => s.last_error)
              .map((s) => (
                <li key={s.key}>
                  <strong>{s.key}:</strong> {s.last_error}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
