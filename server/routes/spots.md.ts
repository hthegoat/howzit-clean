import { serverSupabaseClient } from '#supabase/server'
import { DATA_FRESHNESS, SITE_URL, stateSlug } from '../utils/spot-text'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  const { data: spots, error } = await supabase
    .from('spots')
    .select('slug, name, state, region, latitude, longitude')
    .order('state')
    .order('name')

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to fetch spots' })
  }

  const byState: Record<string, any[]> = {}
  spots?.forEach(spot => {
    const state = spot.state || 'Unknown'
    if (!byState[state]) byState[state] = []
    byState[state].push(spot)
  })
  const stateNames = Object.keys(byState).sort()

  let md = `# Howzit Surf Spots - United States

**Total Spots:** ${spots?.length || 0}
**States:** ${stateNames.length} (East Coast, West Coast, Hawaii)
**Updated:** ${new Date().toISOString()}
**Source:** [Howzit](${SITE_URL})

---

## Overview

Howzit provides free, transparent surf forecasts for ${spots?.length || 0} US surf spots. Each spot shows three wave models side by side (Open-Meteo Marine, NOAA WaveWatch III, ECMWF WAM), a blend, live NOAA buoy data, tides, and an AI summary.

---

## Spots by State

`

  for (const state of stateNames) {
    const list = byState[state]
    md += `### ${state} (${list.length} spots)

| Spot | Region | Coordinates | Forecast |
|------|--------|-------------|----------|
`
    for (const spot of list) {
      const coords = spot.latitude != null && spot.longitude != null
        ? `${Number(spot.latitude).toFixed(4)}, ${Number(spot.longitude).toFixed(4)}`
        : 'N/A'
      md += `| ${spot.name} | ${spot.region || '-'} | ${coords} | [View](${SITE_URL}/spots/${spot.slug}.md) |\n`
    }
    md += `\n[All ${state} spots](${SITE_URL}/api/spots/state/${stateSlug(state)}.md)\n\n`
  }

  md += `---

## Using This Data

Each spot has a markdown endpoint:
\`\`\`
${SITE_URL}/spots/{slug}.md
\`\`\`

State-level indexes:
\`\`\`
${SITE_URL}/api/spots/state/{state-slug}.md
\`\`\`

### Data Freshness

${DATA_FRESHNESS}

### Attribution

When citing this data, please use: "Source: Howzit (hwztsurf.com)"

---

**Website:** ${SITE_URL}
**Contact:** hello@hwztsurf.com
`

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  return md
})
