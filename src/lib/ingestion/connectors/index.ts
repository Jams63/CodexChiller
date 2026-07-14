import type { Connector } from "../types";
import { rssConnector } from "./rss";
import { sampleConnector } from "./sample";

/**
 * Connector registry. To add a source:
 *  1. Implement the Connector interface (see rss.ts / sample.ts).
 *  2. Register it here.
 *  3. Insert a row into `sources` with connector = its kind and any config.
 *
 * Planned connectors (see docs/DATA_SOURCES.md for ToS notes before enabling):
 *  - bayt        (HTML scrape — requires ToS review)
 *  - qatarliving (HTML scrape — requires ToS review)
 *  - gulftalent  (HTML scrape — requires ToS review)
 *  - googlejobs  (Google Custom Search JSON API — needs API key + CSE id)
 */
const registry: Record<string, Connector> = {
  [rssConnector.kind]: rssConnector,
  [sampleConnector.kind]: sampleConnector,
};

export function getConnector(kind: string): Connector {
  const c = registry[kind];
  if (!c) throw new Error(`unknown connector kind: ${kind}`);
  return c;
}
