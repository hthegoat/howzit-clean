import { renderSpotMarkdown } from '../utils/spot-markdown'
import { renderStateMarkdown } from '../utils/state-markdown'
import { SITE_URL } from '../utils/spot-text'

// Markdown endpoints for AI agents (advertised in /llms.txt):
//   /spots/{slug}.md                 one spot
//   /api/spots/state/{state}.md      one state
//
// Handled here rather than as route files because routes named
// `[slug].md.get.ts` never matched: the router can't split one path segment
// into a param plus a `.md` suffix. The spot URL fell through to the Vue page
// and rendered "Loading..." with a 200; the state URL 404'd. llms.txt
// advertised both the whole time.
const SPOT_MD = /^\/spots\/([a-z0-9-]+)\.md$/
const STATE_MD = /^\/api\/spots\/state\/([a-z0-9-]+)\.md$/

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]

  const spot = path.match(SPOT_MD)
  const state = spot ? null : path.match(STATE_MD)
  if (!spot && !state) return

  const md = spot
    ? await renderSpotMarkdown(event, spot[1])
    : await renderStateMarkdown(event, state![1])

  if (!md) {
    throw createError({
      statusCode: 404,
      statusMessage: `Not found: ${path}. Index of everything: ${SITE_URL}/spots.md`
    })
  }

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Cache-Control', spot
    ? 'public, max-age=900, s-maxage=900'
    : 'public, max-age=3600, s-maxage=3600')
  return md
})
