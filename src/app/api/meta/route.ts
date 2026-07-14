import { NextResponse } from "next/server";
import { getFacets } from "@/lib/jobs";
import { CATEGORY_LABELS, QATAR_CITIES } from "@/lib/ingestion/normalize";

export const dynamic = "force-dynamic";

/** GET /api/meta — filter facets (cities, categories, companies) for the UI. */
export async function GET() {
  const facets = await getFacets();
  return NextResponse.json({
    ...facets,
    allCities: QATAR_CITIES,
    categoryLabels: CATEGORY_LABELS,
  });
}
