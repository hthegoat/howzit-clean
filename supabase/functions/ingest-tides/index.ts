import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Spot {
  id: string;
  name: string;
  tide_station_id: string;
}

interface TidePrediction {
  t: string;  // timestamp
  v: string;  // height value
  type: string; // H or L
}

async function fetchNOAATides(stationId: string) {
  const today = new Date();
  const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const formatDate = (d: Date) => 
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

  const params = new URLSearchParams({
    station: stationId,
    begin_date: formatDate(today),
    end_date: formatDate(endDate),
    product: "predictions",
    datum: "MLLW",
    units: "english",
    time_zone: "gmt",  // Use GMT to avoid timezone confusion
    format: "json",
    interval: "hilo"  // High/Low only
  });

  const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${params}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`NOAA Tides API error: ${res.status}`);
  }
  
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all spots with tide station IDs
    const { data: spots, error: spotsError } = await supabase
      .from("spots")
      .select("id, name, tide_station_id")
      .not("tide_station_id", "is", null);

    if (spotsError) throw new Error(`Failed to fetch spots: ${spotsError.message}`);
    if (!spots?.length) {
      return new Response(JSON.stringify({ message: "No spots with tide stations found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const results = { processed: 0, tides_saved: 0, errors: [] as string[] };

    // Group spots by tide station (multiple spots may share one station)
    const stationMap = new Map<string, Spot[]>();
    for (const spot of spots as Spot[]) {
      const existing = stationMap.get(spot.tide_station_id) || [];
      existing.push(spot);
      stationMap.set(spot.tide_station_id, existing);
    }

    for (const [stationId, stationSpots] of stationMap) {
      try {
        const data = await fetchNOAATides(stationId);
        
        if (!data.predictions?.length) {
          results.errors.push(`Station ${stationId}: No predictions returned`);
          continue;
        }

        // Create tide records for each spot using this station
        for (const spot of stationSpots) {
          const tides = data.predictions.map((pred: TidePrediction) => ({
            spot_id: spot.id,
            // NOAA returns GMT time as "YYYY-MM-DD HH:MM", append Z to parse as UTC
            timestamp: new Date(pred.t.replace(' ', 'T') + 'Z').toISOString(),
            type: pred.type === "H" ? "HIGH" : "LOW",
            height: parseFloat(pred.v),
          }));

          if (tides.length) {
            const { error: upsertError } = await supabase
              .from("tides")
              .upsert(tides, { onConflict: "spot_id,timestamp" });

            if (upsertError) {
              results.errors.push(`${spot.name}: ${upsertError.message}`);
            } else {
              results.tides_saved += tides.length;
            }
          }
        }

        results.processed++;
        
        // Rate limit: 200ms between stations
        await new Promise(r => setTimeout(r, 200));
        
      } catch (e) {
        results.errors.push(`Station ${stationId}: ${e instanceof Error ? e.message : "Error"}`);
      }
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
