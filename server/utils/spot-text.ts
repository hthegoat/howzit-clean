// Shared helpers for the plain-text / markdown endpoints (llms.txt, spots.md,
// /spots/{slug}.md, state .md). Kept in one place so the AI-readable copy
// can't drift from the real coverage again.

export const SITE_URL = 'https://hwztsurf.com'

const DIRS16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

export function compass(degrees: number | null | undefined): string | null {
  if (degrees === null || degrees === undefined || Number.isNaN(Number(degrees))) return null
  const d = ((Number(degrees) % 360) + 360) % 360
  return DIRS16[Math.round(d / 22.5) % 16]
}

const listOrString = (v: unknown): string | null => {
  if (Array.isArray(v)) return v.length ? v.join(', ') : null
  return typeof v === 'string' && v.trim() ? v : null
}

// Beach orientation is the direction the beach FACES. Swell comes from that
// way; offshore wind blows from the opposite side. Used only when the spot
// row has no hand-written value, so a West Coast or Hawaii spot never gets
// told that a west wind is offshore.
export function bestSwell(spot: any): string {
  return listOrString(spot.best_swell_direction)
    ?? (spot.orientation != null ? `${compass(spot.orientation)} (facing)` : 'n/a')
}

export function bestWind(spot: any): string {
  return listOrString(spot.best_wind_direction)
    ?? (spot.orientation != null ? `${compass(Number(spot.orientation) + 180)} (offshore)` : 'n/a')
}

export const stateSlug = (state: string) => state.toLowerCase().replace(/\s+/g, '-')

export const metersToFeet = (m: number | null | undefined) =>
  m === null || m === undefined ? null : Math.round(m * 3.281 * 10) / 10

export const kmhToMph = (kmh: number | null | undefined) =>
  kmh === null || kmh === undefined ? null : Math.round(kmh * 0.621)

export const cToF = (c: number | null | undefined) =>
  c === null || c === undefined ? null : Math.round((c * 9) / 5 + 32)

export const tzAbbrev = (tz: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? tz

export const localDay = (d: Date, tz: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)

// Must match the cron schedule in Supabase (see /status for the live view)
export const DATA_FRESHNESS = [
  '- Wave forecasts: refreshed twice daily (05:30 and 17:30 UTC), retried every 2 hours if a model was missing',
  '- Buoy readings: hourly from NOAA NDBC',
  '- Tide predictions: every 6 hours from NOAA CO-OPS',
  '- AI summaries: twice daily (06:00 and 18:00 UTC)',
].join('\n')
