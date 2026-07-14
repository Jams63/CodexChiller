import { XMLParser } from "fast-xml-parser";
import { htmlToText } from "../normalize";
import type { Connector, NormalizedJob, SourceRow } from "../types";

/**
 * Generic RSS/Atom connector for job boards that publish feeds.
 *
 * Source config (sources.config jsonb):
 *   { "feedUrl": "https://example.com/jobs.rss",
 *     "companyFallback": "Unknown",          // when the feed has no company field
 *     "companyFromTitle": " - " }            // split "Title - Company" on this separator
 *
 * Works for any standards-compliant RSS 2.0 / Atom feed. Per-board quirks
 * (company embedded in title, location in category tags) are handled via config.
 */
export const rssConnector: Connector = {
  kind: "rss",

  async fetchJobs(source: SourceRow): Promise<NormalizedJob[]> {
    const feedUrl = source.config.feedUrl as string | undefined;
    if (!feedUrl) throw new Error(`source ${source.key}: config.feedUrl missing`);

    const res = await fetch(feedUrl, {
      headers: { "user-agent": "QatarJobsAggregator/0.1 (+jobs feed reader)" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`feed fetch failed: HTTP ${res.status}`);
    const xml = await res.text();

    const parser = new XMLParser({ ignoreAttributes: false });
    const doc = parser.parse(xml);

    // RSS 2.0: rss.channel.item[]; Atom: feed.entry[]
    const rawItems: unknown[] = doc?.rss?.channel?.item
      ? [].concat(doc.rss.channel.item)
      : doc?.feed?.entry
        ? [].concat(doc.feed.entry)
        : [];

    const jobs: NormalizedJob[] = [];
    for (const raw of rawItems) {
      const item = raw as Record<string, any>;
      const title: string = text(item.title);
      const link: string =
        text(item.link) || item.link?.["@_href"] || text(item.guid) || "";
      const descriptionHtml: string =
        text(item["content:encoded"]) || text(item.description) || text(item.summary) || "";
      const pub =
        text(item.pubDate) || text(item.published) || text(item.updated) || "";
      const postedAt = pub ? new Date(pub) : new Date();
      if (!title || !link || Number.isNaN(postedAt.getTime())) continue;

      // Company: dedicated tag if present, else split from title, else fallback.
      let jobTitle = title;
      let companyName =
        text(item["dc:creator"]) || text(item.author?.name) || text(item.author) || "";
      const sep = source.config.companyFromTitle as string | undefined;
      if (!companyName && sep && title.includes(sep)) {
        const idx = title.lastIndexOf(sep);
        jobTitle = title.slice(0, idx).trim();
        companyName = title.slice(idx + sep.length).trim();
      }
      if (!companyName) {
        companyName = (source.config.companyFallback as string) || source.name;
      }

      // Location: many feeds put it in <category> tags; fall back to Doha.
      const categories: string[] = item.category
        ? [].concat(item.category).map((c: any) => text(c) || c?.["@_term"] || "")
        : [];
      const locationRaw = categories.find((c) => /doha|qatar|wakrah|rayyan|khor|lusail/i.test(c)) || "Qatar";

      jobs.push({
        externalId: text(item.guid) || link,
        title: jobTitle,
        companyName,
        description: htmlToText(descriptionHtml),
        locationRaw,
        applyUrl: link,
        postedAt,
      });
    }
    return jobs;
  },
};

/** fast-xml-parser may return strings or {#text} objects depending on attributes. */
function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as object)) {
    return String((v as Record<string, unknown>)["#text"]).trim();
  }
  return "";
}
