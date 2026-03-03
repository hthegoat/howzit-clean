import { serverSupabaseClient } from '#supabase/server'
import type { SitemapUrlInput } from '#sitemap/types'

export default defineSitemapEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  // Fetch spots with their most recent forecast timestamp
  const { data: spots } = await supabase
    .from('spots')
    .select('slug, state, id') as { data: { slug: string; state: string; id: string }[] | null }

  // Get the most recent forecast timestamp per spot using RPC or direct query
  // Note: default Supabase limit is 1000 rows, so we query per-spot max timestamps
  const lastmodBySpot: Record<string, string> = {}
  
  if (spots) {
    // Batch: get latest fetched_at for all spots in one query
    const { data: latestForecasts } = await supabase
      .rpc('get_latest_forecast_timestamps') as { data: { spot_id: string; latest_fetched_at: string }[] | null }
    
    if (latestForecasts) {
      latestForecasts.forEach(f => {
        if (f.latest_fetched_at) {
          lastmodBySpot[f.spot_id] = f.latest_fetched_at
        }
      })
    }
  }

  const urls: SitemapUrlInput[] = []
  const now = new Date().toISOString()
  // Fallback date for pages without dynamic data
  const staticDate = '2026-01-15T00:00:00Z'

  // Track latest forecast across all spots (for index/state pages)
  let latestOverall = staticDate

  // Add spot pages
  if (spots) {
    spots.forEach(spot => {
      const spotLastmod = lastmodBySpot[spot.id] || staticDate
      if (spotLastmod > latestOverall) latestOverall = spotLastmod

      urls.push({
        loc: `/spots/${spot.slug}`,
        lastmod: spotLastmod,
        changefreq: 'hourly',
        priority: 0.8
      })
    })

    // Add unique state pages — use latest forecast from any spot in that state
    const stateSpots: Record<string, typeof spots> = {}
    spots.forEach(s => {
      if (!stateSpots[s.state]) stateSpots[s.state] = []
      stateSpots[s.state].push(s)
    })

    Object.entries(stateSpots).forEach(([state, stateSpotList]) => {
      const stateLastmod = stateSpotList.reduce((latest, s) => {
        const ts = lastmodBySpot[s.id] || staticDate
        return ts > latest ? ts : latest
      }, staticDate)

      urls.push({
        loc: `/spots/state/${state.toLowerCase().replace(/\s+/g, '-')}`,
        lastmod: stateLastmod,
        changefreq: 'hourly',
        priority: 0.7
      })
    })
  }

  // Add homepage
  urls.push({
    loc: '/',
    lastmod: latestOverall,
    changefreq: 'daily',
    priority: 1.0
  })

  // Add spots index
  urls.push({
    loc: '/spots',
    lastmod: latestOverall,
    changefreq: 'hourly',
    priority: 0.9
  })

  // Add blog posts — use static dates (update when you publish new posts)
  const blogPosts = [
    { slug: 'free-surf-report-app-no-ads', date: '2025-12-01T00:00:00Z' },
    { slug: 'how-to-read-a-surf-report', date: '2025-12-05T00:00:00Z' },
    { slug: '3-wave-forecast-models', date: '2025-12-10T00:00:00Z' },
    { slug: 'swell-period-and-direction-explained', date: '2025-12-15T00:00:00Z' },
    { slug: 'how-far-ahead-trust-surf-forecast', date: '2025-12-20T00:00:00Z' },
    { slug: 'best-beginner-surf-spots-east-coast', date: '2026-01-05T00:00:00Z' },
    { slug: 'how-to-score-surf-noreasters-east-coast', date: '2026-01-10T00:00:00Z' },
    { slug: 'winter-storm-fern-surf-forecast-january-2026', date: '2026-01-20T00:00:00Z' }
  ]

  blogPosts.forEach(post => {
    urls.push({
      loc: `/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: 0.7
    })
  })

  // Add blog index
  urls.push({
    loc: '/blog',
    lastmod: blogPosts[blogPosts.length - 1].date,
    changefreq: 'weekly',
    priority: 0.6
  })

  // Add static pages
  urls.push({
    loc: '/about',
    lastmod: staticDate,
    changefreq: 'monthly',
    priority: 0.4
  })

  urls.push({
    loc: '/how-we-rate',
    lastmod: staticDate,
    changefreq: 'monthly',
    priority: 0.5
  })

  urls.push({
    loc: '/open',
    lastmod: now,
    changefreq: 'daily',
    priority: 0.5
  })

  urls.push({
    loc: '/changelog',
    lastmod: now,
    changefreq: 'weekly',
    priority: 0.5
  })

  return urls
})
