// Forecast sponsorship: one local sponsor per spot, sold by hand for now.
// The open slot is a mailto; once a sponsor pays, a row in spot_sponsors
// turns the slot into their card. See supabase/migrations/2026-11-02-spot-sponsors.sql.

export const SPONSOR_PRICE = '$49'
const SPONSOR_EMAIL = 'harrisonkug@gmail.com'

export function useSponsor() {
  // Prefilled email so the inquiry arrives with the spot already named.
  const sponsorMailto = (spotName) => {
    const subject = `Sponsor the ${spotName} forecast on Howzit`
    const body = [
      'Hi Harrison,',
      '',
      `I'd like to sponsor the ${spotName} forecast on Howzit (${SPONSOR_PRICE}/mo).`,
      '',
      'Business name:',
      'Website:',
      'Phone:',
      ''
    ].join('\n')
    return `mailto:${SPONSOR_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  // UTM-tag the sponsor's link so they can see Howzit traffic in their own
  // analytics. That number is what keeps them renewing.
  const sponsorHref = (sponsor, spotSlug) => {
    if (!sponsor?.website_url) return null
    try {
      const url = new URL(sponsor.website_url)
      url.searchParams.set('utm_source', 'howzit')
      url.searchParams.set('utm_medium', 'sponsor')
      if (spotSlug) url.searchParams.set('utm_campaign', spotSlug)
      return url.toString()
    } catch {
      return sponsor.website_url
    }
  }

  return { sponsorMailto, sponsorHref, price: SPONSOR_PRICE }
}
