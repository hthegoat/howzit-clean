import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

// ============================================
// TIME BUDGET
// ============================================
// Supabase kills a function at 150s wall clock (546 / 504), and a killed run
// saves nothing after the point it died. In Oct 2026 that happened to 3 of 5
// batches a day for over a week. So: every fetch has a timeout, spots run a
// few at a time, and we stop STARTING new spots once the budget is spent and
// report what was skipped instead of dying silently.
const TIME_BUDGET_MS = 110_000;
const CONCURRENCY = 3;
const OM_TIMEOUT_MS = 15_000;
const ECMWF_TIMEOUT_MS = 15_000;
const WW3_TIMEOUT_MS = 12_000;

// ============================================
// RUN LOG (pipeline_runs, read by /status)
// ============================================
// A row is written at start and closed at the end. A row still 'running'
// after 10 minutes means the function was killed. Same 15 lines live in every
// pipeline function; keep them in sync.
async function startRun(sb: SupabaseClient, job: string, batch: string | null) {
  const { data } = await sb.from("pipeline_runs").insert({ job, batch }).select("id").single();
  return (data?.id as string) ?? null;
}
async function finishRun(sb: SupabaseClient, id: string | null, f: {
  status: "ok" | "partial" | "error"; processed?: number; failed?: number; error?: string | null; summary?: unknown;
}) {
  if (!id) return;
  await sb.from("pipeline_runs").update({
    finished_at: new Date().toISOString(),
    status: f.status, processed: f.processed ?? null, failed: f.failed ?? null,
    error: f.error ? String(f.error).slice(0, 500) : null, summary: f.summary ?? null,
  }).eq("id", id);
}

// ============================================
// BLENDING ALGORITHM v3 - Open-Meteo Primary
// ============================================
// Rationale: Global models (WW3, ECMWF) consistently over-forecast
// for nearshore East Coast spots. Open-Meteo's higher resolution
// coastal data is more accurate for beach breaks. WW3/ECMWF are
// used for confidence validation, not primary signal.
// ============================================
function blendForecasts(ww3: number | null, openMeteo: number | null, ecmwf: number | null): {
  value: number | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  spread: number | null;
  method: string;
} {
  if (openMeteo == null || isNaN(openMeteo)) {
    const fallbacks = [ww3, ecmwf].filter((v): v is number => v != null && !isNaN(v));
    if (fallbacks.length === 0) return { value: null, confidence: 'none', spread: null, method: 'no data' };
    if (fallbacks.length === 1) return { value: fallbacks[0], confidence: 'low', spread: null, method: 'fallback single' };
    return {
      value: (fallbacks[0] + fallbacks[1]) / 2,
      confidence: 'low',
      spread: Math.abs(fallbacks[0] - fallbacks[1]),
      method: 'fallback average (no OM)'
    };
  }

  const globalModels = [ww3, ecmwf].filter((v): v is number => v != null && !isNaN(v));
  if (globalModels.length === 0) {
    return { value: openMeteo, confidence: 'medium', spread: null, method: 'Open-Meteo only' };
  }

  const allValues = [openMeteo, ...globalModels];
  const spread = Math.max(...allValues) - Math.min(...allValues);
  const avgGlobal = globalModels.reduce((a, b) => a + b, 0) / globalModels.length;
  const omVsGlobalDiff = Math.abs(openMeteo - avgGlobal);

  // HIGH: within ~1ft. Slight 70/30 blend toward Open-Meteo.
  if (omVsGlobalDiff < 0.3) {
    return { value: openMeteo * 0.7 + avgGlobal * 0.3, confidence: 'high', spread, method: 'OM-primary blend (models agree)' };
  }
  // MEDIUM: 1-2ft apart. 85/15.
  if (omVsGlobalDiff < 0.6) {
    return { value: openMeteo * 0.85 + avgGlobal * 0.15, confidence: 'medium', spread, method: 'OM-primary (moderate spread)' };
  }
  // LOW: >2ft apart. Trust Open-Meteo, flag it.
  return { value: openMeteo, confidence: 'low', spread, method: 'OM-primary (high uncertainty)' };
}

// ============================================
// DATA FETCHERS
// ============================================

