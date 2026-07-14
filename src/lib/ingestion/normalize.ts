import { createHash } from "node:crypto";
import type { NormalizedJob } from "./types";

/** Qatar municipalities/cities we normalize locations into. */
export const QATAR_CITIES = [
  "Doha",
  "Al Rayyan",
  "Al Wakrah",
  "Al Khor",
  "Umm Salal",
  "Al Daayen",
  "Al Shamal",
  "Al Shahaniya",
  "Lusail",
  "Mesaieed",
  "Dukhan",
  "Ras Laffan",
] as const;

export const CATEGORIES = [
  "construction",
  "hospitality",
  "oil-gas",
  "it",
  "healthcare",
  "finance",
  "education",
  "engineering",
  "logistics",
  "retail",
  "admin",
  "marketing",
  "legal",
  "other",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  construction: "Construction",
  hospitality: "Hospitality & Tourism",
  "oil-gas": "Oil & Gas / Energy",
  it: "IT & Software",
  healthcare: "Healthcare",
  finance: "Finance & Accounting",
  education: "Education",
  engineering: "Engineering",
  logistics: "Logistics & Transport",
  retail: "Retail & Sales",
  admin: "Admin & HR",
  marketing: "Marketing & Media",
  legal: "Legal",
  other: "Other",
};

/** Map a free-form location string to a normalized Qatar city. Defaults to Doha. */
export function normalizeCity(raw: string | undefined | null): string {
  if (!raw) return "Doha";
  const lc = raw.toLowerCase();
  for (const city of QATAR_CITIES) {
    if (lc.includes(city.toLowerCase())) return city;
  }
  if (/\bwakra\b/.test(lc)) return "Al Wakrah";
  if (/\brayyan\b/.test(lc)) return "Al Rayyan";
  if (/\bkhor\b/.test(lc)) return "Al Khor";
  return "Doha";
}

const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/civil|construction|site engineer|foreman|scaffold|mason|carpenter|surveyor|hvac|mep\b|architect/i, "construction"],
  [/hotel|hospitality|chef|barista|waiter|waitress|housekeep|restaurant|f&b|steward|concierge|tourism/i, "hospitality"],
  [/oil|gas|petro|drilling|refinery|offshore|lng|pipeline|rig\b|energy/i, "oil-gas"],
  [/software|developer|engineer.*(software|devops|data|cloud)|\bit\b|programmer|frontend|backend|full[- ]?stack|sysadmin|network engineer|cyber|devops|data scientist|analyst.*data/i, "it"],
  [/nurse|doctor|physician|medical|pharmac|dentist|radiolog|healthcare|clinic|lab technician|physiotherap/i, "healthcare"],
  [/accountant|finance|auditor|banking|treasury|payroll|tax\b|investment/i, "finance"],
  [/teacher|tutor|professor|lecturer|education|academic|school|curriculum/i, "education"],
  [/mechanical|electrical|instrumentation|process engineer|qa\/qc|quality engineer|maintenance engineer/i, "engineering"],
  [/driver|logistics|warehouse|supply chain|procurement|forklift|dispatcher|freight|courier/i, "logistics"],
  [/sales|retail|cashier|merchandiser|store keeper|shop assistant|business development/i, "retail"],
  [/\bhr\b|human resources|admin|receptionist|secretary|office manager|clerk|document controller/i, "admin"],
  [/marketing|social media|content|designer|seo\b|brand|public relations|media/i, "marketing"],
  [/lawyer|legal|paralegal|compliance officer|contracts specialist/i, "legal"],
];

/** Infer a category from title/description when the source doesn't provide one. */
export function inferCategory(title: string, description = ""): string {
  const text = `${title} ${description.slice(0, 500)}`;
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(text)) return cat;
  }
  return "other";
}

/** Infer experience level from the job title (fallback: mid). */
export function inferExperienceLevel(
  title: string,
  description = ""
): NormalizedJob["experienceLevel"] {
  const t = title.toLowerCase();
  if (/chief|\bcxo\b|\bceo\b|\bcfo\b|\bcoo\b|\bcto\b|\bvp\b|vice president|director|head of|general manager/.test(t)) {
    return "executive";
  }
  if (/senior|sr\.?\s|lead|principal|manager|supervisor|specialist iii/.test(t)) {
    return "senior";
  }
  if (/junior|jr\.?\s|trainee|intern|graduate|entry|fresher|assistant\b/.test(t)) {
    return "entry";
  }
  const d = description.toLowerCase();
  if (/(0|1)\s*[-–to]+\s*2\s*years|no experience|fresh graduate/.test(d)) return "entry";
  if (/(8|9|10|12|15)\+?\s*years/.test(d)) return "senior";
  return "mid";
}

/**
 * Parse a salary range from free text, e.g. "QAR 8,000 - 12,000 per month".
 * Returns monthly QAR amounts when a match is found.
 */
export function parseSalary(text: string): { min?: number; max?: number } {
  const m = text.match(
    /(?:qar|qr|riyal)s?\.?\s*([\d,]{3,})(?:\s*[-–to]+\s*(?:qar|qr)?\s*([\d,]{3,}))?/i
  );
  if (!m) return {};
  const min = Number(m[1].replace(/,/g, ""));
  const max = m[2] ? Number(m[2].replace(/,/g, "")) : undefined;
  if (!Number.isFinite(min) || min < 100) return {};
  return { min, max };
}

/** Cross-source dedupe key: same title + company + city = same job. */
export function dedupeHash(title: string, companyName: string, city: string): string {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return createHash("md5")
    .update(`${norm(title)}|${norm(companyName)}|${norm(city)}`)
    .digest("hex");
}

/** Strip HTML tags to plain text (job descriptions arrive as HTML from RSS). */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
