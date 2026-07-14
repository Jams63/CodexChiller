import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/ingestion/normalize";
import { EXPERIENCE_LABELS, JOB_TYPE_LABELS } from "@/lib/format";

type Params = Record<string, string | undefined>;

function buildHref(params: Params, key: string, value?: string): string {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && k !== key && k !== "page") next.set(k, v);
  }
  if (value) next.set(key, value);
  const qs = next.toString();
  return qs ? `/?${qs}` : "/";
}

function FilterGroup({
  title,
  paramKey,
  params,
  options,
}: {
  title: string;
  paramKey: string;
  params: Params;
  options: Array<{ value: string; label: string; count?: number }>;
}) {
  const active = params[paramKey];
  if (options.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <ul className="space-y-1">
        {options.map((o) => {
          const isActive = active === o.value;
          return (
            <li key={o.value}>
              <Link
                href={buildHref(params, paramKey, isActive ? undefined : o.value)}
                className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                  isActive
                    ? "bg-[#8a1538]/10 font-medium text-[#8a1538]"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{o.label}</span>
                {o.count !== undefined && (
                  <span className="text-xs text-slate-400">{o.count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const SALARY_STEPS = [5000, 10000, 15000, 20000, 30000];

export function Filters({
  params,
  facets,
}: {
  params: Params;
  facets: {
    cities: Array<{ value: string; count: number }>;
    companies: Array<{ value: string; count: number }>;
    categories: Array<{ value: string; count: number }>;
  };
}) {
  const activeFilters = ["category", "experience", "jobType", "company", "salaryMin", "city", "q"]
    .filter((k) => params[k])
    .map((k) => k);

  return (
    <aside className="space-y-6">
      {activeFilters.length > 0 && (
        <Link
          href="/"
          className="inline-block rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          ✕ Clear all filters
        </Link>
      )}
      <FilterGroup
        title="Category"
        paramKey="category"
        params={params}
        options={facets.categories.map((c) => ({
          value: c.value,
          label: CATEGORY_LABELS[c.value] ?? c.value,
          count: c.count,
        }))}
      />
      <FilterGroup
        title="Experience level"
        paramKey="experience"
        params={params}
        options={Object.entries(EXPERIENCE_LABELS).map(([value, label]) => ({ value, label }))}
      />
      <FilterGroup
        title="Job type"
        paramKey="jobType"
        params={params}
        options={Object.entries(JOB_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
      />
      <FilterGroup
        title="Minimum salary (QAR/mo)"
        paramKey="salaryMin"
        params={params}
        options={SALARY_STEPS.map((s) => ({
          value: String(s),
          label: `${s.toLocaleString()}+`,
        }))}
      />
      <FilterGroup
        title="Location"
        paramKey="city"
        params={params}
        options={facets.cities.map((c) => ({ value: c.value, label: c.value, count: c.count }))}
      />
      <FilterGroup
        title="Company"
        paramKey="company"
        params={params}
        options={facets.companies
          .slice(0, 12)
          .map((c) => ({ value: c.value, label: c.value, count: c.count }))}
      />
    </aside>
  );
}
