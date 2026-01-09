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
  
  return urls
})
