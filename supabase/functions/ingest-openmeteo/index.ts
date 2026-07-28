import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  // Open-Meteo is our primary source
  if (openMeteo == null || isNaN(openMeteo)) {
    // Fallback: no Open-Meteo data, use others
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
  
  // We have Open-Meteo - use it as primary
  const globalModels = [ww3, ecmwf].filter((v): v is number => v != null && !isNaN(v));
  
  // No global models to validate against
  if (globalModels.length === 0) {
    return { value: openMeteo, confidence: 'medium', spread: null, method: 'Open-Meteo only' };
  }
  
  // Calculate spread for confidence
  const allValues = [openMeteo, ...globalModels];
  const spread = Math.max(...allValues) - Math.min(...allValues);
  const avgGlobal = globalModels.reduce((a, b) => a + b, 0) / globalModels.length;
  const omVsGlobalDiff = Math.abs(openMeteo - avgGlobal);
  
  // HIGH confidence: Open-Meteo agrees with global models (within ~1ft / 0.3m)
  if (omVsGlobalDiff < 0.3) {
    // Slight blend toward Open-Meteo (70/30) when they agree
    const blended = openMeteo * 0.7 + avgGlobal * 0.3;
    return {
      value: blended,
      confidence: 'high',
      spread,
      method: 'OM-primary blend (models agree)'
    };
  }
  
  // MEDIUM confidence: Moderate disagreement (1-2ft / 0.3-0.6m)
  // Trust Open-Meteo more but acknowledge uncertainty
  if (omVsGlobalDiff < 0.6) {
    // 85% Open-Meteo, 15% global average
    const blended = openMeteo * 0.85 + avgGlobal * 0.15;
    return {
      value: blended,
      confidence: 'medium',
      spread,
      method: 'OM-primary (moderate spread)'
    };
  }
  
  // LOW confidence: Large disagreement (>2ft / 0.6m)
  // Still trust Open-Meteo but flag uncertainty
  // Global models likely over-forecasting offshore swell that won't reach shore
  return {
    value: openMeteo,
    confidence: 'low',
    spread,
    method: 'OM-primary (high uncertainty)'
  };
}

// ============================================
// DATA FETCHERS
// ============================================

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

  const [marineRes, weatherRes] = await Promise.all([
    fetch(`https://marine-api.open-meteo.com/v1/marine?${marineParams}`),
    fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`)
  ]);
  
  if (!marineRes.ok) throw new Error(`Marine API error: ${marineRes.status}`);
  if (!weatherRes.ok) throw new Error(`Weather API error: ${weatherRes.status}`);
  
  return {
    marine: await marineRes.json(),
    weather: await weatherRes.json()
  };
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

    const res = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params}`);
    if (!res.ok) return { data: null, error: `ECMWF HTTP ${res.status}` };

    const json = await res.json();

    // Open-Meteo returns HTTP 200 with an all-null series for land cells.
    // Treat that as an error so it shows up in ecmwf_errors instead of silently
    // passing null into the blend.
    const heights = json?.hourly?.wave_height;
    if (!heights?.some((v: any) => v != null && Number.isFinite(v))) {
      return { data: null, error: "ECMWF: no wave data (land cell)" };
    }

    return { data: json, error: null };
  } catch (e) {
    return { data: null, error: `ECMWF: ${e instanceof Error ? e.message : 'fetch failed'}` };
  }
}

