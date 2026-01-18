import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Get state slug and remove .md extension if present
  let stateSlug = getRouterParam(event, 'state') || ''
  stateSlug = stateSlug.replace(/\.md$/, '')
  
  if (!stateSlug) {
    throw createError({ statusCode: 400, message: 'State required' })
  }

  // Convert slug back to state name (e.g., "north-carolina" -> "North Carolina")
  const stateName = stateSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const supabase = await serverSupabaseClient(event)
  
  // Fetch spots for this state
  const { data: spots, error } = await supabase
    .from('spots')
    .select('*')
    .ilike('state', stateName)
    .order('name')

  if (error || !spots || spots.length === 0) {
    throw createError({ statusCode: 404, message: `No spots found for state: ${stateName}` })
  }

  const updated = new Date().toISOString()

  let md = `# ${stateName} Surf Forecast

**Spots:** ${spots.length}  
**Updated:** ${updated}  
**Source:** [Howzit](https://www.hwztsurf.com)

---

## Surf Spots in ${stateName}

| Spot | Region | Best Swell | Break Type | Forecast |
|------|--------|------------|------------|----------|
`

  spots.forEach(spot => {
    md += `| ${spot.name} | ${spot.region || '-'} | ${spot.best_swell_direction || 'E-SE'} | ${spot.break_type || 'Beach'} | [View](/spots/${spot.slug}.md) |\n`
  })

  md += `
---

## Spot Details

`

  spots.forEach(spot => {
    md += `### ${spot.name}

${spot.description || `Surf spot in ${spot.region || stateName}.`}

- **Location:** ${spot.region || stateName}
- **Coordinates:** ${spot.latitude}, ${spot.longitude}
- **Best Swell:** ${spot.best_swell_direction || 'E, ESE, SE'}
- **Best Wind:** ${spot.best_wind_direction || 'W, NW (offshore)'}
- **Skill Level:** ${spot.skill_level || 'All levels'}
- **[Full Forecast →](/spots/${spot.slug}.md)**

`
  })

  md += `---

## About This Data

Howzit provides free surf forecasts using data from:
- NOAA WaveWatch III
- ECMWF WAM
- Open-Meteo Marine API
- NOAA NDBC Buoys
- NOAA CO-OPS Tides

### Data Freshness

- Forecasts updated every 6 hours
- Buoy readings are real-time (15-minute delay)
- Tide predictions updated daily

---

## Other States

View surf spots in other East Coast states:

- [Maine](/spots/state/maine.md)
- [New Hampshire](/spots/state/new-hampshire.md)
- [Massachusetts](/spots/state/massachusetts.md)
- [Rhode Island](/spots/state/rhode-island.md)
- [Connecticut](/spots/state/connecticut.md)
- [New York](/spots/state/new-york.md)
- [New Jersey](/spots/state/new-jersey.md)
- [Delaware](/spots/state/delaware.md)
- [Maryland](/spots/state/maryland.md)
- [Virginia](/spots/state/virginia.md)
- [North Carolina](/spots/state/north-carolina.md)
- [South Carolina](/spots/state/south-carolina.md)
- [Georgia](/spots/state/georgia.md)
- [Florida](/spots/state/florida.md)

---

**Website:** https://www.hwztsurf.com  
**All Spots:** [View Index](/spots.md)
`

  // Set headers
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600') // 1 hour cache
  
  return md
})
