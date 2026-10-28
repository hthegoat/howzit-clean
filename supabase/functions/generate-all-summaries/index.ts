import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

// AI forecast summaries. Cron calls this 15x twice a day with
// { offset, limit: 10 }. Pass { spot_id } to regenerate one spot by hand
// (this replaced the separate generate-spot-summary function in Oct 2026).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const MODEL = 'claude-haiku-4-5-20251001'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// ---- Run log (pipeline_runs, read by /status). Keep in sync across functions.
async function startRun(sb: SupabaseClient, job: string, batch: string | null) {
  const { data } = await sb.from("pipeline_runs").insert({ job, batch }).select("id").single()
  return (data?.id as string) ?? null
}
async function finishRun(sb: SupabaseClient, id: string | null, f: {
  status: "ok" | "partial" | "error"; processed?: number; failed?: number; error?: string | null; summary?: unknown
}) {
  if (!id) return
  await sb.from("pipeline_runs").update({
    finished_at: new Date().toISOString(),
    status: f.status, processed: f.processed ?? null, failed: f.failed ?? null,
    error: f.error ? String(f.error).slice(0, 500) : null, summary: f.summary ?? null,
  }).eq("id", id)
}

// ---- Local time -------------------------------------------------------------
// Everything the model sees is in the SPOT's local time. Before Oct 2026 this
// used Deno's getHours(), which is UTC: the "AM" row was 8pm the night before
// on the East Coast and 2pm the day before in Hawaii, so "Tuesday morning is
// your best bet" was built from Monday afternoon's numbers.

type Local = { dayKey: string; label: string; hour: number; minute: number }

function toLocal(d: Date, tz: string): Local {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: 'short', day: 'numeric',
      weekday: 'short', hour: 'numeric', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map(p => [p.type, p.value])
  )
  return {
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
    label: `${parts.weekday} ${parts.month} ${parts.day}`,
    hour: parseInt(parts.hour) % 24,
    minute: parseInt(parts.minute),
  }
}

const clockTime = (d: Date, tz: string) =>
  d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' })

const tzAbbrev = (tz: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? tz

// ---- Formatting -------------------------------------------------------------

const degreesToCompass = (degrees: number | null): string => {
  if (degrees === null || degrees === undefined) return '--'
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(degrees / 45) % 8]
}

const getWindQuality = (windDirection: number | null, beachOrientation: number | null): string => {
  if (windDirection == null || beachOrientation == null) return 'unknown'
  let diff = Math.abs(windDirection - beachOrientation)
  if (diff > 180) diff = 360 - diff
  if (diff >= 150) return 'offshore'
  if (diff >= 120) return 'cross-offshore'
  if (diff >= 60) return 'cross-shore'
  if (diff >= 30) return 'cross-onshore'
  return 'onshore'
}

// Session windows in local hours. The row nearest the target hour wins.
const SESSIONS = [
  { name: 'Morning', target: 7, from: 5, to: 10 },
  { name: 'Afternoon', target: 14, from: 12, to: 17 },
]

const formatForecastData = (spot: any, forecasts: any[], tides: any[], waterTemp: number | null): string => {
  const tz: string = spot.timezone || 'America/New_York'

  const days = new Map<string, { label: string; rows: { hour: number; f: any }[]; tides: string[] }>()
  const dayFor = (l: Local) => {
    if (!days.has(l.dayKey)) days.set(l.dayKey, { label: l.label, rows: [], tides: [] })
    return days.get(l.dayKey)!
  }

  for (const f of forecasts) {
    const l = toLocal(new Date(f.timestamp), tz)
    dayFor(l).rows.push({ hour: l.hour, f })
  }
  for (const t of tides ?? []) {
    const d = new Date(t.timestamp)
    const l = toLocal(d, tz)
    if (days.has(l.dayKey)) days.get(l.dayKey)!.tides.push(`${t.type} ${clockTime(d, tz)}`)
  }

  const line = (name: string, f: any) => {
    const waveHeightM = f.blended_wave_height ?? f.wave_height
    const wavePeriodS = f.blended_wave_period ?? f.wave_period
    const ft = waveHeightM != null ? Math.round(waveHeightM * 3.281) : '?'
    const sec = wavePeriodS != null ? Math.round(wavePeriodS) : '?'
    const mph = f.wind_speed != null ? Math.round(f.wind_speed * 0.621) : '?'
    let s = `  ${name}: ${ft}ft, ${sec}s, ${mph}mph ${degreesToCompass(f.wind_direction)} (${getWindQuality(f.wind_direction, spot.orientation)})`
    if (f.blend_confidence === 'low') s += ' [uncertain]'
    return s
  }

  let output = `Spot: ${spot.name}\nLocation: ${spot.region}, ${spot.state}\n`
  output += `All days and times below are local time (${tzAbbrev(tz)}).\n`
  if (waterTemp) output += `Water temp: ${waterTemp}F\n`
  output += `Data: Blended from WaveWatch III, ECMWF, and Open-Meteo models\n`
  output += `\n--- Forecast ---\n\n`

  let shown = 0
  for (const day of days.values()) {
    if (shown >= 5) break
    const sessions = SESSIONS.map(s => {
      const inWindow = day.rows.filter(r => r.hour >= s.from && r.hour <= s.to)
      if (!inWindow.length) return null
      inWindow.sort((a, b) => Math.abs(a.hour - s.target) - Math.abs(b.hour - s.target))
      return line(s.name, inWindow[0].f)
    }).filter(Boolean)

    // A day with no daylight sessions left (e.g. tonight) is noise
    if (!sessions.length) continue

    output += `${day.label}:\n`
    if (day.tides.length) output += `  Tides: ${day.tides.join(' then ')}\n`
    output += sessions.join('\n') + '\n\n'
    shown++
  }
  return output
}