async function getJson(url: string, timeoutMs: number, label: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    const detail = (await res.text()).replace(/\s+/g, " ").slice(0, 160);
    throw new Error(`${label} HTTP ${res.status}: ${detail}`);
  }
  return res.json();
}

async function fetchOpenMeteoMarine(lat: number, lng: number) {
  const marineParams = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: [
      "wave_height", "wave_period", "wave_direction",
      "wind_wave_height", "wind_wave_period", "wind_wave_direction", "wind_wave_peak_period",
      "swell_wave_height", "swell_wave_period", "swell_wave_direction", "swell_wave_peak_period",
      "secondary_swell_wave_height", "secondary_swell_wave_period", "secondary_swell_wave_direction",
      "tertiary_swell_wave_height", "tertiary_swell_wave_period", "tertiary_swell_wave_direction",
      "sea_surface_temperature", "ocean_current_velocity", "ocean_current_direction"
    ].join(","),
    forecast_days: "7",
    timezone: "UTC"
  });

  const weatherParams = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: "wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,cloud_cover",
    forecast_days: "7",
    timezone: "UTC"
  });

  const [marine, weather] = await Promise.all([
    getJson(`https://marine-api.open-meteo.com/v1/marine?${marineParams}`, OM_TIMEOUT_MS, "Marine API"),
    getJson(`https://api.open-meteo.com/v1/forecast?${weatherParams}`, OM_TIMEOUT_MS, "Weather API"),
  ]);
  return { marine, weather };
}

async function fetchECMWF(lat: number, lng: number): Promise<{ data: any; error: string | null }> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      hourly: "wave_height,wave_period,wave_direction",
      models: "ecmwf_wam025",
      cell_selection: "sea",   // snap to nearest water cell, not nearest cell
      forecast_days: "7",
      timezone: "UTC"
    });

    const json = await getJson(`https://marine-api.open-meteo.com/v1/marine?${params}`, ECMWF_TIMEOUT_MS, "ECMWF");

    // Open-Meteo returns HTTP 200 with an all-null series for land cells.
    const heights = json?.hourly?.wave_height;
    if (!heights?.some((v: any) => v != null && Number.isFinite(v))) {
      return { data: null, error: "ECMWF: no wave data (land cell)" };
    }
    return { data: json, error: null };
  } catch (e) {
    return { data: null, error: `ECMWF: ${e instanceof Error ? e.message : 'fetch failed'}` };
  }
}

// WW3 comes from PacIOOS ERDDAP (University of Hawaii runs the model).
// The NOAA CoastWatch mirror was removed in Oct 2026: since Aug it hangs on
// every connection from Supabase, so as a fallback it never returned data and
// cost 20s per spot whenever PacIOOS was slow. That alone was enough to push
// batches past the 150s limit.
const WW3_URL = "https://pae-paha.pacioos.hawaii.edu/erddap/griddap/ww3_global.json";

// Nearby spots share the same 3x3 WW3 box (NJ's 24 spots fit in a handful),
// so the raw response is cached per box. Reset at the start of every
// invocation, since a warm worker can be reused hours later.
const ww3BoxCache = new Map<string, Promise<any>>();

// PacIOOS hangs at the TLS handshake for SOME Supabase egress IPs and answers
// instantly for others (seen Oct 2026: whole batches either 30 spots/min or
// every request timing out). Once one request times out, this instance is
// almost certainly on a bad IP, so skip WW3 for the rest of the run instead of
// burning 12s per spot. Those spots fall straight through to GFS-Wave.
let ww3Down = false;

const num = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

