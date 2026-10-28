// NotFair SEO webhook: auth, payload validation, sanitizing, and delivery
// processing. Pure functions with no Nuxt auto-imports, so the tests in
// tests/notfair.test.ts can import this file directly.
//
// Contract: POST /api/seo-webhook, Bearer <NOTFAIR_SEO_WEBHOOK_SECRET>,
// { event_type: 'publish_posts', test, timestamp, data: { posts: [1..10] } }.

import { createHash, timingSafeEqual } from 'node:crypto'
import sanitizeHtml from 'sanitize-html'

export const NOTFAIR_MAX_POSTS = 10
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface NotfairPost {
  id: number
  title: string
  slug: string
  content_html: string
  meta_description: string | null
  tags: string[]
  image_url: string | null
  reading_time_minutes: number | null
  created_at: string
  updated_at: string | null
}

export interface NotfairRow extends NotfairPost {
  content_html_safe: string
}

export interface NotfairDelivery {
  test: boolean
  timestamp: string | null
  posts: NotfairPost[]
}

/** Persists a batch atomically. Resolves to the number of rows written. */
export type NotfairStore = (rows: NotfairRow[], deliveredAt: string | null) => Promise<number>

export class NotfairValidationError extends Error {}

// ---- Auth --------------------------------------------------------------------

/**
 * Exact match on "Bearer <secret>". Both sides are hashed first so the
 * comparison is constant time regardless of what length the caller sent.
 */
export function notfairAuthorized(header: string | null | undefined, secret: string | null | undefined): boolean {
  if (!secret || typeof header !== 'string' || !header) return false
  const got = createHash('sha256').update(header, 'utf8').digest()
  const want = createHash('sha256').update(`Bearer ${secret}`, 'utf8').digest()
  return timingSafeEqual(got, want)
}

export function isJsonContentType(header: string | null | undefined): boolean {
  if (!header) return false
  return header.split(';')[0].trim().toLowerCase() === 'application/json'
}

// ---- Validation ----------------------------------------------------------------

const fail = (msg: string): never => { throw new NotfairValidationError(msg) }

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isDate = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0 && !Number.isNaN(Date.parse(v))

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

function optionalString(v: unknown, field: string, where: string): string | null {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') fail(`${where}: ${field} must be a string or null`)
  return (v as string).trim() || null
}

function validatePost(raw: unknown, index: number, test: boolean): NotfairPost {
  const where = `posts[${index}]`
  if (!isObject(raw)) fail(`${where}: must be an object`)
  const p = raw as Record<string, unknown>

  // Real posts have positive integer ids. The connection test uses id 0.
  const minId = test ? 0 : 1
  if (typeof p.id !== 'number' || !Number.isSafeInteger(p.id) || p.id < minId) {
    fail(`${where}: id must be ${test ? 'a non-negative' : 'a positive'} integer`)
  }

  if (typeof p.title !== 'string' || !p.title.trim()) fail(`${where}: title is required`)
  if (typeof p.slug !== 'string' || !SLUG_RE.test(p.slug)) fail(`${where}: slug must be a lowercase URL slug`)
  if (typeof p.content_html !== 'string' || !p.content_html.trim()) fail(`${where}: content_html is required`)
  if (!isDate(p.created_at)) fail(`${where}: created_at must be an ISO date`)

  let updatedAt: string | null = null
  if (p.updated_at !== undefined && p.updated_at !== null) {
    if (!isDate(p.updated_at)) fail(`${where}: updated_at must be an ISO date or null`)
    updatedAt = p.updated_at as string
  }

  let tags: string[] = []
  if (p.tags !== undefined && p.tags !== null) {
    if (!Array.isArray(p.tags) || p.tags.some(t => typeof t !== 'string')) {
      fail(`${where}: tags must be an array of strings or null`)
    }
    tags = (p.tags as string[]).map(t => t.trim()).filter(Boolean)
  }

  const imageUrl = optionalString(p.image_url, 'image_url', where)
  if (imageUrl && !isHttpUrl(imageUrl)) fail(`${where}: image_url must be an http(s) URL`)

  let readingTime: number | null = null
  if (p.reading_time_minutes !== undefined && p.reading_time_minutes !== null) {
    const r = p.reading_time_minutes
    if (typeof r !== 'number' || !Number.isFinite(r) || r < 0) {
      fail(`${where}: reading_time_minutes must be a non-negative number or null`)
    }
    readingTime = Math.round(r as number)
  }

  return {
    id: p.id as number,
    title: (p.title as string).trim(),
    slug: p.slug as string,
    content_html: p.content_html as string,
    meta_description: optionalString(p.meta_description, 'meta_description', where),
    tags,
    image_url: imageUrl,
    reading_time_minutes: readingTime,
    created_at: p.created_at as string,
    updated_at: updatedAt,
  }
}

