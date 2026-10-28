import { serverSupabaseServiceRole } from '#supabase/server'
import {
  NotfairValidationError,
  isJsonContentType,
  notfairAuthorized,
  processNotfairDelivery,
} from '../utils/notfair'

// NotFair SEO publishing webhook. See server/utils/notfair.ts for the contract.
// Order matters: auth and content type are checked before the body is read.
// 2xx only once posts are stored; storage failures return 500 so NotFair retries.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const secret = process.env.NOTFAIR_SEO_WEBHOOK_SECRET
  if (!secret) {
    // Misconfigured deploy. 503 so deliveries retry once the env var is set.
    setResponseStatus(event, 503)
    return { ok: false, error: 'webhook not configured' }
  }

  if (!notfairAuthorized(getHeader(event, 'authorization'), secret)) {
    setResponseStatus(event, 401)
    return { ok: false, error: 'unauthorized' }
  }

  if (!isJsonContentType(getHeader(event, 'content-type'))) {
    setResponseStatus(event, 415)
    return { ok: false, error: 'content-type must be application/json' }
  }

  let body: unknown
  try {
    body = JSON.parse((await readRawBody(event, 'utf8')) ?? '')
  } catch {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid JSON' }
  }

  try {
    const result = await processNotfairDelivery(body, async (rows, deliveredAt) => {
      const supabase = serverSupabaseServiceRole(event)
      const { data, error } = await supabase.rpc('upsert_notfair_posts', {
        posts: rows,
        delivered_at: deliveredAt,
      })
      if (error) throw new Error(error.message)
      return Number(data ?? rows.length)
    })
    return { ok: true, ...result }
  } catch (err) {
    if (err instanceof NotfairValidationError) {
      setResponseStatus(event, 400)
      return { ok: false, error: err.message }
    }
    console.error('[seo-webhook] storage failed:', err instanceof Error ? err.message : err)
    setResponseStatus(event, 500)
    return { ok: false, error: 'storage failed, retry' }
  }
})
