import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { DATA_FRESHNESS, SITE_URL, bestSwell, bestWind, stateSlug } from './spot-text'

// Markdown index of one state, served at /api/spots/state/{state-slug}.md
export async function renderStateMarkdown(event: H3Event, slug: string): Promise<string | null> {
  const supabase = await serverSupabaseClient(event)

  const { data: all, error } = await supabase
    .from('spots')
    .select('*')
    .order('name')

  if (error || !all?.length) throw new Error('Failed to fetch spots')

  const spots = all.filter(s => s.state && stateSlug(s.state) === slug)
  if (!spots.length) return null

  const stateName = spots[0].state
  const otherStates = [...new Set(all.map(s => s.state).filter(Boolean))].filter(s => s !== stateName).sort()

  let md = `# ${stateName} Surf Forecast

**Spots:** ${spots.length}
**Updated:** ${new Date().toISOString()}
**Source:** [Howzit](${SITE_URL}/spots/state/${slug})

---

## Surf Spots in ${stateName}

| Spot | Region | Best Swell | Break Type | Forecast |
|------|--------|------------|------------|----------|
`

  for (const spot of spots) {
    md += `| ${spot.name} | ${spot.region || '-'} | ${bestSwell(spot)} | ${spot.break_type || 'N/A'} | [View](${SITE_URL}/spots/${spot.slug}.md) |\n`
  }

  md += `
---

## Spot Details

`

  for (const spot of spots) {
    md += `### ${spot.name}

${spot.description || `Surf spot in ${spot.region || stateName}.`}

- **Location:** ${spot.region || stateName}
- **Coordinates:** ${spot.latitude}, ${spot.longitude}
- **Best Swell:** ${bestSwell(spot)}
- **Best Wind:** ${bestWind(spot)}
- **Skill Level:** ${spot.skill_level || 'N/A'}
- **[Full Forecast](${SITE_URL}/spots/${spot.slug}.md)**

`
  }

  md += `---

## About This Data

Forecasts blend Open-Meteo Marine, NOAA WaveWatch III, and ECMWF WAM, checked against NOAA NDBC buoys. Tides from NOAA CO-OPS.

${DATA_FRESHNESS}

---

## Other States

${otherStates.map(s => `- [${s}](${SITE_URL}/api/spots/state/${stateSlug(s)}.md)`).join('\n')}

---

**Website:** ${SITE_URL}
**All Spots:** [View Index](${SITE_URL}/spots.md)
`

  return md
}
