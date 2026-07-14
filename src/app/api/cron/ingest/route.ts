import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getConnector } from "@/lib/ingestion/connectors";
import { runIngestion } from "@/lib/ingestion/pipeline";
import type { SourceRow } from "@/lib/ingestion/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/ingest — run all enabled connectors.
 * Protected by CRON_SECRET (Authorization: Bearer <secret>), for use with
 * Vercel Cron or any external scheduler when not running scripts/ingest.ts.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { rows } = await getPool().query<SourceRow>(
    "SELECT * FROM sources WHERE enabled ORDER BY id"
  );

  const results: Record<string, unknown> = {};
  for (const source of rows) {
    try {
      results[source.key] = await runIngestion(getConnector(source.connector), source);
    } catch (err) {
      results[source.key] = { error: err instanceof Error ? err.message : String(err) };
    }
  }
  return NextResponse.json({ ok: true, results });
}
