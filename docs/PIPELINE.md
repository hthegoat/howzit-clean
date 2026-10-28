# Data pipeline

Everything that keeps the forecasts fresh, and how to tell if it is working.

## Check it

**https://hwztsurf.com/status** (not linked anywhere, noindex). One page, live:

- **Verdict** at the top. Yellow = all good, pale yellow = something degraded, red = broken.
- **Checks**: each graded ok / warn / fail with 14 days of history. A white
  square means the health check itself didn't run that day.
- **Jobs**: the last run of every edge function. `killed` means it died
  mid-run (timeout or crash) and never reported back.
- **Spots with gaps**: exactly which spots are missing what.

Alerts (Discord/Slack webhook or email) fire at 07:00 and 19:00 UTC when a
check fails or changes state. Secrets: `ALERT_WEBHOOK_URL`, or
`RESEND_API_KEY` + `ALERT_EMAIL`.

## Moving parts

| Job | Schedule (UTC) | What it does |
|-----|----------------|--------------|
| `ingest-openmeteo` | 05:30 + 17:30, 10 batches of 15 | Open-Meteo + ECMWF + WW3, blended |
| `ingest-openmeteo` retry | :52 every odd hour | Re-runs spots missing WW3 in the last 12h |
| `generate-all-summaries` | 06:00 + 18:00, 15 batches of 10 | Haiku summaries, in each spot's local time |
| `ingest-buoys` | hourly | NOAA NDBC |
| `ingest-tides` | every 6h | NOAA CO-OPS |
| `pipeline-health` | 07:00 + 19:00 | Grades checks, sends alerts |

WW3 comes from PacIOOS ERDDAP first. When PacIOOS doesn't answer (it hangs on
some Supabase IPs), it falls back to NOAA GFS-Wave via Open-Meteo, which is
the same WAVEWATCH III model. The run log says which source was used.

## Change it

- **Add a health check**: add a row to the `VALUES` block in
  `pipeline_health_snapshot()` (supabase/migrations/2026-10-20-pipeline-status.sql).
  It shows up on /status and in alerts automatically.
- **Add a pipeline function**: copy the `startRun` / `finishRun` block from
  any existing function, call `startRun` first and `finishRun` last. It shows
  up under Jobs automatically.
- **Deploy functions from `supabase/functions/`**. That folder is the source of
  truth for what's deployed.
- **Cron**: `SELECT jobname, schedule FROM cron.job ORDER BY jobname;`
  Layout is in supabase/migrations/2026-10-20-cron-schedule.sql.

## Run something by hand

From the Supabase SQL editor, reuse a cron job's command so you never paste
a key:

```sql
DO $$ DECLARE t text; BEGIN
  SELECT command INTO t FROM cron.job WHERE jobname = 'ingest-openmeteo-retry';
  EXECUTE t;
END $$;
```

Regenerate one spot's summary: POST `{ "spot_id": "<uuid>" }` to
`generate-all-summaries`.

## Running /status locally

`/api/status` uses the service role key, so `.env` needs
`SUPABASE_SERVICE_ROLE_KEY` (the same one `/api/open-stats` uses).
