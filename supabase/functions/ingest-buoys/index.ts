import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// NOTE: this file is the source of truth for the DEPLOYED function. Until
// Oct 2026 the repo held an older spec-first draft that mis-parsed 4-digit
// years (it produced timestamps in the year 4026). Deploy from here only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- Run log (pipeline_runs, read by /status). Keep in sync across functions.
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

interface BuoyReading {
  buoy_id: string;
  timestamp: string;
  wave_height: number | null;
  dominant_period: number | null;
  average_period: number | null;
  wave_direction: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  wind_gust: number | null;
  water_temp: number | null;
  air_temp: number | null;
  pressure: number | null;
  swell_height: number | null;
  swell_period: number | null;
  swell_direction: number | null;
  wind_wave_height: number | null;
  wind_wave_period: number | null;
  wind_wave_direction: number | null;
  fetched_at: string;
}

const FETCH_TIMEOUT_MS = 10_000;

// Parse NDBC realtime data (standard meteorological, .txt)
function parseNDBCRealtime(text: string, buoyId: string): BuoyReading | null {
  const lines = text.trim().split('\n');
  if (lines.length < 3) return null;

  // Line 1 headers, line 2 units, line 3 most recent reading
  const headers = lines[0].split(/\s+/);
  const values = lines[2].split(/\s+/);

  const getValue = (name: string): number | null => {
    const idx = headers.indexOf(name);
    if (idx === -1) return null;
    const val = parseFloat(values[idx]);
    // NDBC uses MM, 99, 999, 9999 as missing markers
    return isNaN(val) || val === 99 || val === 999 || val === 9999 ? null : val;
  };

  // Header says #YY but data uses 4-digit years. Handle both.
  const rawYear = parseInt(values[0]);
  const year = rawYear > 100 ? rawYear : 2000 + rawYear;
  const timestamp = new Date(Date.UTC(
    year, parseInt(values[1]) - 1, parseInt(values[2]), parseInt(values[3]), parseInt(values[4])
  ));

  // Sanity check: a parse error shows up as a wildly wrong date
  if (Math.abs(timestamp.getTime() - Date.now()) > 48 * 60 * 60 * 1000) {
    console.error(`Buoy ${buoyId}: Timestamp ${timestamp.toISOString()} is too far from now, likely parsing error`);
    return null;
  }

  return {
    buoy_id: buoyId,
    timestamp: timestamp.toISOString(),
    wave_height: getValue('WVHT'),      // meters
    dominant_period: getValue('DPD'),   // seconds
    average_period: getValue('APD'),    // seconds
    wave_direction: getValue('MWD'),    // degrees
    wind_speed: getValue('WSPD'),       // m/s
    wind_direction: getValue('WDIR'),   // degrees
    wind_gust: getValue('GST'),         // m/s
    water_temp: getValue('WTMP'),       // Celsius
    air_temp: getValue('ATMP'),         // Celsius
    pressure: getValue('PRES'),         // hPa
    swell_height: null,
    swell_period: null,
    swell_direction: null,
    wind_wave_height: null,
    wind_wave_period: null,
    wind_wave_direction: null,
    fetched_at: new Date().toISOString()
  };
}

// Compass point to degrees. Returns null (not 0) for unknown strings, and
// keeps N as 0 -- the old `Math.round(x ?? 0) || null` turned due-north
// swell into null.
const COMPASS: Record<string, number> = {
  'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
  'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
  'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
  'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
};
const dirToDeg = (dir: string | undefined): number | null =>
  dir != null && dir in COMPASS ? Math.round(COMPASS[dir]) : null;

