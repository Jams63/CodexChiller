import { QATAR_CITIES } from "@/lib/ingestion/normalize";

/**
 * Google Jobs-style keyword + location search. Plain GET form so results are
 * fully server-rendered and shareable via URL. Non-search filters already in
 * the URL are preserved through hidden inputs.
 */
export function SearchBar({ params }: { params: Record<string, string | undefined> }) {
  const preserved = Object.entries(params).filter(
    ([k, v]) => v && !["q", "city", "page"].includes(k)
  );

  return (
    <form action="/" method="get" className="flex flex-col gap-2 sm:flex-row">
      {preserved.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input
        type="search"
        name="q"
        defaultValue={params.q ?? ""}
        placeholder="Job title, company, or keyword…"
        className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm shadow-sm outline-none focus:border-[#8a1538] focus:ring-2 focus:ring-[#8a1538]/20"
      />
      <select
        name="city"
        defaultValue={params.city ?? ""}
        className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-[#8a1538] sm:w-44"
      >
        <option value="">All of Qatar</option>
        {QATAR_CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-11 rounded-lg bg-[#8a1538] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6f102d] sm:w-32"
      >
        Search
      </button>
    </form>
  );
}
