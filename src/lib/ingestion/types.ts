/** Common normalized job shape every connector must produce. */
export interface NormalizedJob {
  /** Stable id of the listing at the source (guid, url, ...) */
  externalId: string;
  title: string;
  companyName: string;
  description: string;
  /** Location string exactly as published by the source */
  locationRaw: string;
  /** Normalized Qatar city/municipality (see normalize.ts) */
  locationCity?: string;
  jobType?: "full-time" | "part-time" | "contract" | "temporary" | "internship";
  experienceLevel?: "entry" | "mid" | "senior" | "executive";
  category?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: "month" | "year" | "day" | "hour";
  applyUrl: string;
  postedAt: Date;
}

export interface SourceRow {
  id: number;
  key: string;
  name: string;
  connector: string;
  base_url: string | null;
  config: Record<string, unknown>;
  enabled: boolean;
}

/** A connector fetches raw listings from one source and normalizes them. */
export interface Connector {
  /** Machine name matching sources.connector in the DB */
  readonly kind: string;
  fetchJobs(source: SourceRow): Promise<NormalizedJob[]>;
}

export interface IngestStats {
  found: number;
  inserted: number;
  updated: number;
  expired: number;
}
