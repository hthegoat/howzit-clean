import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Get slug and remove .md extension if present
  let slug = getRouterParam(event, 'slug') || ''
  slug = slug.replace(/\.md$/, '')
  
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Spot slug required' })
  }

  const supabase = await serverSupabaseClient(event)
  
  // Fetch spot data
  const { data: spot, error: spotError } = await supabase
    .from('spots')
    .select('*')
    .eq('slug', slug)
    .single()

  if (spotError || !spot) {
    throw createError({ statusCode: 404, message: 'Spot not found' })
  }

  // Fetch latest forecasts (next 48 hours)
  const now = new Date()
  const twoDaysOut = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  
  const { data: forecasts } = await supabase
    .from('forecasts')
    .select('*')
    .eq('spot_id', spot.id)
    .gte('timestamp', now.toISOString())
    .lte('timestamp', twoDaysOut.toISOString())
    .order('timestamp', { ascending: true })

  // Fetch latest buoy reading
  let buoyReading = null
  if (spot.buoy_id) {
    const { data: buoy } = await supabase
      .from('buoy_readings')
      .select('*')
      .eq('buoy_id', spot.buoy_id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()
    buoyReading = buoy
  }

  // Fetch today's tides
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowEnd = new Date(todayStart.getTime() + 48 * 60 * 60 * 1000)
  
  const { data: tides } = await supabase
    .from('tides')
    .select('*')
    .eq('spot_id', spot.id)
    .gte('timestamp', todayStart.toISOString())
    .lte('timestamp', tomorrowEnd.toISOString())
    .order('timestamp', { ascending: true })

  // Fetch AI summary
  const { data: summary } = await supabase
    .from('spot_summaries')
    .select('summary, generated_at')
    .eq('spot_id', spot.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  // Build markdown
  const markdown = buildSpotMarkdown(spot, forecasts || [], buoyReading, tides || [], summary)
  
  // Set headers
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=900, s-maxage=900') // 15 min cache
  
  return markdown
})

function formatDirection(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) return 'N/A'
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(degrees / 22.5) % 16]
}

function metersToFeet(m: number | null | undefined): number | null {
  if (m === null || m === undefined) return null
  return Math.round(m * 3.281 * 10) / 10
}

function kmhToMph(kmh: number | null | undefined): number | null {
  if (kmh === null || kmh === undefined) return null
  return Math.round(kmh * 0.621)
}

function celsiusToFahrenheit(c: number | null | undefined): number | null {
  if (c === null || c === undefined) return null
  return Math.round((c * 9/5) + 32)
}

