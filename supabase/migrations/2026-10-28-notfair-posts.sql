-- NotFair SEO posts, delivered by POST /api/seo-webhook.
-- One row per NotFair post. The NotFair id is the key; the slug is also unique
-- so a canonical article refreshed under a new id overwrites its row instead of
-- creating a second URL. Native markdown posts in content/blog win any slug
-- collision at render time.

create table if not exists public.notfair_posts (
  id                   bigint primary key check (id > 0),
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title                text not null,
  content_html         text not null,          -- exactly as delivered
  content_html_safe    text not null,          -- sanitized copy, the only one rendered
  meta_description     text,
  tags                 text[] not null default '{}',
  image_url            text,
  reading_time_minutes integer,
  created_at           timestamptz not null,
  updated_at           timestamptz,
  delivered_at         timestamptz,            -- top-level timestamp of the delivery
  received_at          timestamptz not null default now()
);

create index if not exists notfair_posts_created_at_idx on public.notfair_posts (created_at desc);

alter table public.notfair_posts enable row level security;

drop policy if exists "Public read notfair posts" on public.notfair_posts;
create policy "Public read notfair posts" on public.notfair_posts
  for select to anon, authenticated using (true);

-- Whole batch in one call = one transaction. Any bad row rolls back every row,
-- the webhook returns 500, and NotFair retries the delivery.
create or replace function public.upsert_notfair_posts(posts jsonb, delivered_at timestamptz)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  p jsonb;
  n integer := 0;
begin
  for p in select * from jsonb_array_elements(posts) loop
    -- Same slug under a new NotFair id: keep the one URL, adopt the new id.
    update notfair_posts
       set id = (p->>'id')::bigint
     where slug = p->>'slug'
       and id <> (p->>'id')::bigint;

    insert into notfair_posts as t (
      id, slug, title, content_html, content_html_safe, meta_description, tags,
      image_url, reading_time_minutes, created_at, updated_at, delivered_at, received_at
    ) values (
      (p->>'id')::bigint,
      p->>'slug',
      p->>'title',
      p->>'content_html',
      p->>'content_html_safe',
      p->>'meta_description',
      case when jsonb_typeof(p->'tags') = 'array'
           then array(select jsonb_array_elements_text(p->'tags'))
           else '{}'::text[] end,
      p->>'image_url',
      (p->>'reading_time_minutes')::integer,
      (p->>'created_at')::timestamptz,
      (p->>'updated_at')::timestamptz,
      upsert_notfair_posts.delivered_at,
      now()
    )
    on conflict (id) do update set
      slug                 = excluded.slug,
      title                = excluded.title,
      content_html         = excluded.content_html,
      content_html_safe    = excluded.content_html_safe,
      meta_description     = excluded.meta_description,
      tags                 = excluded.tags,
      image_url            = excluded.image_url,
      reading_time_minutes = excluded.reading_time_minutes,
      created_at           = excluded.created_at,
      updated_at           = excluded.updated_at,
      delivered_at         = excluded.delivered_at,
      received_at          = now();

    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Only the server (service role) may write.
revoke all on function public.upsert_notfair_posts(jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.upsert_notfair_posts(jsonb, timestamptz) to service_role;
