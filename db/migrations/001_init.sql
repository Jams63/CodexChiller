-- QatarJobs initial schema
-- Conventions:
--  * All timestamps are timestamptz (UTC).
--  * Jobs are deduped across sources via dedupe_hash (title+company+city).
--  * Full-text search via a generated tsvector column + GIN index.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Sources: one row per connector configuration (Bayt RSS, sample feed, ...)
-- ---------------------------------------------------------------------------
CREATE TABLE sources (
  id          serial PRIMARY KEY,
  key         text NOT NULL UNIQUE,          -- machine key, e.g. "sample-qatar"
  name        text NOT NULL,                 -- display name, e.g. "Qatar Living Jobs"
  connector   text NOT NULL,                 -- connector implementation: "rss" | "sample" | ...
  base_url    text,                          -- site homepage, for attribution links
  config      jsonb NOT NULL DEFAULT '{}',   -- connector-specific config (feed URL, etc.)
  enabled     boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Companies: normalized from incoming listings
-- ---------------------------------------------------------------------------
CREATE TABLE companies (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  name_norm  text NOT NULL UNIQUE,           -- lower(trim(name)), dedupe key
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Jobs: the aggregated feed
-- ---------------------------------------------------------------------------
CREATE TABLE jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        integer NOT NULL REFERENCES sources(id),
  external_id      text,                     -- id/guid of the listing at the source
  dedupe_hash      text NOT NULL UNIQUE,     -- md5(title|company|city), cross-source dedupe
  title            text NOT NULL,
  company_id       integer REFERENCES companies(id),
  company_name     text NOT NULL,
  description      text NOT NULL DEFAULT '',
  location_city    text NOT NULL DEFAULT 'Doha',   -- normalized Qatar municipality/city
  location_raw     text,                            -- location string as published
  job_type         text NOT NULL DEFAULT 'full-time'
                   CHECK (job_type IN ('full-time','part-time','contract','temporary','internship')),
  experience_level text NOT NULL DEFAULT 'mid'
                   CHECK (experience_level IN ('entry','mid','senior','executive')),
  category         text NOT NULL DEFAULT 'other',
  salary_min       numeric,                  -- QAR/month when disclosed
  salary_max       numeric,
  salary_currency  text NOT NULL DEFAULT 'QAR',
  salary_period    text NOT NULL DEFAULT 'month'
                   CHECK (salary_period IN ('month','year','day','hour')),
  apply_url        text NOT NULL,            -- link back to the original posting
  posted_at        timestamptz NOT NULL,
  first_seen_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  is_active        boolean NOT NULL DEFAULT true,
  search           tsvector GENERATED ALWAYS AS (
                     setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                     setweight(to_tsvector('english', coalesce(company_name, '')), 'B') ||
                     setweight(to_tsvector('english', coalesce(description, '')), 'C')
                   ) STORED
);

CREATE INDEX jobs_search_idx        ON jobs USING gin (search);
CREATE INDEX jobs_posted_at_idx     ON jobs (posted_at DESC);
CREATE INDEX jobs_category_idx      ON jobs (category);
CREATE INDEX jobs_city_idx          ON jobs (location_city);
CREATE INDEX jobs_experience_idx    ON jobs (experience_level);
CREATE INDEX jobs_job_type_idx      ON jobs (job_type);
CREATE INDEX jobs_company_idx       ON jobs (company_id);
CREATE INDEX jobs_source_ext_idx    ON jobs (source_id, external_id);

-- ---------------------------------------------------------------------------
-- Ingestion runs: one row per connector execution (admin health view)
-- ---------------------------------------------------------------------------
CREATE TABLE ingestion_runs (
  id           serial PRIMARY KEY,
  source_id    integer NOT NULL REFERENCES sources(id),
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  status       text NOT NULL DEFAULT 'running'
               CHECK (status IN ('running','success','error')),
  jobs_found   integer NOT NULL DEFAULT 0,
  jobs_new     integer NOT NULL DEFAULT 0,
  jobs_updated integer NOT NULL DEFAULT 0,
  jobs_expired integer NOT NULL DEFAULT 0,
  error        text
);

CREATE INDEX ingestion_runs_source_idx ON ingestion_runs (source_id, started_at DESC);

-- ---------------------------------------------------------------------------
-- Users + saved searches (WhatsApp notifications)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text UNIQUE,
  whatsapp_phone text UNIQUE,                -- E.164, e.g. +9745xxxxxxx
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE saved_searches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             text,
  query            jsonb NOT NULL DEFAULT '{}',  -- {q, city, category, experience, jobType, company, salaryMin}
  channel          text NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp')),
  active           boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX saved_searches_active_idx ON saved_searches (active) WHERE active;
