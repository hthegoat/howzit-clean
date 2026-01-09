import { createClient } from '@supabase/supabase-js'

export default defineSitemapEventHandler(async () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return []
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Fetch all spots with their latest forecast timestamp
  const { data: spots } = await supabase
    .from('spots')
    .select('slug, state, updated_at')
  
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
