import { createApp, toWebHandler } from 'h3'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import handler from '../server/api/seo-webhook.post'
import { notfairAuthorized, sanitizeNotfairHtml } from '../server/utils/notfair'
import { fakeDb } from './mocks/supabase-server'

const SECRET = 'test-secret-do-not-use'
const URL_ = 'http://localhost/api/seo-webhook'

let call: (req: Request) => Promise<Response>

beforeAll(() => {
  const app = createApp()
  app.use('/api/seo-webhook', handler)
  call = toWebHandler(app)
})

beforeEach(() => {
  process.env.NOTFAIR_SEO_WEBHOOK_SECRET = SECRET
  fakeDb.reset()
})

afterEach(() => {
  delete process.env.NOTFAIR_SEO_WEBHOOK_SECRET
})

const post = (over: Record<string, unknown> = {}) => ({
  id: 123,
  title: 'Article title',
  slug: 'article-title',
  content_html: '<p>Complete article HTML</p>',
  meta_description: 'Search description',
  tags: ['seo', 'marketing'],
  image_url: 'https://notfair.co/api/seo/og?postId=123',
  reading_time_minutes: 5,
  created_at: '2026-08-09T12:00:00.000Z',
  updated_at: '2026-08-10T12:00:00.000Z',
  ...over,
})

const delivery = (posts: unknown[], test = false) => ({
  event_type: 'publish_posts',
  test,
  timestamp: '2026-08-09T12:00:00.000Z',
  data: { posts },
})

