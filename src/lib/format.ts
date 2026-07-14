export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) {
    const hours = Math.max(1, Math.floor(ms / 3_600_000));
    return `${hours}h ago`;
  }
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} month${days >= 60 ? "s" : ""} ago`;
}

export function formatSalary(
  min: string | null,
  max: string | null,
  currency = "QAR",
  period = "month"
): string | null {
  const fmt = (v: string) => Number(v).toLocaleString("en-US");
  const per = period === "month" ? "/mo" : period === "year" ? "/yr" : `/${period}`;
  if (min && max) return `${currency} ${fmt(min)}–${fmt(max)}${per}`;
  if (min) return `${currency} ${fmt(min)}+${per}`;
  if (max) return `up to ${currency} ${fmt(max)}${per}`;
  return null;
}

export const EXPERIENCE_LABELS: Record<string, string> = {
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior",
  executive: "Executive",
};

export const JOB_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
};
