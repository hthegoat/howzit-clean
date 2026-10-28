-- Pipeline status: run log, live health snapshot, spot timezones
-- Oct 20, 2026 (already applied)
--
-- Three things live here:
--   1. pipeline_runs: every edge function writes one row per invocation.
--      A row stuck in 'running' means the function was killed mid-run
--      (546 / 504), which is exactly the failure that went unnoticed for
--      8 days in Oct 2026.
--   2. pipeline_health_snapshot(): the graded checks, computed live and
--      side-effect free. check_pipeline_health() (the cron) now just
--      stores a snapshot, and /status reads one live.
--   3. spots.timezone: so summaries and .md endpoints speak local time.

-- 1. Run log -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job          text NOT NULL,
  batch        text,
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  status       text NOT NULL DEFAULT 'running',  -- running | ok | partial | error
  processed    integer,
  failed       integer,
  error        text,
  summary      jsonb
);

CREATE INDEX IF NOT EXISTS pipeline_runs_job_started_idx
  ON pipeline_runs (job, started_at DESC);

ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (edge functions, /api/status) touches it.

-- 2. Spot timezones -------------------------------------------------------------

ALTER TABLE spots ADD COLUMN IF NOT EXISTS timezone text;

UPDATE spots SET timezone = CASE
  WHEN state = 'Hawaii'                    THEN 'Pacific/Honolulu'
  WHEN state IN ('California', 'Oregon')   THEN 'America/Los_Angeles'
  WHEN state = 'Florida' AND longitude < -85.0 THEN 'America/Chicago'  -- Panhandle
  ELSE 'America/New_York'
END
WHERE timezone IS NULL;

ALTER TABLE spots ALTER COLUMN timezone SET DEFAULT 'America/New_York';
ALTER TABLE spots ALTER COLUMN timezone SET NOT NULL;

-- 3. Live health snapshot ------------------------------------------------------
-- Thresholds all live in this one VALUES block. To add a check, add a row.

