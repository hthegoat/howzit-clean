// Stand-in for '#supabase/server' in tests. The fake table mirrors the rules of
// public.upsert_notfair_posts (supabase/migrations/2026-10-28-notfair-posts.sql):
// keyed by NotFair id, slug unique, a known slug arriving under a new id keeps
// its one row and adopts the new id. The real function is checked against the
// live database separately; this lets the route be tested end to end.

export interface FakeRow { [key: string]: unknown; id: number; slug: string }

export const fakeDb = {
  rows: new Map<number, FakeRow>(),
  rpcCalls: 0,
  failNext: false,
  reset() {
    this.rows.clear()
    this.rpcCalls = 0
    this.failNext = false
  },
}

function upsert(posts: FakeRow[], deliveredAt: string | null) {
  // Work on a copy so a failure leaves the table untouched (atomic batch).
  const next = new Map(fakeDb.rows)
  for (const p of posts) {
    for (const [id, row] of next) {
      if (row.slug === p.slug && id !== p.id) next.delete(id)
    }
    next.set(p.id, { ...p, delivered_at: deliveredAt })
  }
  fakeDb.rows = next
  return posts.length
}

export const serverSupabaseServiceRole = () => ({
  async rpc(name: string, args: { posts: FakeRow[]; delivered_at: string | null }) {
    fakeDb.rpcCalls++
    if (name !== 'upsert_notfair_posts') return { data: null, error: { message: `unknown rpc ${name}` } }
    if (fakeDb.failNext) {
      fakeDb.failNext = false
      return { data: null, error: { message: 'connection reset' } }
    }
    // Round-trip through JSON, as supabase-js does over the wire.
    const posts = JSON.parse(JSON.stringify(args.posts))
    return { data: upsert(posts, args.delivered_at), error: null }
  },
})
