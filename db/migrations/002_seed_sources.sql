-- Seed connector configurations.
-- The sample source is enabled by default so the app works out of the box.
-- Real sources ship disabled until feed URLs / ToS are confirmed per
-- docs/DATA_SOURCES.md — enable with: UPDATE sources SET enabled = true WHERE key = '...';

INSERT INTO sources (key, name, connector, base_url, config, enabled) VALUES
  ('sample-qatar', 'Qatar Sample Feed', 'sample', 'https://example-jobs.qa', '{}', true),
  ('bayt-qatar', 'Bayt.com Qatar', 'rss', 'https://www.bayt.com/en/qatar/',
   '{"feedUrl": "", "companyFromTitle": " - ", "companyFallback": "Via Bayt.com"}', false),
  ('qatarliving-jobs', 'Qatar Living Jobs', 'rss', 'https://www.qatarliving.com/jobs',
   '{"feedUrl": "", "companyFallback": "Via Qatar Living"}', false)
ON CONFLICT (key) DO NOTHING;
