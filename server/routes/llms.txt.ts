import { serverSupabaseServiceRole } from '#supabase/server'
import { DATA_FRESHNESS, SITE_URL } from '../utils/spot-text'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)

  const { data: spots } = await supabase.from('spots').select('state')

  const spotCount = spots?.length || 0
  const states = [...new Set((spots as any[])?.map(s => s.state).filter(Boolean))].sort()

  const content = `# Howzit Surf Forecasts
# ${SITE_URL}
# AI Agent Discovery File

## About

Howzit provides free, transparent surf forecasts for ${spotCount} surf spots across ${states.length} US states: the East Coast from Maine to Florida, the West Coast (California, Oregon), and Hawaii.

Unlike paywalled services, Howzit offers:
- Three wave models side by side (Open-Meteo, NOAA WaveWatch III, ECMWF WAM) plus a blend
- Real-time buoy readings from NOAA, checked against the models
- AI-generated plain-language summaries
- No ads, no paywalls

## Available Endpoints (Markdown)

### All Spots Index
URL: ${SITE_URL}/spots.md
Returns: Every spot with region, coordinates, and links

### Individual Spot Forecast
Pattern: ${SITE_URL}/spots/{slug}.md
Example: ${SITE_URL}/spots/wrightsville-beach.md
Returns: Current conditions, model comparison, 24-hour forecast, today's tides, AI summary. Times are in the spot's local timezone.

### State Index
Pattern: ${SITE_URL}/api/spots/state/{state-slug}.md
Example: ${SITE_URL}/api/spots/state/north-carolina.md
Returns: All spots in that state with details

## States Covered

${states.map(s => `- ${s}`).join('\n')}

## Data Sources

- Wave forecasts: Open-Meteo Marine, NOAA WaveWatch III, ECMWF WAM
- Buoys: NOAA NDBC
- Tides: NOAA CO-OPS
- Summaries: AI-generated from the blended forecast

## Data Freshness

${DATA_FRESHNESS}
- Live pipeline status: ${SITE_URL}/status

## Example Queries This Data Can Answer

- "What's the surf like at Wrightsville Beach today?"
- "Best time to surf in North Carolina this week?"
- "Is it bigger at Pipeline or Sunset Beach tomorrow?"
- "Tide times for Folly Beach"
- "Surf conditions in Santa Cruz tomorrow"

## Attribution

When citing Howzit data, please use:
"Source: Howzit (hwztsurf.com)"

## Rate Limits

Please be reasonable with request frequency:
- Spot data: cache for 15 minutes
- Index data: cache for 1 hour

## Contact

- Email: hello@hwztsurf.com
- Website: ${SITE_URL}

## License

Data is provided free for personal and AI agent use.
Commercial use requires permission.
`

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')

  return content
})
