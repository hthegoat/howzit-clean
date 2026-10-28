-- Schedule the daily pipeline health check
-- Aug 14, 2026
--
-- Runs at 07:00 UTC, which sits after the morning ingest (05:30-05:42) and
-- after summary generation (06:00-06:28), so it grades a fresh run rather
-- than yesterday's data.
--
-- NOTE ON THE AUTH HEADER: this script deliberately does not contain the
-- service role key. It lifts the headers literal out of an existing cron job
-- instead, so the file is safe to commit. Requires at least one
-- ingest-openmeteo-am-0 job to already exist.

DO $$
DECLARE
  template     text;
  headers_json text;
  new_cmd      text;
BEGIN
  SELECT command INTO template FROM cron.job WHERE jobname = 'ingest-openmeteo-am-0';

  IF template IS NULL THEN
    RAISE EXCEPTION 'No ingest-openmeteo-am-0 job to borrow auth headers from';
  END IF;

  headers_json := substring(template from 'headers := (''.*?'')::jsonb');
  IF headers_json IS NULL THEN
    headers_json := substring(template from 'headers := (''.*?'')');
  END IF;

  new_cmd := format(
    'SELECT net.http_post(url := %L, headers := %s, body := %L::jsonb, timeout_milliseconds := 25000)',
    'https://jfirkpnvakogqphlmfoi.supabase.co/functions/v1/pipeline-health',
    headers_json,
    '{}'
  );

  PERFORM cron.schedule('pipeline-health-daily', '0 7 * * *', new_cmd);
END $$;

-- Verify
SELECT jobname, schedule, active,
       (command LIKE '%pipeline-health%') AS targets_health_fn
FROM cron.job WHERE jobname = 'pipeline-health-daily';
