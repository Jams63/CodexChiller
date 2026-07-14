import { query } from "./db";
import { MAX_AGE_DAYS } from "./ingestion/pipeline";

export interface JobFilters {
  q?: string;            // keyword search (title/company/description)
  city?: string;         // normalized Qatar city
  category?: string;
  experience?: string;   // entry | mid | senior | executive
  jobType?: string;      // full-time | part-time | contract | temporary | internship
  company?: string;
  salaryMin?: number;    // show jobs whose (disclosed) salary_max >= this
  page?: number;
  pageSize?: number;
}

export interface JobRow {
  id: string;
  title: string;
  company_name: string;
  description: string;
  location_city: string;
  job_type: string;
  experience_level: string;
  category: string;
  salary_min: string | null;
  salary_max: string | null;
  salary_currency: string;
  salary_period: string;
  apply_url: string;
  posted_at: string;
  source_name: string;
  source_url: string | null;
}

export interface JobSearchResult {
  jobs: JobRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Search the aggregated feed. Always restricted to active listings posted
 * within the freshness window (2 months), sorted newest first. When a keyword
 * is given, full-text rank breaks ties within the same posting day.
 */
export async function searchJobs(f: JobFilters): Promise<JobSearchResult> {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, f.pageSize ?? 20));

  const where: string[] = [
    "j.is_active",
    `j.posted_at >= now() - make_interval(days => ${MAX_AGE_DAYS})`,
  ];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };

  if (f.q?.trim()) {
    where.push(`j.search @@ websearch_to_tsquery('english', ${p(f.q.trim())})`);
  }
  if (f.city) where.push(`j.location_city = ${p(f.city)}`);
  if (f.category) where.push(`j.category = ${p(f.category)}`);
  if (f.experience) where.push(`j.experience_level = ${p(f.experience)}`);
  if (f.jobType) where.push(`j.job_type = ${p(f.jobType)}`);
  if (f.company) where.push(`lower(j.company_name) = lower(${p(f.company)})`);
  if (f.salaryMin) {
    where.push(`(j.salary_max >= ${p(f.salaryMin)} OR j.salary_min >= ${p(f.salaryMin)})`);
  }

  const whereSql = where.join(" AND ");
  const rankSql = f.q?.trim()
    ? `, ts_rank(j.search, websearch_to_tsquery('english', $1)) AS rank`
    : "";
  const orderSql = f.q?.trim()
    ? "ORDER BY date_trunc('day', j.posted_at) DESC, rank DESC, j.posted_at DESC"
    : "ORDER BY j.posted_at DESC";

  const countRows = await query<{ count: string }>(
    `SELECT count(*) AS count FROM jobs j WHERE ${whereSql}`,
    params
  );
  const total = Number(countRows[0].count);

  const jobs = await query<JobRow>(
    `SELECT j.id, j.title, j.company_name, left(j.description, 280) AS description,
            j.location_city, j.job_type, j.experience_level, j.category,
            j.salary_min, j.salary_max, j.salary_currency, j.salary_period,
            j.apply_url, j.posted_at, s.name AS source_name, s.base_url AS source_url
            ${rankSql}
       FROM jobs j
       JOIN sources s ON s.id = j.source_id
      WHERE ${whereSql}
      ${orderSql}
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    params
  );

  return { jobs, total, page, pageSize };
}

export async function getJob(id: string): Promise<(JobRow & { location_raw: string | null }) | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await query<JobRow & { location_raw: string | null }>(
    `SELECT j.id, j.title, j.company_name, j.description, j.location_city,
            j.location_raw, j.job_type, j.experience_level, j.category,
            j.salary_min, j.salary_max, j.salary_currency, j.salary_period,
            j.apply_url, j.posted_at, s.name AS source_name, s.base_url AS source_url
       FROM jobs j
       JOIN sources s ON s.id = j.source_id
      WHERE j.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Facet values for the filter sidebar (companies/cities present in the live feed). */
export async function getFacets() {
  const [cities, companies, categories] = await Promise.all([
    query<{ location_city: string; n: string }>(
      `SELECT location_city, count(*) AS n FROM jobs
        WHERE is_active AND posted_at >= now() - make_interval(days => ${MAX_AGE_DAYS})
        GROUP BY 1 ORDER BY count(*) DESC, 1`
    ),
    query<{ company_name: string; n: string }>(
      `SELECT company_name, count(*) AS n FROM jobs
        WHERE is_active AND posted_at >= now() - make_interval(days => ${MAX_AGE_DAYS})
        GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 30`
    ),
    query<{ category: string; n: string }>(
      `SELECT category, count(*) AS n FROM jobs
        WHERE is_active AND posted_at >= now() - make_interval(days => ${MAX_AGE_DAYS})
        GROUP BY 1 ORDER BY count(*) DESC, 1`
    ),
  ]);
  return {
    cities: cities.map((r) => ({ value: r.location_city, count: Number(r.n) })),
    companies: companies.map((r) => ({ value: r.company_name, count: Number(r.n) })),
    categories: categories.map((r) => ({ value: r.category, count: Number(r.n) })),
  };
}
