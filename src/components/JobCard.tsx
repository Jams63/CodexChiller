import Link from "next/link";
import type { JobRow } from "@/lib/jobs";
import { CATEGORY_LABELS } from "@/lib/ingestion/normalize";
import { EXPERIENCE_LABELS, JOB_TYPE_LABELS, formatSalary, timeAgo } from "@/lib/format";

export function JobCard({ job }: { job: JobRow }) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period);
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#8a1538]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">{job.title}</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {job.company_name} · {job.location_city}
          </p>
        </div>
        <span className="shrink-0 text-xs text-slate-400">{timeAgo(job.posted_at)}</span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{job.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <Badge>{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</Badge>
        <Badge>{EXPERIENCE_LABELS[job.experience_level] ?? job.experience_level}</Badge>
        <Badge>{CATEGORY_LABELS[job.category] ?? job.category}</Badge>
        {salary && <Badge tone="green">{salary}</Badge>}
        <span className="ml-auto text-slate-400">via {job.source_name}</span>
      </div>
    </Link>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "green" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 font-medium ${
        tone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {children}
    </span>
  );
}
