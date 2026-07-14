import Link from "next/link";

export function Pagination({
  params,
  page,
  pageSize,
  total,
}: {
  params: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage === 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/?${s}` : "/";
  };

  const btn = "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50";
  return (
    <nav className="mt-6 flex items-center justify-between">
      {page > 1 ? (
        <Link href={href(page - 1)} className={btn}>
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-slate-500">
        Page {page} of {lastPage}
      </span>
      {page < lastPage ? (
        <Link href={href(page + 1)} className={btn}>
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