// Parse NDBC spectral summary (.spec) for swell / wind-wave partitions
function parseNDBCSpec(text: string) {
  const lines = text.trim().split('\n');
  if (lines.length < 3) return null;

  const headers = lines[0].split(/\s+/);
  const values = lines[2].split(/\s+/);

  const getValue = (name: string): number | null => {
    const idx = headers.indexOf(name);
    if (idx === -1) return null;
    const val = parseFloat(values[idx]);
    return isNaN(val) || val === 99 || val === 999 ? null : val;
  };

  const swellDirIdx = headers.indexOf('SwD');
  const windWaveDirIdx = headers.indexOf('WWD');

  return {
    waveHeight: getValue('WVHT'),
    swellHeight: getValue('SwH'),
    swellPeriod: getValue('SwP'),
    swellDir: swellDirIdx !== -1 ? dirToDeg(values[swellDirIdx]) : null,
    windWaveHeight: getValue('WWH'),
    windWavePeriod: getValue('WWP'),
    windWaveDir: windWaveDirIdx !== -1 ? dirToDeg(values[windWaveDirIdx]) : null
  };
}

async function fetchBuoyData(buoyId: string): Promise<BuoyReading | null> {
  try {
    const meteoRes = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!meteoRes.ok) {
      console.error(`Failed to fetch buoy ${buoyId}: ${meteoRes.status}`);
      return null;
    }

    const reading = parseNDBCRealtime(await meteoRes.text(), buoyId);
    if (!reading) return null;

    // Spectral data for swell components (not every buoy has it)
    try {
      const specRes = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.spec`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (specRes.ok) {
        const spec = parseNDBCSpec(await specRes.text());
        if (spec) {
          reading.swell_height = spec.swellHeight;
          reading.swell_period = spec.swellPeriod;
          reading.swell_direction = spec.swellDir;
          reading.wind_wave_height = spec.windWaveHeight;
          reading.wind_wave_period = spec.windWavePeriod;
          reading.wind_wave_direction = spec.windWaveDir;
          // Some buoys report WVHT in .spec but MM in .txt
          if (reading.wave_height == null && spec.waveHeight != null) {
            reading.wave_height = spec.waveHeight;
          }
        }
      }
    } catch {
      console.log(`No spectral data for buoy ${buoyId}`);
    }

    return reading;
  } catch (e) {
    console.error(`Error fetching buoy ${buoyId}:`, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const runId = await startRun(supabase, "ingest-buoys", null);

  try {
    const { data: spots, error: spotsError } = await supabase
      .from("spots")
      .select("buoy_id")
      .not("buoy_id", "is", null);

    if (spotsError) throw new Error(`Failed to fetch spots: ${spotsError.message}`);

    const buoyIds = [...new Set(spots?.map(s => s.buoy_id).filter(Boolean))] as string[];

    const results = {
      processed: 0, saved: 0, skipped_stale: 0, no_waves: [] as string[], errors: [] as string[]
    };

    for (const buoyId of buoyIds) {
      try {
        const reading = await fetchBuoyData(buoyId);

        if (!reading) {
          results.errors.push(`${buoyId}: no data returned or timestamp invalid`);
          continue;
        }

        // Only keep readings from the last 3 hours
        if (new Date(reading.timestamp).getTime() < Date.now() - 3 * 60 * 60 * 1000) {
          results.skipped_stale++;
          results.errors.push(`${buoyId}: data stale (${reading.timestamp})`);
          continue;
        }

        const { error: upsertError } = await supabase
          .from("buoy_readings")
          .upsert(reading, { onConflict: "buoy_id,timestamp" });

        if (upsertError) {
          results.errors.push(`${buoyId}: ${upsertError.message}`);
        } else {
          results.saved++;
          if (reading.wave_height === null && reading.swell_height === null) {
            results.no_waves.push(buoyId);
          }
        }
        results.processed++;

        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        results.errors.push(`${buoyId}: ${e instanceof Error ? e.message : "Error"}`);
      }
    }

    const failed = buoyIds.length - results.saved;
    await finishRun(supabase, runId, {
      // Some buoys are always offline, so a few misses is normal: only call it
      // an error when nothing at all came back.
      status: results.saved === 0 ? "error" : failed === 0 ? "ok" : "partial",
      processed: results.saved,
      failed,
      error: results.errors[0] ?? null,
      summary: { errors: results.errors, no_waves: results.no_waves, skipped_stale: results.skipped_stale },
    });

    return new Response(JSON.stringify({ message: "Complete", ...results }), {
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
