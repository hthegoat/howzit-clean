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

async function fetchOpenMeteoMarine(lat: number, lng: number) {
  // Fetch marine data with ALL swell components
  const marineParams = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: [
      // Combined totals
      "wave_height",
      "wave_period",
      "wave_direction",
      // Wind waves (local chop)
      "wind_wave_height",
      "wind_wave_period",
      "wind_wave_direction",
      "wind_wave_peak_period",
      // Primary swell (ground swell)
      "swell_wave_height",
      "swell_wave_period",
      "swell_wave_direction",
      "swell_wave_peak_period",
      // Secondary swell
      "secondary_swell_wave_height",
      "secondary_swell_wave_period",
      "secondary_swell_wave_direction",
      // Tertiary swell (GFS only)
      "tertiary_swell_wave_height",
      "tertiary_swell_wave_period",
      "tertiary_swell_wave_direction",
      // Ocean conditions
      "sea_surface_temperature",
      "ocean_current_velocity",
      "ocean_current_direction"
    ].join(","),
    forecast_days: "7",
    timezone: "America/New_York"
  });

  // Fetch weather data (wind)
  const weatherParams = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: "wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,cloud_cover",
    forecast_days: "7",
    timezone: "America/New_York"
  });

  const [marineRes, weatherRes] = await Promise.all([
    fetch(`https://marine-api.open-meteo.com/v1/marine?${marineParams}`),
    fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`)
  ]);
  
  if (!marineRes.ok) throw new Error(`Marine API error: ${marineRes.status}`);
  if (!weatherRes.ok) throw new Error(`Weather API error: ${weatherRes.status}`);
  
  const marine = await marineRes.json();
  const weather = await weatherRes.json();
  
  return { marine, weather };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all spots with coordinates
    const { data: spots, error: spotsError } = await supabase
      .from("spots")
      .select("id, name, latitude, longitude")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (spotsError) throw new Error(`Failed to fetch spots: ${spotsError.message}`);
    if (!spots?.length) {
      return new Response(JSON.stringify({ message: "No spots with coordinates found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const results = { processed: 0, forecasts_saved: 0, errors: [] as string[] };

    for (const spot of spots as Spot[]) {
      try {
        const data = await fetchOpenMeteoMarine(spot.latitude, spot.longitude);
        
        if (!data.marine.hourly || !data.marine.hourly.time) {
          results.errors.push(`${spot.name}: No hourly data returned`);
          continue;
        }

        const { 
          time, 
          wave_height, 
          wave_period, 
          wave_direction,
          wind_wave_height,
          wind_wave_period,
          wind_wave_direction,
          wind_wave_peak_period,
          swell_wave_height, 
          swell_wave_period, 
          swell_wave_direction,
          swell_wave_peak_period,
          secondary_swell_wave_height,
          secondary_swell_wave_period,
          secondary_swell_wave_direction,
          tertiary_swell_wave_height,
          tertiary_swell_wave_period,
          tertiary_swell_wave_direction,
          sea_surface_temperature,
          ocean_current_velocity,
          ocean_current_direction
        } = data.marine.hourly;
        
        const { wind_speed_10m, wind_direction_10m, wind_gusts_10m, precipitation, cloud_cover } = data.weather.hourly;

        const forecasts = time.map((timestamp: string, i: number) => {
          return {
            spot_id: spot.id,
            timestamp: new Date(timestamp).toISOString(),
            // Combined totals (for headline display)
            wave_height: wave_height?.[i] ?? null,
            wave_period: wave_period?.[i] ?? null,
            wave_direction: wave_direction?.[i] ?? null,
            // Wind waves (local chop)
            wind_wave_height: wind_wave_height?.[i] ?? null,
            wind_wave_period: wind_wave_period?.[i] ?? null,
            wind_wave_direction: wind_wave_direction?.[i] ?? null,
            // Primary swell (ground swell)
            swell_wave_height: swell_wave_height?.[i] ?? null,
            swell_wave_period: swell_wave_period?.[i] ?? null,
            swell_wave_direction: swell_wave_direction?.[i] ?? null,
            // Secondary swell
            secondary_swell_height: secondary_swell_wave_height?.[i] ?? null,
            secondary_swell_period: secondary_swell_wave_period?.[i] ?? null,
            secondary_swell_direction: secondary_swell_wave_direction?.[i] ?? null,
            // Tertiary swell (GFS only)
            tertiary_swell_height: tertiary_swell_wave_height?.[i] ?? null,
            tertiary_swell_period: tertiary_swell_wave_period?.[i] ?? null,
            tertiary_swell_direction: tertiary_swell_wave_direction?.[i] ?? null,
            // Peak periods (more accurate than mean)
            swell_peak_period: swell_wave_peak_period?.[i] ?? null,
            wind_wave_peak_period: wind_wave_peak_period?.[i] ?? null,
            // Ocean conditions
            sea_surface_temp: sea_surface_temperature?.[i] ?? null,
            ocean_current_velocity: ocean_current_velocity?.[i] ?? null,
            ocean_current_direction: ocean_current_direction?.[i] ?? null,
            // Wind
            wind_speed: wind_speed_10m?.[i] ?? null,
            wind_direction: wind_direction_10m?.[i] ?? null,
            wind_gust: wind_gusts_10m?.[i] ?? null,
            // Weather
            precipitation: precipitation?.[i] ?? null,
            cloud_cover: cloud_cover?.[i] ?? null,
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
        
        // Rate limit: 100ms between spots
        await new Promise(r => setTimeout(r, 100));
        
      } catch (e) {
        results.errors.push(`${spot.name}: ${e instanceof Error ? e.message : "Error"}`);
      }
    }

    // Trigger summary generation after forecasts are updated
    try {
      await fetch(`${supabaseUrl}/functions/v1/generate-all-summaries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`
        }
      });
    } catch (e) {
      results.errors.push(`Summary generation: ${e instanceof Error ? e.message : "Error"}`);
    }

    return new Response(JSON.stringify({ message: "Complete", ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
