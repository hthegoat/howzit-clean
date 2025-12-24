import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SURFLINE_BASE = "https://services.surfline.com/kbyg/spots/forecasts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Spot {
    id: string;
    name: string;
    slug: string;
    surfline_id: string;
}

interface SurflineWave {
    timestamp: number;
    surf: { min: number; max: number };
    swells: Array<{ height: number; period: number; direction: number }>;
}

interface SurflineRating {
    timestamp: number;
    rating: { key: string; value: number };
}

interface SurflineWind {
    timestamp: number;
    speed: number;
    direction: number;
    directionType: string;
}

interface SurflineTide {
    timestamp: number;
    type: string;
    height: number;
}

async function fetchSurflineData(spotId: string, type: string, days = 6) {
    const params = new URLSearchParams({ spotId, days: days.toString() });
    if (type === "wave") params.append("intervalHours", "12");
    else if (type === "wind") params.append("intervalHours", "6");

    const url = `${SURFLINE_BASE}/${type}?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Surfline API error: ${res.status}`);
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

        const { data: spots, error: spotsError } = await supabase
            .from("spots")
            .select("id, name, slug, surfline_id")
            .not("surfline_id", "is", null);

        if (spotsError) throw new Error(`Failed to fetch spots: ${spotsError.message}`);
        if (!spots?.length) {
            return new Response(JSON.stringify({ message: "No spots found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const results = { processed: 0, forecasts_saved: 0, errors: [] as string[] };

        for (const spot of spots as Spot[]) {
            try {
                const [waveData, ratingData, windData, tideData] = await Promise.all([
                    fetchSurflineData(spot.surfline_id, "wave"),
                    fetchSurflineData(spot.surfline_id, "rating"),
                    fetchSurflineData(spot.surfline_id, "wind"),
                    fetchSurflineData(spot.surfline_id, "tides"),
                ]);

                const waves: SurflineWave[] = waveData?.data?.wave || [];
                const ratings: SurflineRating[] = ratingData?.data?.rating || [];
                const winds: SurflineWind[] = windData?.data?.wind || [];
                const tides: SurflineTide[] = tideData?.data?.tides || [];

                const forecasts = waves.map((wave) => {
                    const rating = ratings.find((r) => Math.abs(r.timestamp - wave.timestamp) < 43200);
                    const wind = winds.find((w) => Math.abs(w.timestamp - wave.timestamp) < 21600);
                    const primarySwell = wave.swells?.[0];

                    return {
                        spot_id: spot.id,
                        timestamp: new Date(wave.timestamp * 1000).toISOString(),
                        wave_min: wave.surf.min,
                        wave_max: wave.surf.max,
                        swell_height: primarySwell?.height || null,
                        swell_period: primarySwell?.period || null,
                        swell_direction: primarySwell?.direction || null,
                        rating_key: rating?.rating?.key || null,
                        rating_value: rating?.rating?.value || null,
                        wind_speed: wind?.speed || null,
                        wind_direction: wind?.direction || null,
                        wind_type: wind?.directionType || null,
                        fetched_at: new Date().toISOString(),
                    };
                });

                if (forecasts.length) {
                    await supabase.from("surfline_forecasts").upsert(forecasts, {
                        onConflict: "spot_id,timestamp",
                    });
                    results.forecasts_saved += forecasts.length;
                }

                const tideRecords = tides
                    .filter((t) => t.type === "HIGH" || t.type === "LOW")
                    .map((t) => ({
                        spot_id: spot.id,
                        timestamp: new Date(t.timestamp * 1000).toISOString(),
                        type: t.type,
                        height: t.height,
                    }));

                if (tideRecords.length) {
                    await supabase.from("surfline_tides").upsert(tideRecords, {
                        onConflict: "spot_id,timestamp",
                    });
                }

                results.processed++;
            } catch (e) {
                results.errors.push(`${spot.name}: ${e instanceof Error ? e.message : "Error"}`);
            }
        }

        // Trigger summary generation after forecasts are updated
        try {
            await fetch(`${supabaseUrl}/functions/v1/generate-all-summaries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`
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
