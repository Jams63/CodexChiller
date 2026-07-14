import { NextRequest, NextResponse } from "next/server";
import { searchJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

/**
 * GET /api/jobs — search the aggregated feed.
 * Query params: q, city, category, experience, jobType, company, salaryMin, page, pageSize
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const result = await searchJobs({
      q: sp.get("q") ?? undefined,
      city: sp.get("city") ?? undefined,
      category: sp.get("category") ?? undefined,
      experience: sp.get("experience") ?? undefined,
      jobType: sp.get("jobType") ?? undefined,
      company: sp.get("company") ?? undefined,
      salaryMin: sp.get("salaryMin") ? Number(sp.get("salaryMin")) : undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/jobs failed:", err);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }
}
