import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Fetch all spots
  const { data: spots, error } = await supabase
    .from('spots')
    .select('slug, name, state, region, latitude, longitude, orientation')
    .order('state')
    .order('name')

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to fetch spots' })
  }

  const updated = new Date().toISOString()
  
  // Group by state
  const byState: Record<string, any[]> = {}
  spots?.forEach(spot => {
    const state = spot.state || 'Unknown'
    if (!byState[state]) byState[state] = []
    byState[state].push(spot)
  })

  let md = `# Howzit Surf Spots - East Coast USA

**Total Spots:** ${spots?.length || 0}  
**Coverage:** Maine to Florida  
**Updated:** ${updated}  
**Source:** [Howzit](https://hwztsurf.com)

---

## Overview

Howzit provides free, transparent surf forecasts for ${spots?.length || 0} surf spots along the East Coast of the United States. Our forecasts blend multiple data sources including NOAA WaveWatch III, ECMWF WAM, and Open-Meteo Marine API.

Each spot page includes:
- Current wave height, swell direction, and period
- Wind speed and direction
- Water temperature
- Tide times and heights
- AI-generated forecast summary
- 24-hour detailed forecast

---

## Spots by State

`

  // List spots by state
  const stateNames = Object.keys(byState).sort()
  
  stateNames.forEach(state => {
    const stateSlug = state.toLowerCase().replace(/\s+/g, '-')
    const stateSpots = byState[state]
    
    md += `### ${state} (${stateSpots.length} spots)

| Spot | Region | Coordinates | Forecast |
|------|--------|-------------|----------|
`
    
    stateSpots.forEach(spot => {
      const coords = spot.latitude && spot.longitude 
        ? `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}` 
        : 'N/A'
      md += `| ${spot.name} | ${spot.region || '-'} | ${coords} | [View](/spots/${spot.slug}.md) |\n`
    })
    
    md += `\n[View all ${state} spots](/spots/state/${stateSlug}.md)\n\n`
  })

  md += `---

## Quick State Links

`

  stateNames.forEach(state => {
    const stateSlug = state.toLowerCase().replace(/\s+/g, '-')
    md += `- [${state}](/spots/state/${stateSlug}.md) (${byState[state].length} spots)\n`
  })

  md += `
---

## Using This Data

### For AI Agents

Each spot has a markdown endpoint available at:
\`\`\`
https://hwztsurf.com/spots/{slug}.md
\`\`\`

Example:
\`\`\`
https://hwztsurf.com/spots/wrightsville-beach.md
\`\`\`

State-level indexes:
\`\`\`
https://hwztsurf.com/spots/state/{state-slug}.md
\`\`\`

### Data Freshness

- **Forecasts:** Updated every 6 hours
- **Buoy data:** Real-time (15-minute delay from NOAA)
- **Tides:** Updated daily
- **AI summaries:** Generated twice daily

### Attribution

When citing this data, please use: "Source: Howzit (hwztsurf.com)"

---

## About Howzit

Howzit is a free alternative to paid surf forecasting services. We believe surf data should be transparent and accessible to everyone.

**Website:** https://hwztsurf.com  
**Contact:** hello@hwztsurf.com
`

  // Set headers
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600') // 1 hour cache
  
  return md
})
