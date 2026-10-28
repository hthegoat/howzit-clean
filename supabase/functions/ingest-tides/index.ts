import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface Spot {
  id: string;
  name: string;
  tide_station_id: string;
}

interface TidePrediction {
  t: string;    // "YYYY-MM-DD HH:MM" in GMT
  v: string;    // height, ft
  type: string; // H or L
}

async function fetchNOAATides(stationId: string) {
  const today = new Date();
  const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  const formatDate = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;

  const params = new URLSearchParams({
    station: stationId,
    begin_date: formatDate(today),
    end_date: formatDate(endDate),
    product: "predictions",
    datum: "MLLW",
    units: "english",
    time_zone: "gmt",
    format: "json",
    interval: "hilo"
  });

  const res = await fetch(`https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${params}`, {
    signal: AbortSignal.timeout(15_000)
  });
  if (!res.ok) throw new Error(`NOAA Tides API error: ${res.status}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const runId = await startRun(supabase, "ingest-tides", null);

  try {
    const { data: spots, error: spotsError } = await supabase
      .from("spots")
      .select("id, name, tide_station_id")
      .not("tide_station_id", "is", null);

    if (spotsError) throw new Error(`Failed to fetch spots: ${spotsError.message}`);

    const results = { stations: 0, stations_ok: 0, tides_saved: 0, errors: [] as string[] };

    // Several spots can share one station
    const stationMap = new Map<string, Spot[]>();
    for (const spot of (spots ?? []) as Spot[]) {
      const existing = stationMap.get(spot.tide_station_id) || [];
      existing.push(spot);
      stationMap.set(spot.tide_station_id, existing);
    }
    results.stations = stationMap.size;

    for (const [stationId, stationSpots] of stationMap) {
      try {
        const data = await fetchNOAATides(stationId);

        if (!data.predictions?.length) {
          results.errors.push(`Station ${stationId}: ${data.error?.message ?? "no predictions returned"}`);
          continue;
        }

        const rows = stationSpots.flatMap(spot =>
          data.predictions.map((pred: TidePrediction) => ({
            spot_id: spot.id,
            timestamp: new Date(pred.t.replace(' ', 'T') + 'Z').toISOString(),
            type: pred.type === "H" ? "HIGH" : "LOW",
            height: parseFloat(pred.v),
          }))
        );

        const { error: upsertError } = await supabase
          .from("tides")
          .upsert(rows, { onConflict: "spot_id,timestamp" });

        if (upsertError) {
          results.errors.push(`Station ${stationId}: ${upsertError.message}`);
        } else {
          results.tides_saved += rows.length;
          results.stations_ok++;
        }

        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        results.errors.push(`Station ${stationId}: ${e instanceof Error ? e.message : "Error"}`);
      }
    }

    const failed = results.stations - results.stations_ok;
    await finishRun(supabase, runId, {
      status: results.stations_ok === 0 ? "error" : failed === 0 ? "ok" : "partial",
      processed: results.stations_ok,
      failed,
      error: results.errors[0] ?? null,
      summary: { tides_saved: results.tides_saved, errors: results.errors.slice(0, 5) },
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
