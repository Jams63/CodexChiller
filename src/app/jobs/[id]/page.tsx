import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getJob } from "@/lib/jobs";
import { CATEGORY_LABELS } from "@/lib/ingestion/normalize";
import { EXPERIENCE_LABELS, JOB_TYPE_LABELS, formatSalary, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Job not found" };
  return {
    title: `${job.title} at ${job.company_name} — ${job.location_city}`,
    description: job.description.slice(0, 160),
  };
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period);

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to all jobs
      </Link>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{job.title}</h1>
            <p className="mt-1 text-slate-600">
              {job.company_name} · {job.location_raw ?? job.location_city}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Posted {timeAgo(job.posted_at)} · via {job.source_name}
            </p>
          </div>
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded-lg bg-[#8a1538] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6f102d]"
          >
            Apply on {job.source_name} ↗
          </a>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Fact label="Job type" value={JOB_TYPE_LABELS[job.job_type] ?? job.job_type} />
          <Fact
            label="Experience"
            value={EXPERIENCE_LABELS[job.experience_level] ?? job.experience_level}
          />
          <Fact label="Category" value={CATEGORY_LABELS[job.category] ?? job.category} />
          <Fact label="Salary" value={salary ?? "Not disclosed"} />
        </dl>

        <hr className="my-6 border-slate-200" />

        <h2 className="mb-2 font-semibold text-slate-900">Job description</h2>
        <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {job.description || "No description provided — see the original posting."}
        </div>

        <div className="mt-8 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
          This listing was aggregated from {job.source_name}. QatarJobs is not the
          employer and does not process applications — use the Apply button to reach
          the original posting.
        </div>
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
    </div>
  );
}
