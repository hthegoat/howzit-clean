-- Cron layout as of Oct 20, 2026 (already applied; kept for the record).
-- Auth headers are lifted from an existing job so this file holds no keys.
--
--   ingest-openmeteo-am-0..9   05:30-05:48 UTC, every 2 min, { offset: i*15, limit: 15 }
--   ingest-openmeteo-pm-0..9   17:30-17:48 UTC, same batches
--   ingest-openmeteo-retry     :52 every odd hour, { retry: true }
--   ingest-openmeteo-retry-am-1 / -pm-1   05:56 / 17:56, second retry
--   generate-summaries-am/pm-0..14        06:00 / 18:00 UTC (unchanged)
--   ingest-buoys               hourly, now with a 150s pg_net timeout
--   ingest-tides               every 6h at :10, now with a 150s pg_net timeout
--   pipeline-health-daily      07:00 UTC
--   pipeline-health-evening    19:00 UTC
--   purge-pipeline-runs        04:15 UTC, keeps 30 days
--
-- To check: SELECT jobname, schedule FROM cron.job ORDER BY jobname;

DO $$
DECLARE
  template text; headers_json text; i int; cmd text;
BEGIN
  SELECT command INTO template FROM cron.job WHERE jobname = 'ingest-openmeteo-am-0';
  headers_json := substring(template from 'headers := (''.*?'')::jsonb');
  IF headers_json IS NULL THEN RAISE EXCEPTION 'could not lift headers'; END IF;

  FOR i IN 0..9 LOOP
    cmd := format(
      'SELECT net.http_post(url := %L, headers := %s::jsonb, body := %L::jsonb, timeout_milliseconds := 150000)',
      'https://jfirkpnvakogqphlmfoi.supabase.co/functions/v1/ingest-openmeteo',
      headers_json, format('{"offset": %s, "limit": 15}', i * 15));
    PERFORM cron.schedule('ingest-openmeteo-am-' || i, format('%s 5 * * *', 30 + i * 2), cmd);
    PERFORM cron.schedule('ingest-openmeteo-pm-' || i, format('%s 17 * * *', 30 + i * 2), cmd);
  END LOOP;

  cmd := format('SELECT net.http_post(url := %L, headers := %s::jsonb, body := %L::jsonb, timeout_milliseconds := 150000)',
    'https://jfirkpnvakogqphlmfoi.supabase.co/functions/v1/ingest-openmeteo', headers_json, '{"retry": true}');
  PERFORM cron.schedule('ingest-openmeteo-retry', '52 1-23/2 * * *', cmd);
  PERFORM cron.schedule('ingest-openmeteo-retry-am-1', '56 5 * * *', cmd);
  PERFORM cron.schedule('ingest-openmeteo-retry-pm-1', '56 17 * * *', cmd);

  SELECT command INTO cmd FROM cron.job WHERE jobname = 'pipeline-health-daily';
  PERFORM cron.schedule('pipeline-health-evening', '0 19 * * *', cmd);

  PERFORM cron.schedule('purge-pipeline-runs', '15 4 * * *',
    $q$DELETE FROM pipeline_runs WHERE started_at < now() - interval '30 days'$q$);
END $$;
