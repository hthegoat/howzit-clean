-- Spots whose last 12h of ingest is missing WW3 (or missing entirely).
-- Used by ingest-openmeteo's retry pass ({ "retry": true }), which cron runs
-- at :52 every odd hour. After a good ingest nothing qualifies.
-- Oct 20, 2026 (already applied)
CREATE OR REPLACE FUNCTION spots_needing_refetch(max_spots integer DEFAULT 30)
RETURNS TABLE(id uuid, name text, latitude double precision, longitude double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id, s.name, s.latitude::double precision, s.longitude::double precision
  FROM spots s
  WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM forecasts f
      WHERE f.spot_id = s.id
        AND f.fetched_at > now() - interval '12 hours'
        AND f.ww3_wave_height IS NOT NULL
    )
  ORDER BY s.name
  LIMIT max_spots;
$$;
REVOKE ALL ON FUNCTION spots_needing_refetch(integer) FROM PUBLIC, anon, authenticated;