CREATE OR REPLACE FUNCTION pipeline_health_snapshot()
RETURNS TABLE(check_name text, status text, observed integer, expected integer, detail text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  run_at        timestamptz := now();
  total_spots   integer;
  buoy_expected integer;
  tide_expected integer;
  runs_expected integer;
BEGIN
  SELECT count(*) INTO total_spots FROM spots;
  SELECT count(DISTINCT s.buoy_id) INTO buoy_expected
    FROM spots s WHERE s.buoy_id IS NOT NULL;
  SELECT count(*) INTO tide_expected
    FROM spots s WHERE s.tide_station_id IS NOT NULL;
  -- Runs that should have finished by now (anything still 'running' after
  -- 10 minutes was killed).
  SELECT count(*) INTO runs_expected FROM pipeline_runs r
    WHERE r.started_at > run_at - interval '24 hours'
      AND r.started_at < run_at - interval '10 minutes';

  RETURN QUERY
  SELECT
    c.name,
    CASE
      WHEN c.exp = 0                          THEN 'ok'
      WHEN c.obs < ceil(c.exp * c.fail_ratio) THEN 'fail'
      WHEN c.obs < ceil(c.exp * c.warn_ratio) THEN 'warn'
      ELSE 'ok'
    END,
    c.obs,
    c.exp,
    c.detail
  FROM (
    VALUES
      ('openmeteo_coverage',
       (SELECT count(DISTINCT f.spot_id)::int FROM forecasts f
         WHERE f.fetched_at > run_at - interval '24 hours'),
       total_spots, 0.98, 0.95,
       'Spots with any forecast row fetched in the last 24h'),

      ('ww3_coverage',
       (SELECT count(DISTINCT f.spot_id)::int FROM forecasts f
         WHERE f.ww3_wave_height IS NOT NULL
           AND f.fetched_at > run_at - interval '24 hours'),
       total_spots, 0.95, 0.90,
       'Spots with WaveWatch III data fetched in the last 24h'),

      ('ecmwf_coverage',
       (SELECT count(DISTINCT f.spot_id)::int FROM forecasts f
         WHERE f.ecmwf_wave_height IS NOT NULL
           AND f.fetched_at > run_at - interval '24 hours'),
       total_spots, 0.92, 0.85,
       'Spots with ECMWF data fetched in the last 24h'),

      ('three_model_spots',
       (SELECT count(DISTINCT f.spot_id)::int FROM forecasts f
         WHERE f.blend_model_count = 3
           AND f.fetched_at > run_at - interval '24 hours'),
       total_spots, 0.92, 0.85,
       'Spots with all three models available to compare'),

      ('ai_summaries',
       (SELECT count(DISTINCT ss.spot_id)::int FROM spot_summaries ss
         WHERE ss.generated_at > run_at - interval '36 hours'),
       total_spots, 0.98, 0.95,
       'Spots with a summary generated in the last 36h'),

      ('buoy_readings',
       (SELECT count(DISTINCT br.buoy_id)::int FROM buoy_readings br
         WHERE br.fetched_at > run_at - interval '3 hours'),
       buoy_expected, 0.90, 0.75,
       'Assigned buoys reporting in the last 3h'),

      ('tide_coverage',
       (SELECT count(DISTINCT t.spot_id)::int FROM tides t
         WHERE t.timestamp > run_at),
       tide_expected, 0.98, 0.95,
       'Spots with future tide predictions on hand'),

      -- Catches functions dying mid-run (546/504), which the coverage
      -- checks only notice a day later.
      ('job_runs',
       (SELECT count(*)::int FROM pipeline_runs r
         WHERE r.started_at > run_at - interval '24 hours'
           AND r.started_at < run_at - interval '10 minutes'
           AND r.status <> 'running'),
       runs_expected, 0.98, 0.90,
       'Edge function runs in the last 24h that finished instead of being killed')
  ) AS c(name, obs, exp, warn_ratio, fail_ratio, detail)
  ORDER BY
    CASE WHEN c.exp > 0 AND c.obs < ceil(c.exp * c.fail_ratio) THEN 0
         WHEN c.exp > 0 AND c.obs < ceil(c.exp * c.warn_ratio) THEN 1
         ELSE 2 END,
    c.name;
END;
$function$;

-- The cron entry point: store a snapshot, return it.
CREATE OR REPLACE FUNCTION check_pipeline_health()
RETURNS TABLE(check_name text, status text, observed integer, expected integer, detail text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  run_at timestamptz := now();
BEGIN
  INSERT INTO pipeline_health (checked_at, check_name, status, observed, expected, detail)
  SELECT run_at, s.check_name, s.status, s.observed, s.expected, s.detail
  FROM pipeline_health_snapshot() s;

  RETURN QUERY
  SELECT ph.check_name, ph.status, ph.observed, ph.expected, ph.detail
  FROM pipeline_health ph
  WHERE ph.checked_at = run_at
  ORDER BY
    CASE ph.status WHEN 'fail' THEN 0 WHEN 'warn' THEN 1 ELSE 2 END,
    ph.check_name;
END;
$function$;

-- 4. Everything /status needs, in one call --------------------------------------

CREATE OR REPLACE FUNCTION get_pipeline_status()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'generated_at', now(),

    'checks', (SELECT coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
               FROM pipeline_health_snapshot() s),

    -- Worst status per check per day, last 14 days, for the history strip
    'history', (
      SELECT coalesce(jsonb_object_agg(h.check_name, h.days), '{}'::jsonb)
      FROM (
        SELECT d.check_name,
               jsonb_agg(jsonb_build_object('day', d.day, 'status', d.status) ORDER BY d.day) AS days
        FROM (
          SELECT ph.check_name,
                 (ph.checked_at AT TIME ZONE 'UTC')::date AS day,
                 CASE max(CASE ph.status WHEN 'fail' THEN 2 WHEN 'warn' THEN 1 ELSE 0 END)
                   WHEN 2 THEN 'fail' WHEN 1 THEN 'warn' ELSE 'ok' END AS status
          FROM pipeline_health ph
          WHERE ph.checked_at > now() - interval '14 days'
          GROUP BY 1, 2
        ) d
        GROUP BY d.check_name
      ) h
    ),

    -- Latest run of every job/batch, plus how its last 24h went
    'jobs', (
      SELECT coalesce(jsonb_agg(j ORDER BY j->>'job', j->>'batch'), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'job', l.job,
          'batch', l.batch,
          'started_at', l.started_at,
          'finished_at', l.finished_at,
          'status', CASE WHEN l.status = 'running' AND l.started_at < now() - interval '10 minutes'
                         THEN 'killed' ELSE l.status END,
          'processed', l.processed,
          'failed', l.failed,
          'error', l.error,
          'runs_24h', (SELECT count(*) FROM pipeline_runs r
                        WHERE r.job = l.job AND r.batch IS NOT DISTINCT FROM l.batch
                          AND r.started_at > now() - interval '24 hours'),
          'bad_24h', (SELECT count(*) FROM pipeline_runs r
                       WHERE r.job = l.job AND r.batch IS NOT DISTINCT FROM l.batch
                         AND r.started_at > now() - interval '24 hours'
                         AND (r.status = 'error'
                              OR (r.status = 'running' AND r.started_at < now() - interval '10 minutes')))
        ) AS j
        FROM (
          SELECT DISTINCT ON (job, batch) *
          FROM pipeline_runs
          WHERE started_at > now() - interval '3 days'
          ORDER BY job, batch, started_at DESC
        ) l
      ) x
    ),

    -- Spots that are missing something right now, by name
    'problem_spots', (
      WITH f24 AS (
        SELECT spot_id,
               bool_or(ww3_wave_height IS NOT NULL)   AS has_ww3,
               bool_or(ecmwf_wave_height IS NOT NULL) AS has_ecmwf
        FROM forecasts
        WHERE fetched_at > now() - interval '24 hours'
        GROUP BY spot_id
      ),
      s36 AS (
        SELECT DISTINCT spot_id FROM spot_summaries
        WHERE generated_at > now() - interval '36 hours'
      ),
      b24 AS (
        SELECT DISTINCT buoy_id FROM buoy_readings
        WHERE fetched_at > now() - interval '24 hours' AND wave_height IS NOT NULL
      ),
      tfut AS (
        SELECT DISTINCT spot_id FROM tides WHERE timestamp > now()
      ),
      flagged AS (
        SELECT s.name, s.slug, s.state,
          array_remove(ARRAY[
            CASE WHEN f.spot_id IS NULL THEN 'no forecast 24h' END,
            CASE WHEN f.spot_id IS NOT NULL AND NOT f.has_ww3   THEN 'no WW3' END,
            CASE WHEN f.spot_id IS NOT NULL AND NOT f.has_ecmwf THEN 'no ECMWF' END,
            CASE WHEN sm.spot_id IS NULL THEN 'no summary 36h' END,
            CASE WHEN s.buoy_id IS NOT NULL AND b.buoy_id IS NULL
                 THEN 'buoy ' || s.buoy_id || ' no waves' END,
            CASE WHEN s.tide_station_id IS NOT NULL AND t.spot_id IS NULL
                 THEN 'no future tides' END
          ], NULL) AS issues
        FROM spots s
        LEFT JOIN f24  f  ON f.spot_id  = s.id
        LEFT JOIN s36  sm ON sm.spot_id = s.id
        LEFT JOIN b24  b  ON b.buoy_id  = s.buoy_id
        LEFT JOIN tfut t  ON t.spot_id  = s.id
      )
      SELECT coalesce(jsonb_agg(jsonb_build_object(
               'name', name, 'slug', slug, 'state', state, 'issues', to_jsonb(issues))
             ORDER BY state, name), '[]'::jsonb)
      FROM flagged
      WHERE cardinality(issues) > 0
    ),

    'freshness', jsonb_build_object(
      'forecast', (SELECT max(fetched_at) FROM forecasts),
      'buoy',     (SELECT max(fetched_at) FROM buoy_readings),
      'summary',  (SELECT max(generated_at) FROM spot_summaries),
      'tides_until', (SELECT max(timestamp) FROM tides)
    ),

    'last_alert_check', (SELECT max(checked_at) FROM pipeline_health)
  );
$function$;

REVOKE ALL ON FUNCTION get_pipeline_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION pipeline_health_snapshot() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION check_pipeline_health() FROM PUBLIC, anon, authenticated;
