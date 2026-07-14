import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/saved-searches — save a search and subscribe to WhatsApp alerts.
 * Body: { whatsappPhone: "+974...", email?, name?, query: {q?, city?, category?, experience?, jobType?, company?, salaryMin?} }
 *
 * No auth for v1: the WhatsApp phone number is the identity. A verification
 * step (send a confirm code via WhatsApp) should be added before production.
 */
export async function POST(req: NextRequest) {
  let body: {
    whatsappPhone?: string;
    email?: string;
    name?: string;
    query?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const phone = (body.whatsappPhone ?? "").trim();
  if (!/^\+\d{8,15}$/.test(phone)) {
    return NextResponse.json(
      { error: "whatsappPhone must be E.164, e.g. +9745xxxxxxx" },
      { status: 400 }
    );
  }
  const searchQuery = body.query ?? {};

  const pool = getPool();
  const userRows = await pool.query(
    `INSERT INTO users (whatsapp_phone, email)
     VALUES ($1, $2)
     ON CONFLICT (whatsapp_phone) DO UPDATE SET email = COALESCE(EXCLUDED.email, users.email)
     RETURNING id`,
    [phone, body.email?.trim() || null]
  );

  const rows = await pool.query(
    `INSERT INTO saved_searches (user_id, name, query)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userRows.rows[0].id, body.name?.trim() || null, JSON.stringify(searchQuery)]
  );

  return NextResponse.json({ ok: true, savedSearchId: rows.rows[0].id });
}