async function fetchWW3PacIOOS(lat: number, lng: number): Promise<{ data: any; error: string | null }> {
  try {
    // ERDDAP uses 0-360 longitude
    const erddapLon = lng < 0 ? 360 + lng : lng;
    const gridLat = Math.round(lat * 2) / 2;
    const gridLon = Math.round(erddapLon * 2) / 2;

    // WW3 runs on a 0.5deg grid. The nearest point is often a LAND cell, which
    // ERDDAP answers with HTTP 200 and NaN. So request a 3x3 box and pick the
    // nearest cell that actually has water.
    const latMin = gridLat - 0.5, latMax = gridLat + 0.5;
    const lonMin = gridLon - 0.5, lonMax = gridLon + 0.5;

    const startTime = new Date(Math.floor(Date.now() / 3600000) * 3600000)
      .toISOString().replace(".000Z", "Z");

    // Stop at `last`, NOT a computed now+7d: the model's run is always behind
    // ours, and overshooting the axis gets a 404 ("Stop is greater than the
    // axis maximum"). That 404 silently killed WW3 for a week in Aug 2026.
    const dims = `[(${startTime}):1:last][(0.0):1:(0.0)]` +
      `[(${latMin}):1:(${latMax})][(${lonMin}):1:(${lonMax})]`;
    const query = `?Thgt${dims},Tper${dims},Tdir${dims}`;

    if (ww3Down) return { data: null, error: "WW3 skipped: PacIOOS unreachable from this instance" };

    const boxKey = `${gridLat},${gridLon}`;
    if (!ww3BoxCache.has(boxKey)) {
      ww3BoxCache.set(boxKey, getJson(WW3_URL + query, WW3_TIMEOUT_MS, "WW3 pacioos"));
    }

    let data: any;
    try {
      data = await ww3BoxCache.get(boxKey);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "WW3 fetch failed";
      if (e instanceof Error && (e.name === "TimeoutError" || /timed out/i.test(msg))) ww3Down = true;
      return { data: null, error: `WW3 pacioos: ${msg}` };
    }

    const rows = data?.table?.rows;
    if (!rows?.length) return { data: null, error: "WW3: empty response" };

    const near = (a: number | null, b: number) => a !== null && Math.abs(a - b) < 1e-6;

    const cells = new Map<string, { lat: number; lon: number; valid: number; dist: number }>();
    for (const r of rows) {
      const cLat = num(r[2]);
      const cLon = num(r[3]);
      if (cLat === null || cLon === null) continue;
      const key = `${cLat},${cLon}`;
      if (!cells.has(key)) {
        const dLat = cLat - lat;
        const dLon = cLon - erddapLon;
        cells.set(key, { lat: cLat, lon: cLon, valid: 0, dist: dLat * dLat + dLon * dLon });
      }
      if (num(r[4]) !== null) cells.get(key)!.valid++;
    }

    const usable = [...cells.values()].filter(c => c.valid > 0);
    if (!usable.length) {
      return { data: null, error: "WW3: no water cell within 0.5deg (all land/NaN)" };
    }

    // Nearest water cell wins, locked in for the whole series.
    usable.sort((a, b) => a.dist - b.dist);
    const best = usable[0];

    const cellRows = rows.filter((r: any[]) =>
      near(num(r[2]), best.lat) && near(num(r[3]), best.lon) && num(r[4]) !== null
    );
    if (!cellRows.length) return { data: null, error: "WW3: selected cell had no valid rows" };

    return {
      data: {
        hourly: {
          time: cellRows.map((r: any[]) => {
            const timeVal = typeof r[0] === 'number' ? r[0] * 1000 : Date.parse(r[0]);
            return new Date(timeVal).toISOString();
          }),
          wave_height: cellRows.map((r: any[]) => num(r[4])),
          wave_period: cellRows.map((r: any[]) => num(r[5])),
          wave_direction: cellRows.map((r: any[]) => num(r[6]))
        }
      },
      error: null
    };
  } catch (e) {
    return { data: null, error: `WW3: ${e instanceof Error ? e.message : 'fetch failed'}` };
  }
}