async function fetchWaveWatchIII(lat: number, lng: number): Promise<{ data: any; error: string | null }> {
  try {
    // Convert to ERDDAP coordinates (0-360 longitude)
    const erddapLon = lng < 0 ? 360 + lng : lng;
    const gridLat = Math.round(lat * 2) / 2;
    const gridLon = Math.round(erddapLon * 2) / 2;

    // WW3 runs on a 0.5deg grid. Snapping to a single nearest point puts many
    // coastal spots on a LAND cell, and ERDDAP answers those with HTTP 200 and
    // NaN rather than an error -- so the failure is invisible. Instead request a
    // 3x3 box (+/- 0.5deg) and pick the nearest cell that actually has water.
    const latMin = gridLat - 0.5;
    const latMax = gridLat + 0.5;
    const lonMin = gridLon - 0.5;
    const lonMax = gridLon + 0.5;

    const now = new Date();
    const startTime = now.toISOString();
    // Match the 7-day window used for Open-Meteo/ECMWF rather than taking
    // everything ERDDAP has.
    const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const dims = `[(${startTime}):1:(${endTime})][(0.0):1:(0.0)]` +
      `[(${latMin}):1:(${latMax})][(${lonMin}):1:(${lonMax})]`;

    const url = `https://coastwatch.pfeg.noaa.gov/erddap/griddap/NWW3_Global_Best.json?` +
      `Thgt${dims},Tper${dims},Tdir${dims}`;

    const res = await fetch(url);
    if (!res.ok) return { data: null, error: `WW3 HTTP ${res.status}` };

    const data = await res.json();
    const rows = data?.table?.rows;
    if (!rows?.length) return { data: null, error: "WW3: empty response" };

    // ERDDAP encodes land / no-data as null or the string "NaN"
    const num = (v: any): number | null => {
      if (v === null || v === undefined) return null;
      const n = typeof v === "number" ? v : parseFloat(v);
      return Number.isFinite(n) ? n : null;
    };
    const near = (a: number | null, b: number) => a !== null && Math.abs(a - b) < 1e-6;

    // Inventory every cell in the box: how much real data it has, how far it is
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

    // Nearest water cell wins. Locked in for the whole series so the timeline
    // doesn't hop between cells and create discontinuities.
    usable.sort((a, b) => a.dist - b.dist);
    const best = usable[0];

    const cellRows = rows.filter((r: any[]) =>
      near(num(r[2]), best.lat) && near(num(r[3]), best.lon) && num(r[4]) !== null
    );
    if (!cellRows.length) return { data: null, error: "WW3: selected cell had no valid rows" };

    // Convert to hourly format matching Open-Meteo
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
        },
        grid: { lat: best.lat, lon: best.lon, cells_checked: cells.size }
      },
      error: null
    };
  } catch (e) {
    return { data: null, error: `WW3: ${e instanceof Error ? e.message : 'fetch failed'}` };
  }
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional batch parameters (offset/limit) for cron batching
    // Without params: processes first 30 spots (safe within 150s wall clock)
    // With params: e.g. { "offset": 30, "limit": 30 } for batch 2
    let limit = 30;
    let offset = 0;
    
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 50);  // Max 50 per call
      if (body.offset != null) offset = body.offset;
    } catch {
      // No body or invalid JSON, use defaults
    }

    const { data: spots, error: spotsError } = await supabase
      .from("spots")
      .select("id, name, latitude, longitude")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("name")
      .range(offset, offset + limit - 1);

    if (spotsError) throw new Error(`Failed to fetch spots: ${spotsError.message}`);
    if (!spots?.length) {
      return new Response(JSON.stringify({ message: "No spots in range", offset, limit }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get total count for reporting
    const { count: totalSpots } = await supabase
      .from("spots")
      .select("id", { count: "exact", head: true })
      .not("latitude", "is", null);

    const results = { 
      processed: 0, 
      forecasts_saved: 0, 
      errors: [] as string[],
      source_stats: { openmeteo: 0, ecmwf: 0, ww3: 0, ecmwf_errors: 0, ww3_errors: 0 }
    };

    for (const spot of spots as Spot[]) {
      try {
        // Fetch all 3 sources in parallel
        const [omData, ecmwfResult, ww3Result] = await Promise.all([
          fetchOpenMeteoMarine(spot.latitude, spot.longitude),
          fetchECMWF(spot.latitude, spot.longitude),
          fetchWaveWatchIII(spot.latitude, spot.longitude)
        ]);
        
        if (!omData.marine.hourly?.time) {
          results.errors.push(`${spot.name}: No Open-Meteo data`);
          continue;
        }
        
        results.source_stats.openmeteo++;
        
        // Track secondary source availability
        if (ecmwfResult.error) {
          results.source_stats.ecmwf_errors++;
        } else {
          results.source_stats.ecmwf++;
        }
        
        if (ww3Result.error) {
          results.source_stats.ww3_errors++;
        } else {
          results.source_stats.ww3++;
        }

        const om = omData.marine.hourly;
        const weather = omData.weather.hourly;
        const ec = ecmwfResult.data?.hourly;
        const ww3 = ww3Result.data?.hourly;

        const forecasts = om.time.map((timestamp: string, i: number) => {
          const ts = new Date(timestamp);
          
          // Find matching WW3 and ECMWF data by timestamp
          const ww3Idx = ww3?.time?.findIndex((t: string) => 
            Math.abs(new Date(t).getTime() - ts.getTime()) < 30 * 60 * 1000
          ) ?? -1;
          const ecIdx = ec?.time?.findIndex((t: string) => 
            Math.abs(new Date(t).getTime() - ts.getTime()) < 30 * 60 * 1000
          ) ?? -1;
          
          const omHeight = om.wave_height?.[i] ?? null;
          const ww3Height = ww3Idx >= 0 ? ww3.wave_height[ww3Idx] : null;
          const ecHeight = ecIdx >= 0 ? ec.wave_height[ecIdx] : null;
          
          const omPeriod = om.wave_period?.[i] ?? null;
          const ww3Period = ww3Idx >= 0 ? ww3.wave_period[ww3Idx] : null;
          const ecPeriod = ecIdx >= 0 ? ec.wave_period[ecIdx] : null;
          
          const omDir = om.wave_direction?.[i] ?? null;
          const ww3Dir = ww3Idx >= 0 ? ww3.wave_direction[ww3Idx] : null;
          const ecDir = ecIdx >= 0 ? ec.wave_direction[ecIdx] : null;
          
          // Calculate blended values
          const heightBlend = blendForecasts(ww3Height, omHeight, ecHeight);
          const periodBlend = blendForecasts(ww3Period, omPeriod, ecPeriod);
          
          // Count how many models contributed to this timestamp
          const modelCount = [omHeight, ww3Height, ecHeight].filter(v => v != null && !isNaN(v)).length;
          
          // For direction, use circular mean or just take from most confident height source
          let blendedDir = omDir;
          if (heightBlend.method.includes('WW3') && ww3Dir != null) {
            blendedDir = ww3Dir;
          } else if (heightBlend.method.includes('ECMWF') && ecDir != null) {
            blendedDir = ecDir;
          }

          return {
            spot_id: spot.id,
            timestamp: ts.toISOString(),
            
            // Original Open-Meteo data (keep for compatibility)
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
            
            // Weather
            wind_speed: weather.wind_speed_10m?.[i] ?? null,
            wind_direction: weather.wind_direction_10m?.[i] ?? null,
            wind_gust: weather.wind_gusts_10m?.[i] ?? null,
            precipitation: weather.precipitation?.[i] ?? null,
            cloud_cover: weather.cloud_cover?.[i] ?? null,
            
            // NEW: Multi-source data
            ww3_wave_height: ww3Height,
            ww3_wave_period: ww3Period,
            ww3_wave_direction: ww3Dir,
            ecmwf_wave_height: ecHeight,
            ecmwf_wave_period: ecPeriod,
            ecmwf_wave_direction: ecDir,
            
            // NEW: Blended values
            blended_wave_height: heightBlend.value,
            blended_wave_period: periodBlend.value,
            blended_wave_direction: blendedDir,
            blend_confidence: heightBlend.confidence,
            blend_spread: heightBlend.spread,
            blend_model_count: modelCount,
            
            fetched_at: new Date().toISOString(),
          };
        });

        if (forecasts.length) {
          const { error: upsertError } = await supabase
            .from("forecasts")
            .upsert(forecasts, { onConflict: "spot_id,timestamp" });

          if (upsertError) {
            results.errors.push(`${spot.name}: ${upsertError.message}`);
          } else {
            results.forecasts_saved += forecasts.length;
          }
        }

        results.processed++;
        
        // Rate limit: 200ms between spots (more API calls now)
        await new Promise(r => setTimeout(r, 200));
        
      } catch (e) {
        results.errors.push(`${spot.name}: ${e instanceof Error ? e.message : "Error"}`);
      }
    }

    return new Response(JSON.stringify({
      message: "Complete",
      batch: { offset, limit, total: totalSpots },
      next_offset: offset + spots.length < (totalSpots || 0) ? offset + spots.length : null,
      ...results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
