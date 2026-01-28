// Redirect old/incorrect spot slugs to correct ones
const spotRedirects: Record<string, string> = {
  'narragansett-town-beach': 'narragansett-beach',
  'narragansett': 'narragansett-beach',
  'newport-ri': 'newport',  // Update if different in your DB
  'lbi-surf-city': 'surf-city',  // Update if different in your DB
  'ocean-city-md': 'ocean-city',  // Update if different in your DB
}

export default defineEventHandler((event) => {
  const path = event.path
  
  // Check for spot redirects
  if (path.startsWith('/spots/')) {
    const slug = path.replace('/spots/', '').replace(/\/$/, '')
    
    if (spotRedirects[slug]) {
      return sendRedirect(event, `/spots/${spotRedirects[slug]}`, 301)
    }
  }
})
