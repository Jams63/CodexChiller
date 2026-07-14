import { searchJobs, getFacets } from "@/lib/jobs";
import { SearchBar } from "@/components/SearchBar";
import { Filters } from "@/components/Filters";
import { JobCard } from "@/components/JobCard";
import { Pagination } from "@/components/Pagination";
import { SaveSearchForm } from "@/components/SaveSearchForm";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const params = {
    q: first(sp.q),
    city: first(sp.city),
    category: first(sp.category),
    experience: first(sp.experience),
    jobType: first(sp.jobType),
    company: first(sp.company),
    salaryMin: first(sp.salaryMin),
    page: first(sp.page),
  };

  const [result, facets] = await Promise.all([
    searchJobs({
      q: params.q,
      city: params.city,
      category: params.category,
      experience: params.experience,
      jobType: params.jobType,
      company: params.company,
      salaryMin: params.salaryMin ? Number(params.salaryMin) : undefined,
      page: params.page ? Number(params.page) : 1,
    }),
    getFacets(),
  ]);

  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-r from-[#8a1538] to-[#5e0e26] p-6 text-white shadow">
        <h1 className="text-xl font-bold sm:text-2xl">Find your next job in Qatar</h1>
        <p className="mt-1 text-sm text-white/80">
          Fresh listings from multiple job boards — updated daily, never older than 2 months.
        </p>
        <div className="mt-4">
          <SearchBar params={params} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <Filters params={params} facets={facets} />

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              <strong>{result.total.toLocaleString()}</strong>{" "}
              {result.total === 1 ? "job" : "jobs"}
              {params.q ? (
                <>
                  {" "}
                  for “<span className="font-medium">{params.q}</span>”
                </>
              ) : null}
              {params.city ? ` in ${params.city}` : " across Qatar"} · newest first
            </p>
            <SaveSearchForm query={params} />
          </div>

          {result.jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              <p className="font-medium">No jobs match your search.</p>
              <p className="mt-1 text-sm">
                Try removing a filter, or subscribe above to get a WhatsApp alert when
                matching jobs appear.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {result.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          <Pagination
            params={params}
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
          />
        </section>
      </div>
    </div>
  );
}
