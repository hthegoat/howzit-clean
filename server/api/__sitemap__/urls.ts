import { serverSupabaseClient } from '#supabase/server'

export default defineSitemapEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  
  // Fetch all spots
  const { data: spots } = await supabase
    .from('spots')
    .select('slug, state')
  
  const urls = []
  const now = new Date().toISOString()
  
  // Add spot pages
  if (spots) {
    spots.forEach(spot => {
      urls.push({
        loc: `/spots/${spot.slug}`,
        lastmod: now,
        changefreq: 'hourly',
        priority: 0.8
      })
    })
    
    // Add unique state pages
    const states = [...new Set(spots.map(s => s.state).filter(Boolean))]
    states.forEach(state => {
      urls.push({
        loc: `/spots/state/${state.toLowerCase().replace(/\s+/g, '-')}`,
        lastmod: now,
        changefreq: 'hourly',
        priority: 0.7
      })
    })
  }
  
  // Add homepage
  urls.push({
    loc: '/',
    lastmod: now,
    changefreq: 'daily',
    priority: 1.0
  })
  
  // Add spots index
  urls.push({
    loc: '/spots',
    lastmod: now,
    changefreq: 'hourly',
    priority: 0.9
  })
  
  // Add blog posts
  const blogPosts = [
    'free-surf-report-app-no-ads',
    'how-to-read-a-surf-report',
    '3-wave-forecast-models',
    'swell-period-and-direction-explained',
    'how-far-ahead-trust-surf-forecast',
    'best-beginner-surf-spots-east-coast',
    'how-to-score-surf-noreasters-east-coast',
    'winter-storm-fern-surf-forecast-january-2026'
  ]
  
  blogPosts.forEach(slug => {
    urls.push({
      loc: `/blog/${slug}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.7
    })
  })
  
  // Add blog index
  urls.push({
    loc: '/blog',
    lastmod: now,
    changefreq: 'weekly',
    priority: 0.6
  })
  
  // Add static pages
  urls.push({
    loc: '/about',
    lastmod: now,
    changefreq: 'monthly',
    priority: 0.4
  })
  
  urls.push({
    loc: '/how-we-rate',
    lastmod: now,
    changefreq: 'monthly',
    priority: 0.5
  })
  
  urls.push({
    loc: '/waitlist',
    lastmod: now,
    changefreq: 'monthly',
    priority: 0.5
  })
  
  return urls
})
