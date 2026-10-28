// Old or guessed spot URLs -> where they should go. Every target is checked
// against the live spots table; a redirect to a slug that doesn't exist is a
// soft 404 with extra steps.
const spotRedirects: Record<string, string> = {
  'narragansett-town-beach': '/spots/narragansett-beach',
  'narragansett': '/spots/narragansett-beach',
  'newport-ri': '/spots/ruggles',               // Ruggles is the Newport break
  'newport': '/spots/ruggles',
  'lbi-surf-city': '/spots/long-beach-island',
  'surf-city': '/spots/long-beach-island',
  'ocean-city-md': '/spots/ocean-city-inlet',   // plain ocean-city is the NJ one
}

export default defineEventHandler((event) => {
  const path = event.path.split('?')[0]
  if (!path.startsWith('/spots/')) return

  const slug = path.slice('/spots/'.length).replace(/\/$/, '')
  const target = spotRedirects[slug]
  if (target) return sendRedirect(event, target, 301)
})