// Fallback WW3: NOAA's operational GFS-Wave, which IS WAVEWATCH III (NCEP
// runs it as the wave component of GFS), served by Open-Meteo at 0.25deg.
// PacIOOS just re-publishes NCEP's WW3 output, so this is the same model from
// a host that actually answers Supabase. Added Oct 2026 after PacIOOS spent
// most of a day timing out from every Supabase instance.
async function fetchWW3GfsWave(lat: number, lng: number): Promise<{ data: any; error: string | null }> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      hourly: "wave_height,wave_period,wave_direction",
      models: "ncep_gfswave025",
      cell_selection: "sea",
      forecast_days: "7",
      timezone: "UTC"
    });
    const json = await getJson(`https://marine-api.open-meteo.com/v1/marine?${params}`, ECMWF_TIMEOUT_MS, "GFS-Wave");
    const h = json?.hourly;
    // Coastal cells GFS-Wave treats as land come back as 0, not null. A 0m
    // sea would drag the blend down, so zeros are dropped along with their
    // period and direction.
    const height: (number | null)[] = (h?.wave_height ?? []).map((v: any) =>
      typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
    if (!height.some(v => v !== null)) {
      return { data: null, error: "GFS-Wave: no wave data (land cell)" };
    }
    const keep = (arr: any[] | undefined) => (arr ?? []).map((v, i) => (height[i] === null ? null : v));
    return {
      data: {
        hourly: {
          // Open-Meteo times come back as "YYYY-MM-DDTHH:MM" in UTC
          time: h.time.map((t: string) => (t.endsWith("Z") ? t : `${t}Z`)),
          wave_height: height,
          wave_period: keep(h.wave_period),
          wave_direction: keep(h.wave_direction),
        }
      },
      error: null
    };
  } catch (e) {
    return { data: null, error: `GFS-Wave: ${e instanceof Error ? e.message : "fetch failed"}` };
  }
}

// WW3 = PacIOOS first (the source the site has always used), GFS-Wave when
// PacIOOS fails. `source` is counted in the run log so /status shows which.
async function fetchWaveWatchIII(lat: number, lng: number): Promise<{ data: any; error: string | null; source: string | null }> {
  const primary = await fetchWW3PacIOOS(lat, lng);
  if (primary.data) return { ...primary, source: "pacioos" };

  const fallback = await fetchWW3GfsWave(lat, lng);
  if (fallback.data) return { ...fallback, source: "gfswave" };

  return { data: null, error: `${primary.error} | ${fallback.error}`, source: null };
}

// Index a model's hourly series by the hour it falls on. Replaces a
// findIndex-per-row scan that parsed ~50k dates per spot and was a big chunk
// of the function's CPU time.
function indexByHour(times: string[] | undefined): Map<number, number> {
  const m = new Map<number, number>();
  times?.forEach((t, i) => {
    const hour = Math.round(new Date(t).getTime() / 3600000);
    if (!m.has(hour)) m.set(hour, i);
  });
  return m;
}

// ============================================
// ONE SPOT
// ============================================

type SpotResult = { ok: boolean; saved: number; error?: string; ww3Error?: string; ww3Source?: string | null; ecmwfError?: string };

