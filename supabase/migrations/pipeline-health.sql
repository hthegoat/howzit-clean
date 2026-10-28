-- Pipeline health monitoring
-- Aug 14, 2026
--
-- Background: the two worst outages on this project were both silent. AI
-- summaries ran against a retired model alias for months, and WW3 returned
-- HTTP 200 with NaN values for land cells so no error handler ever fired.
-- Passive safeguards ("don't overwrite good data on failure") preserved the
-- stale data and told nobody. This gives the pipeline an active heartbeat.
--
-- Companion pieces:
--   supabase/functions/pipeline-health/index.ts  - reads this, alerts on it
--   supabase/migrations/pipeline-health-cron.sql - schedules the daily run

-- ---------------------------------------------------------------------------
-- History table. One row per check per run, so trends are visible rather than
-- just the current snapshot.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pipeline_health (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at timestamptz NOT NULL DEFAULT now(),
  check_name text        NOT NULL,
  status     text        NOT NULL,
  observed   integer     NOT NULL,
  expected   integer     NOT NULL,
  detail     text
);

CREATE INDEX IF NOT EXISTS pipeline_health_checked_at_idx
  ON public.pipeline_health USING btree (checked_at DESC);

CREATE INDEX IF NOT EXISTS pipeline_health_name_time_idx
  ON public.pipeline_health USING btree (check_name, checked_at DESC);

-- RLS on with no policies: operational data, service role only. The edge
-- function uses the service key, which bypasses RLS. Nothing client-side
-- should be able to read this.
ALTER TABLE public.pipeline_health ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- The check itself. Writes a run into pipeline_health and returns it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_pipeline_health()
 RETURNS TABLE(check_name text, status text, observed integer, expected integer, detail text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  run_at        timestamptz := now();
  total_spots   integer;
  buoy_expected integer;
  tide_expected integer;
BEGIN
  SELECT count(*) INTO total_spots FROM spots;
  SELECT count(DISTINCT s.buoy_id) INTO buoy_expected
    FROM spots s WHERE s.buoy_id IS NOT NULL;
  SELECT count(*) INTO tide_expected
    FROM spots s WHERE s.tide_station_id IS NOT NULL;

  -- Every check is an observed/expected pair graded against a warn and a
  -- fail ratio, so the thresholds all live in one readable block.
  INSERT INTO pipeline_health (checked_at, check_name, status, observed, expected, detail)
  SELECT
    run_at,
    c.name,
    CASE
      WHEN c.expected = 0                               THEN 'ok'
      WHEN c.observed < ceil(c.expected * c.fail_ratio) THEN 'fail'
      WHEN c.observed < ceil(c.expected * c.warn_ratio) THEN 'warn'
      ELSE 'ok'
    END,
    c.observed,
    c.expected,
    c.detail
  FROM (
    VALUES
      -- Primary source. Anything short of full coverage is real.
      ('openmeteo_coverage',
       (SELECT count(DISTINCT f.spot_id)::int FROM forecasts f
         WHERE f.fetched_at > run_at - interval '24 hours'),
       total_spots, 0.98, 0.95,
       'Spots with any forecast row fetched in the last 24h'),

      -- Went to zero in Aug 2026 and nothing noticed for a week.
      ('ww3_coverage',
       (SELECT count(DISTINCT f.spot_id)::int FROM forecasts f
         WHERE f.ww3_wave_height IS NOT NULL
           AND f.fetched_at > run_at - interval '24 hours'),
       total_spots, 0.95, 0.90,
       'Spots with WaveWatch III data fetched in the last 24h'),

      -- Ten spots are known-bad land cells, hence the looser floor.
      ('ecmwf_coverage',
       (SELECT count(DISTINCT f.spot_id)::int FROM forecasts f
         WHERE f.ecmwf_wave_height IS NOT NULL
           AND f.fetched_at > run_at - interval '24 hours'),
       total_spots, 0.92, 0.85,
       'Spots with ECMWF data fetched in the last 24h'),

      -- Model comparison is the differentiated feature. Track it directly.
      ('three_model_spots',
       (SELECT count(DISTINCT f.spot_id)::int FROM forecasts f
         WHERE f.blend_model_count = 3
           AND f.fetched_at > run_at - interval '24 hours'),
       total_spots, 0.92, 0.85,
       'Spots with all three models available to compare'),

      -- Ran on a retired model alias for months, silently.
      ('ai_summaries',
       (SELECT count(DISTINCT ss.spot_id)::int FROM spot_summaries ss
         WHERE ss.generated_at > run_at - interval '36 hours'),
       total_spots, 0.98, 0.95,
       'Spots with a summary generated in the last 36h'),

      -- Some buoys are legitimately offline, so the floor is lower.
      ('buoy_readings',
       (SELECT count(DISTINCT br.buoy_id)::int FROM buoy_readings br
         WHERE br.fetched_at > run_at - interval '3 hours'),
       buoy_expected, 0.90, 0.75,
       'Assigned buoys reporting in the last 3h'),

      -- Tides have no fetched_at, so freshness means: is there still
      -- future tide data left to draw?
      ('tide_coverage',
       (SELECT count(DISTINCT t.spot_id)::int FROM tides t
         WHERE t.timestamp > run_at),
       tide_expected, 0.98, 0.95,
       'Spots with future tide predictions on hand')
  ) AS c(name, observed, expected, warn_ratio, fail_ratio, detail);

  RETURN QUERY
  SELECT ph.check_name, ph.status, ph.observed, ph.expected, ph.detail
  FROM pipeline_health ph
  WHERE ph.checked_at = run_at
  ORDER BY
    CASE ph.status WHEN 'fail' THEN 0 WHEN 'warn' THEN 1 ELSE 2 END,
    ph.check_name;
END;
$function$;