export function parseNotfairDelivery(body: unknown): NotfairDelivery {
  if (!isObject(body)) fail('body must be a JSON object')
  const b = body as Record<string, unknown>

  if (b.event_type !== 'publish_posts') fail('event_type must be "publish_posts"')
  if (b.test !== undefined && typeof b.test !== 'boolean') fail('test must be a boolean')
  const test = b.test === true

  let timestamp: string | null = null
  if (b.timestamp !== undefined && b.timestamp !== null) {
    if (!isDate(b.timestamp)) fail('timestamp must be an ISO date')
    timestamp = b.timestamp as string
  }

  if (!isObject(b.data)) fail('data must be an object')
  const posts = (b.data as Record<string, unknown>).posts
  if (!Array.isArray(posts) || posts.length < 1 || posts.length > NOTFAIR_MAX_POSTS) {
    fail(`data.posts must contain 1-${NOTFAIR_MAX_POSTS} posts`)
  }

  const parsed = (posts as unknown[]).map((p, i) => validatePost(p, i, test))

  // Two copies of one post in a batch would race inside the upsert.
  const ids = new Set<number>()
  const slugs = new Set<string>()
  for (const p of parsed) {
    if (ids.has(p.id)) fail(`duplicate post id ${p.id} in batch`)
    if (slugs.has(p.slug)) fail(`duplicate slug "${p.slug}" in batch`)
    ids.add(p.id)
    slugs.add(p.slug)
  }

  return { test, timestamp, posts: parsed }
}

// ---- Sanitizing ------------------------------------------------------------------

// Keeps normal article markup, links, tables and inline images; drops scripts,
// styles, event handlers, iframes and javascript: URLs. Image URLs are kept as
// delivered (no rehosting). The page already has an <h1>, so an <h1> in the
// body becomes an <h2>.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote', 'pre', 'code',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'a', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'sub', 'sup', 'small', 'abbr', 'cite', 'q', 'span', 'div',
    'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'figure', 'figcaption', 'img', 'picture', 'source',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'title', 'target', 'rel'],
    img: ['src', 'srcset', 'sizes', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
    source: ['srcset', 'sizes', 'type', 'media'],
    th: ['colspan', 'rowspan', 'scope', 'align'],
    td: ['colspan', 'rowspan', 'align'],
    abbr: ['title'],
    '*': ['id'],
  },
  allowedSchemes: ['https', 'http', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['https', 'http'], source: ['https', 'http'] },
  allowProtocolRelative: false,
  transformTags: {
    h1: 'h2',
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        const rel = new Set((attribs.rel || '').split(/\s+/).filter(Boolean))
        rel.add('noopener')
        rel.add('noreferrer')
        attribs.rel = [...rel].join(' ')
      }
      return { tagName, attribs }
    },
    img: (tagName, attribs) => {
      if (!attribs.loading) attribs.loading = 'lazy'
      return { tagName, attribs }
    },
  },
}

export function sanitizeNotfairHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS)
}

export function toNotfairRow(post: NotfairPost): NotfairRow {
  return { ...post, content_html_safe: sanitizeNotfairHtml(post.content_html) }
}

// ---- Processing --------------------------------------------------------------------

/**
 * Validates a delivery and, unless it is a test, stores it. Throws
 * NotfairValidationError for a bad payload (caller returns 400) and lets
 * storage errors propagate (caller returns 500 so NotFair retries).
 */
export async function processNotfairDelivery(body: unknown, store: NotfairStore) {
  const delivery = parseNotfairDelivery(body)
  if (delivery.test) {
    return { test: true, received: delivery.posts.length, stored: 0 }
  }
  const stored = await store(delivery.posts.map(toNotfairRow), delivery.timestamp)
  return { test: false, received: delivery.posts.length, stored }
}
