import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

// ---- Helper functions (copied from generate-spot-summary to avoid cross-function calls) ----

const degreesToCompass = (degrees: number | null): string => {
    if (degrees === null || degrees === undefined) return '--'
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    return dirs[Math.round(degrees / 45) % 8]
}

const getWindQuality = (windDirection: number | null, beachOrientation: number | null): string => {
    if (!windDirection || !beachOrientation) return 'unknown'
    let diff = Math.abs(windDirection - beachOrientation)
    if (diff > 180) diff = 360 - diff
    if (diff >= 150) return 'offshore'
    if (diff >= 120) return 'cross-offshore'
    if (diff >= 60) return 'cross-shore'
    if (diff >= 30) return 'cross-onshore'
    return 'onshore'
}

const formatForecastData = (spot: any, forecasts: any[], tides: any[], waterTemp: number | null): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const byDay: Record<string, any> = {}
    forecasts.forEach(f => {
        const date = new Date(f.timestamp)
        const dateKey = date.toDateString()
        if (!byDay[dateKey]) byDay[dateKey] = { date, forecasts: [] }
        const hour = date.getHours()
        const waveHeightFt = f.wave_height ? Math.round(f.wave_height * 3.281) : null
        const windMph = f.wind_speed ? Math.round(f.wind_speed * 0.621) : null
        byDay[dateKey].forecasts.push({
            period: hour < 12 ? 'AM' : 'PM',
            waveHeight: waveHeightFt,
            wavePeriod: f.wave_period ? Math.round(f.wave_period) : null,
            windSpeed: windMph,
            windDirCompass: degreesToCompass(f.wind_direction),
            windQuality: getWindQuality(f.wind_direction, spot.orientation)
        })
    })

    const tidesByDay: Record<string, any[]> = {}
    if (tides) {
        tides.forEach(t => {
            const date = new Date(t.timestamp)
            const dateKey = date.toDateString()
            if (!tidesByDay[dateKey]) tidesByDay[dateKey] = []
            tidesByDay[dateKey].push({
                type: t.type,
                time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                height: t.height
            })
        })
    }

    let output = `Spot: ${spot.name}\nLocation: ${spot.region}, ${spot.state}\n`
    if (waterTemp) output += `Water temp: ${waterTemp}F\n`
    output += `\n--- Forecast ---\n\n`

    const sortedDays = Object.values(byDay).sort((a: any, b: any) => a.date - b.date).slice(0, 5)

    sortedDays.forEach((day: any) => {
        const dateStr = `${days[day.date.getDay()]} ${months[day.date.getMonth()]} ${day.date.getDate()}`
        output += `${dateStr}:\n`
        const dayTides = tidesByDay[day.date.toDateString()]
        if (dayTides?.length) {
            output += `  Tides: ${dayTides.map((t: any) => `${t.type} ${t.time}`).join(' then ')}\n`
        }
        const am = day.forecasts.find((f: any) => f.period === 'AM')
        const pm = day.forecasts.find((f: any) => f.period === 'PM')
        if (am) output += `  AM: ${am.waveHeight}ft, ${am.wavePeriod}s, ${am.windSpeed}mph ${am.windDirCompass} (${am.windQuality})\n`
        if (pm) output += `  PM: ${pm.waveHeight}ft, ${pm.wavePeriod}s, ${pm.windSpeed}mph ${pm.windDirCompass} (${pm.windQuality})\n`
        output += `\n`
    })
    return output
}

const generateSummary = async (forecastData: string): Promise<string> => {
    if (!ANTHROPIC_API_KEY) return "Forecast summary unavailable."

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 100,
                messages: [{
                    role: 'user',
                    content: `${forecastData}\n\nTwo sentences max. Best day and why. Sound human. No greetings.`
                }]
            })
        })

        if (!response.ok) return "Summary temporarily unavailable."
        const data = await response.json()
        return data.content?.[0]?.text?.trim() || "Unable to generate summary."
    } catch {
        return "Summary generation failed."
    }
}

const generateSpotSummary = async (spotId: string): Promise<{ success: boolean; summary?: string; error?: string }> => {
    try {
        const { data: spot } = await supabase.from('spots').select('*').eq('id', spotId).single()
        if (!spot) return { success: false, error: 'Spot not found' }

        const now = new Date()
        const sixDaysOut = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)

        const { data: forecasts } = await supabase.from('forecasts').select('*')
            .eq('spot_id', spotId).gte('timestamp', now.toISOString()).lte('timestamp', sixDaysOut.toISOString())
            .order('timestamp', { ascending: true })

        const { data: tides } = await supabase.from('tides').select('*')
            .eq('spot_id', spotId).gte('timestamp', now.toISOString())
            .order('timestamp', { ascending: true }).limit(20)

        let waterTemp = null
        if (spot.buoy_id) {
            const { data: buoy } = await supabase.from('buoy_readings').select('water_temp')
                .eq('buoy_id', spot.buoy_id).order('timestamp', { ascending: false }).limit(1).single()
            if (buoy?.water_temp) waterTemp = Math.round((buoy.water_temp * 9 / 5) + 32)
        }

        const forecastData = formatForecastData(spot, forecasts || [], tides || [], waterTemp)
        const summary = await generateSummary(forecastData)

        await supabase.from('spot_summaries').upsert({
            spot_id: spotId,
            summary,
            generated_at: new Date().toISOString()
        }, { onConflict: 'spot_id' })

        return { success: true, summary }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
}

// ---- Main handler ----

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { data: spots, error } = await supabase.from('spots').select('id, name')
        if (error || !spots) {
            return new Response(JSON.stringify({ error: 'Failed to fetch spots' }), { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const results = []

        for (const spot of spots) {
            const result = await generateSpotSummary(spot.id)
            results.push({ 
                spot: spot.name, 
                status: result.success ? 'success' : 'failed',
                error: result.error 
            })
            // Rate limit to avoid hitting Anthropic too fast
            await new Promise(r => setTimeout(r, 500))
        }

        const successCount = results.filter(r => r.status === 'success').length

        return new Response(JSON.stringify({ 
            processed: spots.length, 
            successful: successCount,
            failed: spots.length - successCount,
            results 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error' }), { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
