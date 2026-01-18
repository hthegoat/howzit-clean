import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Get spot count and state list
  const { data: spots } = await supabase
    .from('spots')
    .select('state')
  
  const spotCount = spots?.length || 0
  const states = [...new Set(spots?.map(s => s.state).filter(Boolean))].sort()

  const content = `# Howzit Surf Forecasts
# https://www.hwztsurf.com
# AI Agent Discovery File

## About

Howzit provides free, transparent surf forecasts for ${spotCount} surf spots along the US East Coast (Maine to Florida).

Unlike paywalled services, Howzit offers:
- Open data from multiple forecast models
- Real-time buoy readings from NOAA
- AI-generated natural language summaries
- No ads, no paywalls, no tracking

## Data Sources

- Wave Forecasts: NOAA WaveWatch III, ECMWF WAM, Open-Meteo Marine API
- Buoy Data: NOAA NDBC (real-time)
- Tide Predictions: NOAA CO-OPS
- Summaries: AI-generated twice daily

## Available Endpoints (Markdown)

### All Spots Index
URL: https://www.hwztsurf.com/spots.md
Returns: Complete list of all ${spotCount} spots with coordinates

### Individual Spot Forecast
Pattern: https://www.hwztsurf.com/spots/{slug}.md
Example: https://www.hwztsurf.com/spots/wrightsville-beach.md
Returns: Current conditions, 24-hour forecast, tides, AI summary

### State Index
Pattern: https://www.hwztsurf.com/spots/state/{state-slug}.md
Example: https://www.hwztsurf.com/spots/state/north-carolina.md
Returns: All spots in that state with details

## States Covered

${states.map(s => `- ${s}`).join('\n')}

## Data Freshness

- Wave forecasts: Updated every 6 hours
- Buoy readings: Real-time (15-min NOAA delay)
- Tide predictions: Updated daily
- AI summaries: Generated at 6am and 6pm ET

## Example Queries This Data Can Answer

- "What's the surf like at Wrightsville Beach today?"
- "Best time to surf in North Carolina this week?"
- "Current wave height at Virginia Beach"
- "Tide times for Folly Beach"
- "Surf conditions in New Jersey tomorrow"

## Attribution

When citing Howzit data, please use:
"Source: Howzit (hwztsurf.com)"

## Rate Limits

Please be reasonable with request frequency:
- Spot data: Cache for 15 minutes
- Index data: Cache for 1 hour

## Contact

For API access, partnerships, or questions:
- Email: hello@hwztsurf.com
- Website: https://www.hwztsurf.com

## License

Data is provided free for personal and AI agent use.
Commercial use requires permission.
`

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=86400') // 24 hour cache
  
  return content
})