function buildSpotMarkdown(
  spot: any, 
  forecasts: any[], 
  buoy: any, 
  tides: any[], 
  summary: any
): string {
  const now = new Date()
  const updated = now.toISOString()
  const f = forecasts[0] // Latest forecast
  
  // Current conditions - prefer buoy for some data, forecast for others
  const waveHeightM = f?.blended_wave_height ?? f?.wave_height
  const waveHeightFt = metersToFeet(waveHeightM)
  const swellDir = f?.swell_wave_direction ?? f?.wave_direction
  const swellPeriod = f?.swell_wave_period ?? f?.wave_period
  const windSpeedKmh = buoy?.wind_speed ? buoy.wind_speed * 3.6 : f?.wind_speed
  const windSpeedMph = kmhToMph(windSpeedKmh)
  const windDir = buoy?.wind_direction ?? f?.wind_direction
  const waterTempC = buoy?.water_temp ?? f?.sea_surface_temp
  const waterTempF = celsiusToFahrenheit(waterTempC)
  
  let md = `# ${spot.name} Surf Forecast

**Location:** ${spot.region || ''}, ${spot.state}  
**Coordinates:** ${spot.latitude}, ${spot.longitude}  
**Updated:** ${updated}  
**Source:** [Howzit](https://hwztsurf.com/spots/${spot.slug})

---

## Current Conditions

| Metric | Value |
|--------|-------|
| Wave Height | ${waveHeightFt ? `${waveHeightFt} ft` : 'N/A'} |
| Swell Direction | ${swellDir ? `${formatDirection(swellDir)} (${Math.round(swellDir)}°)` : 'N/A'} |
| Swell Period | ${swellPeriod ? `${Math.round(swellPeriod)} sec` : 'N/A'} |
| Wind Speed | ${windSpeedMph ? `${windSpeedMph} mph` : 'N/A'} |
| Wind Direction | ${windDir ? `${formatDirection(windDir)} (${Math.round(windDir)}°)` : 'N/A'} |
| Water Temp | ${waterTempF ? `${waterTempF}°F` : 'N/A'} |

`

  // Add AI summary if available
  if (summary?.summary) {
    md += `## Forecast Summary

${summary.summary}

*Last updated: ${new Date(summary.generated_at).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET*

`
  }

  // Today's tides
  if (tides.length > 0) {
    const todayTides = tides.filter(t => {
      const tideDate = new Date(t.timestamp)
      return tideDate.toDateString() === now.toDateString()
    })
    
    if (todayTides.length > 0) {
      md += `## Today's Tides

| Time (ET) | Type | Height |
|-----------|------|--------|
`
      todayTides.forEach(tide => {
        const time = new Date(tide.timestamp).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          timeZone: 'America/New_York'
        })
        const height = tide.height ? `${tide.height.toFixed(1)} ft` : 'N/A'
        md += `| ${time} | ${tide.type} | ${height} |\n`
      })
      md += '\n'
    }
  }

  // Hourly forecast (next 24 hours)
  if (forecasts.length > 0) {
    md += `## 24-Hour Forecast

| Time (ET) | Waves | Direction | Period | Wind |
|-----------|-------|-----------|--------|------|
`
    forecasts.slice(0, 24).forEach(fc => {
      const time = new Date(fc.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        timeZone: 'America/New_York'
      })
      const waveH = fc.blended_wave_height ?? fc.wave_height
      const waves = waveH ? `${metersToFeet(waveH)} ft` : 'N/A'
      const dir = fc.swell_wave_direction ?? fc.wave_direction
      const dirStr = dir ? formatDirection(dir) : 'N/A'
      const period = fc.swell_wave_period ?? fc.wave_period
      const periodStr = period ? `${Math.round(period)}s` : 'N/A'
      const wind = fc.wind_speed ? `${kmhToMph(fc.wind_speed)} mph ${formatDirection(fc.wind_direction)}` : 'N/A'
      
      md += `| ${time} | ${waves} | ${dirStr} | ${periodStr} | ${wind} |\n`
    })
    md += '\n'
  }

  // Spot details
  md += `## About ${spot.name}

${spot.description || 'A surf spot on the East Coast.'}

### Spot Details

| Attribute | Value |
|-----------|-------|
| Beach Orientation | ${spot.orientation ? `${spot.orientation}° (${formatDirection(spot.orientation)}-facing)` : 'N/A'} |
| Best Swell Direction | ${spot.best_swell_direction || 'E, ESE, SE'} |
| Best Wind | ${spot.best_wind_direction || 'W, NW (offshore)'} |
| Best Tide | ${spot.best_tide || 'All tides'} |
| Break Type | ${spot.break_type || 'Beach break'} |
| Skill Level | ${spot.skill_level || 'All levels'} |
| Crowd Level | ${spot.crowd_level || 'Varies'} |

`

  // Buoy info
  if (spot.buoy_id) {
    md += `### Data Sources

- **Buoy:** NOAA NDBC Station ${spot.buoy_id}
- **Forecasts:** Multi-model blend (NOAA WaveWatch III, ECMWF WAM, Open-Meteo Marine)
- **Tides:** NOAA CO-OPS

`
  }

  // Footer
  md += `---

## About Howzit

Howzit provides free, transparent surf forecasts for the East Coast. Unlike other services, we show you our data sources and don't hide behind paywalls.

**Website:** https://hwztsurf.com  
**This spot:** https://hwztsurf.com/spots/${spot.slug}

### Attribution

When citing this data, please use: "Source: Howzit (hwztsurf.com)"

### API Access

For commercial API access or partnerships, contact: hello@hwztsurf.com
`

  return md
}