async function processSpot(supabase: SupabaseClient, spot: Spot): Promise<SpotResult> {
  try {
    const [omData, ecmwfResult, ww3Result] = await Promise.all([
      fetchOpenMeteoMarine(spot.latitude, spot.longitude),
      fetchECMWF(spot.latitude, spot.longitude),
      fetchWaveWatchIII(spot.latitude, spot.longitude)
    ]);

    if (!omData.marine.hourly?.time) return { ok: false, saved: 0, error: "No Open-Meteo data" };

    const om = omData.marine.hourly;
    const weather = omData.weather.hourly;
    const ec = ecmwfResult.data?.hourly;
    const ww3 = ww3Result.data?.hourly;
    const ecIndex = indexByHour(ec?.time);
    const ww3Index = indexByHour(ww3?.time);
    const fetchedAt = new Date().toISOString();

    const forecasts = om.time.map((timestamp: string, i: number) => {
      const ts = new Date(timestamp);
      const hour = Math.round(ts.getTime() / 3600000);
      const wi = ww3Index.get(hour) ?? -1;
      const ei = ecIndex.get(hour) ?? -1;

      const omHeight = om.wave_height?.[i] ?? null;
      const ww3Height = wi >= 0 ? ww3.wave_height[wi] : null;
      const ecHeight = ei >= 0 ? ec.wave_height[ei] : null;

      const omPeriod = om.wave_period?.[i] ?? null;
      const ww3Period = wi >= 0 ? ww3.wave_period[wi] : null;
      const ecPeriod = ei >= 0 ? ec.wave_period[ei] : null;

      const omDir = om.wave_direction?.[i] ?? null;
      const ww3Dir = wi >= 0 ? ww3.wave_direction[wi] : null;
      const ecDir = ei >= 0 ? ec.wave_direction[ei] : null;

      const heightBlend = blendForecasts(ww3Height, omHeight, ecHeight);
      const periodBlend = blendForecasts(ww3Period, omPeriod, ecPeriod);
      const modelCount = [omHeight, ww3Height, ecHeight].filter(v => v != null && !isNaN(v)).length;

      // Direction follows whichever source carried the height. With OM
      // present that is always OM; in the no-OM fallback, prefer WW3.
      let blendedDir = omDir;
      if (omHeight == null) blendedDir = ww3Dir ?? ecDir ?? null;

      return {
        spot_id: spot.id,
        timestamp: ts.toISOString(),

        wave_height: omHeight,
        wave_period: omPeriod,
        wave_direction: omDir,
        wind_wave_height: om.wind_wave_height?.[i] ?? null,
        wind_wave_period: om.wind_wave_period?.[i] ?? null,
        wind_wave_direction: om.wind_wave_direction?.[i] ?? null,
        swell_wave_height: om.swell_wave_height?.[i] ?? null,
        swell_wave_period: om.swell_wave_period?.[i] ?? null,
        swell_wave_direction: om.swell_wave_direction?.[i] ?? null,
        secondary_swell_height: om.secondary_swell_wave_height?.[i] ?? null,
        secondary_swell_period: om.secondary_swell_wave_period?.[i] ?? null,
        secondary_swell_direction: om.secondary_swell_wave_direction?.[i] ?? null,
        tertiary_swell_height: om.tertiary_swell_wave_height?.[i] ?? null,
        tertiary_swell_period: om.tertiary_swell_wave_period?.[i] ?? null,
        tertiary_swell_direction: om.tertiary_swell_wave_direction?.[i] ?? null,
        swell_peak_period: om.swell_wave_peak_period?.[i] ?? null,
        wind_wave_peak_period: om.wind_wave_peak_period?.[i] ?? null,
        sea_surface_temp: om.sea_surface_temperature?.[i] ?? null,
        ocean_current_velocity: om.ocean_current_velocity?.[i] ?? null,
        ocean_current_direction: om.ocean_current_direction?.[i] ?? null,

        wind_speed: weather.wind_speed_10m?.[i] ?? null,
        wind_direction: weather.wind_direction_10m?.[i] ?? null,
        wind_gust: weather.wind_gusts_10m?.[i] ?? null,
        precipitation: weather.precipitation?.[i] ?? null,
        cloud_cover: weather.cloud_cover?.[i] ?? null,

        ww3_wave_height: ww3Height,
        ww3_wave_period: ww3Period,
        ww3_wave_direction: ww3Dir,
        ecmwf_wave_height: ecHeight,
        ecmwf_wave_period: ecPeriod,
        ecmwf_wave_direction: ecDir,

        blended_wave_height: heightBlend.value,
        blended_wave_period: periodBlend.value,
        blended_wave_direction: blendedDir,
        blend_confidence: heightBlend.confidence,
        blend_spread: heightBlend.spread,
        blend_model_count: modelCount,

        fetched_at: fetchedAt,
      };
    });

    const { error: upsertError } = await supabase
      .from("forecasts")
      .upsert(forecasts, { onConflict: "spot_id,timestamp" });

    if (upsertError) return { ok: false, saved: 0, error: upsertError.message };

    return {
      ok: true,
      saved: forecasts.length,
      ww3Error: ww3Result.error ?? undefined,
      ww3Source: ww3Result.source,
      ecmwfError: ecmwfResult.error ?? undefined,
    };
  } catch (e) {
    return { ok: false, saved: 0, error: e instanceof Error ? e.message : "Error" };
  }
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const started = Date.now();
  ww3BoxCache.clear();
  ww3Down = false;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Two modes:
  //   { offset, limit: 15 }  normal batch, cron calls 10 of these
  //   { retry: true }        re-run spots with no WW3 (or no data at all) in
  //                          the last 12h. Cron calls it every 2 hours.
  let limit = 15;
  let offset = 0;
  let retry = false;
  try {
    const body = await req.json();
    if (body.limit) limit = Math.min(body.limit, 30);
    if (body.offset != null) offset = body.offset;
    if (body.retry) { retry = true; if (!body.limit) limit = 30; }
  } catch {
    // No body, use defaults
  }

  const runId = await startRun(supabase, "ingest-openmeteo", retry ? "retry" : `${offset}-${offset + limit - 1}`);

  try {
    const { data: spots, error: spotsError } = retry
      ? await supabase.rpc("spots_needing_refetch", { max_spots: limit })
      : await supabase
        .from("spots")
        .select("id, name, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("name")
        .range(offset, offset + limit - 1);

    if (spotsError) throw new Error(`Failed to fetch spots: ${spotsError.message}`);
    if (!spots?.length) {
      await finishRun(supabase, runId, { status: "ok", processed: 0, failed: 0, summary: { note: "no spots in range" } });
      return new Response(JSON.stringify({ message: "No spots in range", offset, limit }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const results = {
      processed: 0,
      failed: 0,
      forecasts_saved: 0,
      skipped_for_time: [] as string[],
      errors: [] as string[],
      source_stats: { openmeteo: 0, ecmwf: 0, ww3: 0, ww3_pacioos: 0, ww3_gfswave: 0, ecmwf_errors: 0, ww3_errors: 0 },
      ww3_error_sample: [] as string[],
      ecmwf_error_sample: [] as string[],
    };

    // Simple worker pool: CONCURRENCY spots in flight, no new ones once the
    // time budget is used up.
    const queue = [...(spots as Spot[])];
    const worker = async () => {
      while (queue.length) {
        if (Date.now() - started > TIME_BUDGET_MS) {
          results.skipped_for_time.push(...queue.splice(0).map(s => s.name));
          return;
        }
        const spot = queue.shift()!;
        const r = await processSpot(supabase, spot);
        if (!r.ok) {
          results.failed++;
          results.errors.push(`${spot.name}: ${r.error}`);
          continue;
        }
        results.processed++;
        results.forecasts_saved += r.saved;
        results.source_stats.openmeteo++;
        if (r.ww3Error) {
          results.source_stats.ww3_errors++;
          if (results.ww3_error_sample.length < 3) results.ww3_error_sample.push(`${spot.name}: ${r.ww3Error}`);
        } else {
          results.source_stats.ww3++;
          if (r.ww3Source === "pacioos") results.source_stats.ww3_pacioos++;
          if (r.ww3Source === "gfswave") results.source_stats.ww3_gfswave++;
        }
        if (r.ecmwfError) {
          results.source_stats.ecmwf_errors++;
          if (results.ecmwf_error_sample.length < 3) results.ecmwf_error_sample.push(`${spot.name}: ${r.ecmwfError}`);
        } else results.source_stats.ecmwf++;
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    const notDone = results.failed + results.skipped_for_time.length;
    // Missing WW3 counts as partial: the model comparison is the product.
    const status = results.processed === 0 ? "error"
      : notDone > 0 || results.source_stats.ww3_errors > 0 ? "partial" : "ok";
    const firstProblem = results.errors[0]
      ?? (results.skipped_for_time.length ? `Out of time, skipped: ${results.skipped_for_time.join(", ")}` : null)
      ?? results.ww3_error_sample[0]
      ?? (results.source_stats.ww3_gfswave
        ? `WW3 via GFS-Wave fallback for ${results.source_stats.ww3_gfswave}/${results.processed} spots (PacIOOS unreachable)`
        : null)
      ?? results.ecmwf_error_sample[0] ?? null;

    const body = {
      message: "Complete",
      batch: retry ? { retry: true, limit } : { offset, limit },
      elapsed_ms: Date.now() - started,
      ...results,
    };

    await finishRun(supabase, runId, {
      status,
      processed: results.processed,
      failed: notDone,
      error: firstProblem,
      summary: {
        elapsed_ms: body.elapsed_ms,
        source_stats: results.source_stats,
        skipped_for_time: results.skipped_for_time,
        errors: results.errors.slice(0, 5),
        ww3_error_sample: results.ww3_error_sample,
        ecmwf_error_sample: results.ecmwf_error_sample,
      },
    });

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    await finishRun(supabase, runId, { status: "error", error: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