async function send(body: unknown, headers: Record<string, string> = {}) {
  const res = await call(new Request(URL_, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${SECRET}`,
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }))
  return { status: res.status, json: await res.json() }
}

describe('auth', () => {
  it('rejects a missing Authorization header with 401 and stores nothing', async () => {
    const res = await call(new Request(URL_, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(delivery([post()])),
    }))
    expect(res.status).toBe(401)
    expect(fakeDb.rpcCalls).toBe(0)
  })

  it('rejects a wrong secret, a missing "Bearer " prefix, and a lowercase scheme', async () => {
    for (const authorization of [`Bearer ${SECRET}x`, SECRET, `bearer ${SECRET}`, 'Bearer ', `Bearer  ${SECRET}`]) {
      const { status } = await send(delivery([post()]), { authorization })
      expect(status, authorization).toBe(401)
    }
    expect(fakeDb.rpcCalls).toBe(0)
  })

  it('checks auth before reading the body', async () => {
    const { status } = await send('{not json', { authorization: 'Bearer nope' })
    expect(status).toBe(401)
  })

  it('returns 503 (retryable) when the secret is not configured, never 2xx', async () => {
    delete process.env.NOTFAIR_SEO_WEBHOOK_SECRET
    const { status } = await send(delivery([post()]))
    expect(status).toBe(503)
    expect(fakeDb.rpcCalls).toBe(0)
  })

  it('compares the whole header exactly', () => {
    expect(notfairAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true)
    expect(notfairAuthorized(`Bearer ${SECRET} `, SECRET)).toBe(false)
    expect(notfairAuthorized(undefined, SECRET)).toBe(false)
    expect(notfairAuthorized(`Bearer ${SECRET}`, '')).toBe(false)
  })
})

describe('request shape', () => {
  it('requires Content-Type: application/json', async () => {
    const { status } = await send(delivery([post()]), { 'content-type': 'text/plain' })
    expect(status).toBe(415)
  })

  it('accepts a charset parameter on the content type', async () => {
    const { status } = await send(delivery([post()]), { 'content-type': 'application/json; charset=utf-8' })
    expect(status).toBe(200)
  })

  it('400s on invalid JSON and on payloads that break the contract', async () => {
    expect((await send('{not json')).status).toBe(400)
    expect((await send({ ...delivery([post()]), event_type: 'other' })).status).toBe(400)
    expect((await send(delivery([]))).status).toBe(400)
    expect((await send(delivery(Array.from({ length: 11 }, (_, i) => post({ id: i + 1, slug: `p-${i + 1}` }))))).status).toBe(400)
    expect((await send(delivery([post({ slug: 'Not A Slug' })]))).status).toBe(400)
    expect((await send(delivery([post({ id: 0 })]))).status).toBe(400) // id 0 only allowed in tests
    expect((await send(delivery([post({ title: '' })]))).status).toBe(400)
    expect((await send(delivery([post({ created_at: 'yesterday' })]))).status).toBe(400)
    expect((await send(delivery([post(), post({ slug: 'other' })]))).status).toBe(400) // duplicate id
    expect(fakeDb.rpcCalls).toBe(0)
  })

  it('accepts a full batch of 10', async () => {
    const posts = Array.from({ length: 10 }, (_, i) => post({ id: i + 1, slug: `post-${i + 1}` }))
    const { status, json } = await send(delivery(posts))
    expect(status).toBe(200)
    expect(json).toMatchObject({ ok: true, stored: 10 })
    expect(fakeDb.rows.size).toBe(10)
  })
})

describe('test deliveries', () => {
  it('validates, returns 2xx, and does not persist (id 0, optional fields omitted)', async () => {
    const testPost = {
      id: 0,
      title: 'NotFair connection test',
      slug: 'notfair-connection-test',
      content_html: '<p>Test</p>',
      created_at: '2026-08-09T12:00:00.000Z',
    }
    const { status, json } = await send(delivery([testPost], true))
    expect(status).toBe(200)
    expect(json).toMatchObject({ ok: true, test: true, stored: 0 })
    expect(fakeDb.rpcCalls).toBe(0)
    expect(fakeDb.rows.size).toBe(0)
  })

  it('still rejects a bad secret on a test delivery', async () => {
    const { status } = await send(delivery([post({ id: 0 })], true), { authorization: 'Bearer wrong' })
    expect(status).toBe(401)
  })

  it('still validates the payload on a test delivery', async () => {
    const { status } = await send(delivery([{ id: 0, title: 'x' }], true))
    expect(status).toBe(400)
  })
})

describe('real deliveries', () => {
  it('stores every supplied field plus a sanitized copy', async () => {
    const { status, json } = await send(delivery([post()]))
    expect(status).toBe(200)
    expect(json).toMatchObject({ ok: true, test: false, stored: 1 })
    const row = fakeDb.rows.get(123)!
    expect(row).toMatchObject({
      id: 123,
      title: 'Article title',
      slug: 'article-title',
      content_html: '<p>Complete article HTML</p>',
      content_html_safe: '<p>Complete article HTML</p>',
      meta_description: 'Search description',
      tags: ['seo', 'marketing'],
      image_url: 'https://notfair.co/api/seo/og?postId=123',
      reading_time_minutes: 5,
      created_at: '2026-08-09T12:00:00.000Z',
      updated_at: '2026-08-10T12:00:00.000Z',
      delivered_at: '2026-08-09T12:00:00.000Z',
    })
  })

  it('is idempotent: the same delivery twice leaves one row', async () => {
    await send(delivery([post()]))
    await send(delivery([post()]))
    expect(fakeDb.rows.size).toBe(1)
  })

  it('a refreshed article overwrites its row instead of adding a URL', async () => {
    await send(delivery([post()]))
    await send(delivery([post({ title: 'Refreshed', content_html: '<p>v2</p>', updated_at: '2026-09-01T00:00:00.000Z' })]))
    expect(fakeDb.rows.size).toBe(1)
    expect(fakeDb.rows.get(123)).toMatchObject({ title: 'Refreshed', content_html: '<p>v2</p>', updated_at: '2026-09-01T00:00:00.000Z' })

    // Same slug delivered under a new NotFair id: still one URL.
    await send(delivery([post({ id: 456, title: 'New id' })]))
    expect(fakeDb.rows.size).toBe(1)
    expect([...fakeDb.rows.values()][0]).toMatchObject({ id: 456, slug: 'article-title', title: 'New id' })
  })

  it('returns non-2xx when storage fails so NotFair retries, then succeeds on retry', async () => {
    fakeDb.failNext = true
    const first = await send(delivery([post()]))
    expect(first.status).toBe(500)
    expect(fakeDb.rows.size).toBe(0)

    const retry = await send(delivery([post()]))
    expect(retry.status).toBe(200)
    expect(fakeDb.rows.size).toBe(1)
  })

  it('never echoes the secret in a response', async () => {
    const bad = await send(delivery([post()]), { authorization: 'Bearer wrong' })
    const ok = await send(delivery([post()]))
    expect(JSON.stringify(bad.json)).not.toContain(SECRET)
    expect(JSON.stringify(ok.json)).not.toContain(SECRET)
  })
})

describe('rendered content and images', () => {
  const supabaseImg = 'https://abcd1234.supabase.co/storage/v1/object/public/blog/wave.png'
  const ogImg = 'https://notfair.co/api/seo/og?postId=123'

  it('keeps the featured image_url exactly as delivered', async () => {
    await send(delivery([post({ image_url: ogImg })]))
    expect(fakeDb.rows.get(123)!.image_url).toBe(ogImg)
  })

  it('keeps inline images from Supabase Storage and NotFair, with their attributes', () => {
    const html = `<figure><img src="${supabaseImg}" alt="Wave" width="800" height="450"><figcaption>Lineup</figcaption></figure>`
      + `<p><img src="${ogImg}" alt="Cover" srcset="${supabaseImg} 2x"></p>`
    const out = sanitizeNotfairHtml(html)
    expect(out).toContain(`src="${supabaseImg}"`)
    expect(out).toContain('alt="Wave"')
    expect(out).toContain('width="800"')
    expect(out).toContain('<figcaption>Lineup</figcaption>')
    expect(out).toContain(`src="${ogImg.replace('&', '&amp;')}"`)
    expect(out).toContain(`srcset="${supabaseImg} 2x"`)
    expect(out).toContain('loading="lazy"')
  })

  it('keeps links, headings, lists and tables', () => {
    const html = '<h2 id="why">Why</h2><p>See <a href="https://hwztsurf.com/spots" title="Spots">spots</a> and '
      + '<a href="https://example.com" target="_blank">this</a>.</p><ul><li>One</li></ul><ol><li>Two</li></ol>'
      + '<table><thead><tr><th>Model</th></tr></thead><tbody><tr><td>ECMWF</td></tr></tbody></table><blockquote>q</blockquote>'
    const out = sanitizeNotfairHtml(html)
    expect(out).toContain('<h2 id="why">Why</h2>')
    expect(out).toContain('<a href="https://hwztsurf.com/spots" title="Spots">spots</a>')
    expect(out).toContain('target="_blank" rel="noopener noreferrer"')
    expect(out).toContain('<ul><li>One</li></ul><ol><li>Two</li></ol>')
    expect(out).toContain('<td>ECMWF</td>')
    expect(out).toContain('<blockquote>q</blockquote>')
  })

  it('demotes a body <h1> to <h2> (the page already has the title h1)', () => {
    expect(sanitizeNotfairHtml('<h1>Title</h1>')).toBe('<h2>Title</h2>')
  })

  it('strips scripts, event handlers, iframes, styles and javascript: URLs', () => {
    const html = '<p onclick="x()">Hi</p><script>alert(1)</script><iframe src="https://evil.test"></iframe>'
      + '<style>p{}</style><a href="javascript:alert(1)">bad</a><img src="x" onerror="alert(1)">'
      + '<img src="data:image/png;base64,AAA">'
    const out = sanitizeNotfairHtml(html)
    expect(out).not.toMatch(/script|onclick|onerror|iframe|<style|javascript:|data:image/)
    expect(out).toContain('<p>Hi</p>')
    expect(out).toContain('<a>bad</a>')
  })
})
