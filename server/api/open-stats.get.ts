import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)

  const [
    { count: spotCount },
    { count: forecastCount },
    { count: buoyReadingCount },
    { count: summaryCount },
    { count: tideCount },
    { count: userCount },
    { count: proCount },
    { count: foundingCount },
    { data: latestForecast },
    { data: latestBuoy },
    { data: latestSummary },
    { data: states }
  ] = await Promise.all([
    supabase.from('spots').select('*', { count: 'exact', head: true }),
    supabase.from('forecasts').select('*', { count: 'exact', head: true }),
    supabase.from('buoy_readings').select('*', { count: 'exact', head: true }),
    supabase.from('spot_summaries').select('*', { count: 'exact', head: true }),
    supabase.from('tides').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tier', 'pro'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tier', 'founding'),
    supabase.from('forecasts').select('fetched_at').order('fetched_at', { ascending: false }).limit(1),
    supabase.from('buoy_readings').select('fetched_at').order('fetched_at', { ascending: false }).limit(1),
    supabase.from('spot_summaries').select('generated_at').order('generated_at', { ascending: false }).limit(1),
    supabase.from('spots').select('state')
  ])

  const uniqueStates = [...new Set(states?.map(s => s.state).filter(Boolean))]

  return {
    spots: spotCount || 0,
    states: uniqueStates.length,
    forecasts: forecastCount || 0,
    buoyReadings: buoyReadingCount || 0,
    summaries: summaryCount || 0,
    tides: tideCount || 0,
    users: userCount || 0,
    proMembers: proCount || 0,
    foundingMembers: foundingCount || 0,
    proSlotsRemaining: 1000 - (proCount || 0) - (foundingCount || 0),
    lastForecastUpdate: latestForecast?.[0]?.fetched_at || null,
    lastBuoyUpdate: latestBuoy?.[0]?.fetched_at || null,
    lastSummaryUpdate: latestSummary?.[0]?.generated_at || null,
  }
})
