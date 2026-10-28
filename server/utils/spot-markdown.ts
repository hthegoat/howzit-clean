import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import {
  SITE_URL, compass, bestSwell, bestWind, stateSlug,
  metersToFeet, kmhToMph, cToF, tzAbbrev, localDay
} from './spot-text'

// Markdown version of a spot page, served at /spots/{slug}.md for AI agents.
// All times are in the spot's own timezone (spots.timezone).

export async function renderSpotMarkdown(event: H3Event, slug: string): Promise<string | null> {
  const supabase = await serverSupabaseClient(event)

  const { data: spot } = await supabase.from('spots').select('*').eq('slug', slug).maybeSingle()
  if (!spot) return null

  const now = new Date()
  const twoDaysOut = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [forecastRes, buoyRes, tideRes, summaryRes] = await Promise.all([
    supabase.from('forecasts').select('*')
      .eq('spot_id', spot.id)
      .gte('timestamp', now.toISOString())
      .lte('timestamp', twoDaysOut.toISOString())
      .order('timestamp', { ascending: true }),
    spot.buoy_id
      ? supabase.from('buoy_readings').select('*')
        .eq('buoy_id', spot.buoy_id).order('timestamp', { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('tides').select('*')
      .eq('spot_id', spot.id)
      .gte('timestamp', dayAgo.toISOString())
      .lte('timestamp', twoDaysOut.toISOString())
      .order('timestamp', { ascending: true }),
    supabase.from('spot_summaries').select('summary, generated_at')
      .eq('spot_id', spot.id).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  return buildSpotMarkdown(spot, forecastRes.data || [], buoyRes.data, tideRes.data || [], summaryRes.data)
}

function buildSpotMarkdown(spot: any, forecasts: any[], buoy: any, tides: any[], summary: any): string {
  const tz: string = spot.timezone || 'America/New_York'
  const tzName = tzAbbrev(tz)
  const now = new Date()
  const f = forecasts[0]

  const time = (d: Date, withMinutes = true) =>
    d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', ...(withMinutes ? { minute: '2-digit' } : {}) })
  const dayTime = (d: Date) =>
    d.toLocaleString('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric' })

  const waveFt = metersToFeet(f?.blended_wave_height ?? f?.wave_height)
  const swellDir = f?.swell_wave_direction ?? f?.wave_direction
  const swellPeriod = f?.swell_wave_period ?? f?.wave_period
  // Buoy wind is m/s, forecast wind is km/h
  const windMph = buoy?.wind_speed != null ? Math.round(buoy.wind_speed * 2.237) : kmhToMph(f?.wind_speed)
  const windDir = buoy?.wind_direction ?? f?.wind_direction
  const waterF = cToF(buoy?.water_temp ?? f?.sea_surface_temp)

  const cell = (v: unknown, unit = '') => (v === null || v === undefined || v === '' ? 'N/A' : `${v}${unit}`)
  const dirCell = (deg: number | null | undefined) =>
    deg === null || deg === undefined ? 'N/A' : `${compass(deg)} (${Math.round(deg)}°)`

  let md = `# ${spot.name} Surf Forecast

**Location:** ${[spot.region, spot.state].filter(Boolean).join(', ')}
**Coordinates:** ${spot.latitude}, ${spot.longitude}
**Times:** local (${tzName})
**Updated:** ${now.toISOString()}
**Source:** [Howzit](${SITE_URL}/spots/${spot.slug})

---

## Current Conditions

| Metric | Value |
|--------|-------|
| Wave Height | ${cell(waveFt, ' ft')} |
| Swell Direction | ${dirCell(swellDir)} |
| Swell Period | ${cell(swellPeriod != null ? Math.round(swellPeriod) : null, ' sec')} |
| Wind Speed | ${cell(windMph, ' mph')} |
| Wind Direction | ${dirCell(windDir)} |
| Water Temp | ${cell(waterF, '°F')} |

`

  if (f && (f.ww3_wave_height != null || f.ecmwf_wave_height != null)) {
    md += `## Model Comparison (next hour)

| Model | Wave Height | Period |
|-------|-------------|--------|
| Open-Meteo | ${cell(metersToFeet(f.wave_height), ' ft')} | ${cell(f.wave_period != null ? Math.round(f.wave_period) : null, 's')} |
| WaveWatch III | ${cell(metersToFeet(f.ww3_wave_height), ' ft')} | ${cell(f.ww3_wave_period != null ? Math.round(f.ww3_wave_period) : null, 's')} |
| ECMWF WAM | ${cell(metersToFeet(f.ecmwf_wave_height), ' ft')} | ${cell(f.ecmwf_wave_period != null ? Math.round(f.ecmwf_wave_period) : null, 's')} |
| Howzit blend | ${cell(metersToFeet(f.blended_wave_height), ' ft')} | ${cell(f.blended_wave_period != null ? Math.round(f.blended_wave_period) : null, 's')} |

`
  }

  if (summary?.summary) {
    md += `## Forecast Summary

${summary.summary}

*Generated ${new Date(summary.generated_at).toLocaleString('en-US', { timeZone: tz })} ${tzName}*

`
  }

  const today = localDay(now, tz)
  const todayTides = tides.filter(t => localDay(new Date(t.timestamp), tz) === today)
  if (todayTides.length) {
    md += `## Today's Tides

| Time (${tzName}) | Type | Height |
|------|------|--------|
`
    for (const t of todayTides) {
      md += `| ${time(new Date(t.timestamp))} | ${t.type} | ${t.height != null ? `${Number(t.height).toFixed(1)} ft` : 'N/A'} |\n`
    }
    md += '\n'
  }

  if (forecasts.length) {
    md += `## 24-Hour Forecast

| Time (${tzName}) | Waves | Direction | Period | Wind |
|------|-------|-----------|--------|------|
`
    for (const fc of forecasts.slice(0, 24)) {
      const h = metersToFeet(fc.blended_wave_height ?? fc.wave_height)
      const dir = compass(fc.swell_wave_direction ?? fc.wave_direction)
      const per = fc.swell_wave_period ?? fc.wave_period
      const wind = fc.wind_speed != null ? `${kmhToMph(fc.wind_speed)} mph ${compass(fc.wind_direction) ?? ''}`.trim() : 'N/A'
      md += `| ${dayTime(new Date(fc.timestamp))} | ${cell(h, ' ft')} | ${cell(dir)} | ${cell(per != null ? Math.round(per) : null, 's')} | ${wind} |\n`
    }
    md += '\n'
  }

  md += `## About ${spot.name}

${spot.description || `A surf spot in ${[spot.region, spot.state].filter(Boolean).join(', ')}.`}

| Attribute | Value |
|-----------|-------|
| Beach Orientation | ${spot.orientation != null ? `${spot.orientation}° (${compass(spot.orientation)}-facing)` : 'N/A'} |
| Best Swell Direction | ${bestSwell(spot)} |
| Best Wind | ${bestWind(spot)} |
| Best Tide | ${spot.best_tide || 'N/A'} |
| Break Type | ${spot.break_type || 'N/A'} |
| Skill Level | ${spot.skill_level || 'N/A'} |

### Data Sources

- **Forecasts:** Open-Meteo Marine, NOAA WaveWatch III, ECMWF WAM, blended
${spot.buoy_id ? `- **Buoy:** NOAA NDBC station ${spot.buoy_id}\n` : ''}- **Tides:** NOAA CO-OPS

---

**This spot:** ${SITE_URL}/spots/${spot.slug}
**All ${spot.state} spots:** ${SITE_URL}/api/spots/state/${stateSlug(spot.state)}.md
**All spots:** ${SITE_URL}/spots.md

When citing this data, please use: "Source: Howzit (hwztsurf.com)"
`

  return md
}