// ---- Model call ---------------------------------------------------------------

const generateSummary = async (forecastData: string): Promise<{ text: string | null; error?: string }> => {
  if (!ANTHROPIC_API_KEY) return { text: null, error: 'ANTHROPIC_API_KEY not set' }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(20_000),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 120,
        messages: [{
          role: 'user',
          content: `${forecastData}\n\nTwo sentences max. Best day/time and why. Be conservative with wave heights (round down). Vary your phrasing - don't always start with a day name. Sound like a local surfer, not a forecast. No greetings. Plain text only - no markdown, no asterisks, no bold, no bullet points.`
        }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return { text: null, error: `Anthropic ${response.status}: ${errText.substring(0, 200)}` }
    }
    const data = await response.json()
    const text = data.content?.[0]?.text?.trim()
    return text ? { text } : { text: null, error: 'Empty response from model' }
  } catch (err) {
    return { text: null, error: `Exception: ${err instanceof Error ? err.message : String(err)}` }
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

    if (!forecasts?.length) return { success: false, error: 'No forecast rows' }

    const { data: tides } = await supabase.from('tides').select('*')
      .eq('spot_id', spotId).gte('timestamp', now.toISOString())
      .order('timestamp', { ascending: true }).limit(24)

    let waterTemp = null
    if (spot.buoy_id) {
      const { data: buoy } = await supabase.from('buoy_readings').select('water_temp')
        .eq('buoy_id', spot.buoy_id).order('timestamp', { ascending: false }).limit(1).maybeSingle()
      if (buoy?.water_temp != null) waterTemp = Math.round((buoy.water_temp * 9 / 5) + 32)
    }

    const forecastData = formatForecastData(spot, forecasts, tides || [], waterTemp)
    const result = await generateSummary(forecastData)

    // Never overwrite a good summary with a failure
    if (!result.text) return { success: false, error: result.error }

    await supabase.from('spot_summaries').upsert({
      spot_id: spotId,
      summary: result.text,
      generated_at: new Date().toISOString(),
      forecast_date: new Date().toISOString().split('T')[0]
    }, { onConflict: 'spot_id,forecast_date' })

    return { success: true, summary: result.text }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ---- Main handler ---------------------------------------------------------------

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let limit = 10
  let offset = 0
  let spotId: string | null = null
  try {
    const body = await req.json()
    if (body.limit) limit = Math.min(body.limit, 20)
    if (body.offset) offset = body.offset
    if (body.spot_id) spotId = body.spot_id
  } catch {
    // No body, use defaults
  }

  // One spot, by hand. Not logged as a pipeline run.
  if (spotId) {
    const r = await generateSpotSummary(spotId)
    return json(r, r.success ? 200 : 500)
  }

  const runId = await startRun(supabase, 'generate-all-summaries', `${offset}-${offset + limit - 1}`)

  try {
    const { data: spots, error } = await supabase
      .from('spots')
      .select('id, name')
      .order('name')
      .range(offset, offset + limit - 1)

    if (error || !spots) throw new Error(`Failed to fetch spots: ${error?.message}`)

    const results = []
    for (const spot of spots) {
      const result = await generateSpotSummary(spot.id)
      results.push({ spot: spot.name, status: result.success ? 'success' : 'failed', error: result.error })
      await new Promise(r => setTimeout(r, 500))
    }

    const ok = results.filter(r => r.status === 'success').length
    const failed = results.length - ok
    const firstErr = results.find(r => r.error)

    await finishRun(supabase, runId, {
      status: failed === 0 ? 'ok' : ok === 0 ? 'error' : 'partial',
      processed: ok,
      failed,
      error: firstErr ? `${firstErr.spot}: ${firstErr.error}` : null,
      summary: { failures: results.filter(r => r.status === 'failed').slice(0, 5) },
    })

    return json({ processed: spots.length, successful: ok, failed, offset, results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    await finishRun(supabase, runId, { status: 'error', error: msg })
    return json({ error: msg }, 500)
  }
})
