/**
 * Ingestion runner.
 *
 * Usage:
 *   npm run ingest                 # run all enabled sources once
 *   npm run ingest -- sample-qatar # run one source by key
 *   npm run ingest:watch           # run every INGEST_INTERVAL_MINUTES (default 180)
 *
 * In production, schedule this via cron/systemd, or hit /api/cron/ingest
 * from Vercel Cron / any external scheduler.
 */
import { getPool } from "../src/lib/db";
import { getConnector } from "../src/lib/ingestion/connectors";
import { runIngestion } from "../src/lib/ingestion/pipeline";
import type { SourceRow } from "../src/lib/ingestion/types";

async function runAll(onlyKey?: string) {
  const pool = getPool();
  const { rows } = await pool.query<SourceRow>(
    onlyKey
      ? "SELECT * FROM sources WHERE key = $1"
      : "SELECT * FROM sources WHERE enabled ORDER BY id",
    onlyKey ? [onlyKey] : []
  );
  if (rows.length === 0) {
    console.error(onlyKey ? `no source with key "${onlyKey}"` : "no enabled sources");
    process.exitCode = 1;
    return;
  }

  for (const source of rows) {
    const started = Date.now();
    try {
      const connector = getConnector(source.connector);
      const stats = await runIngestion(connector, source);
      console.log(
        `[${source.key}] ok in ${Date.now() - started}ms — found=${stats.found} new=${stats.inserted} updated=${stats.updated} expired=${stats.expired}`
      );
    } catch (err) {
      console.error(`[${source.key}] FAILED:`, err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const watch = args.includes("--watch");
  const onlyKey = args.find((a) => !a.startsWith("-"));

  if (!watch) {
    await runAll(onlyKey);
    await getPool().end();
    return;
  }

  const intervalMin = Number(process.env.INGEST_INTERVAL_MINUTES || 180);
  console.log(`watch mode: ingesting every ${intervalMin} minutes`);
  // Simple loop; sequential runs never overlap.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await runAll(onlyKey);
    await new Promise((r) => setTimeout(r, intervalMin * 60_000));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
