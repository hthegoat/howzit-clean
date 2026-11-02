-- Forecast sponsors: one active local sponsor per spot.
-- Sold by hand for now: a sponsor pays via a Stripe Payment Link, then a row
-- is added here and the spot page picks it up on its next ISR refresh (15 min).
-- Remove or set active = false to reopen the slot.
--
-- Everything in this table is publicly readable (active rows), so keep
-- private details (contact info, billing notes) in Stripe, not here.

create table if not exists public.spot_sponsors (
  id             uuid primary key default gen_random_uuid(),
  spot_id        uuid not null references public.spots(id) on delete cascade,
  business_name  text not null,
  website_url    text not null,
  tagline        text check (char_length(tagline) <= 90),
  offer          text check (char_length(offer) <= 40),
  location_label text check (char_length(location_label) <= 40), -- e.g. "Newport · Surf shop"
  logo_url       text,
  active         boolean not null default true,
  starts_at      date not null default current_date,
  created_at     timestamptz not null default now()
);

-- One active sponsor per spot. Inactive rows stay as history.
create unique index if not exists spot_sponsors_one_active_per_spot
  on public.spot_sponsors (spot_id) where active;

alter table public.spot_sponsors enable row level security;

drop policy if exists "Active sponsors are public" on public.spot_sponsors;
create policy "Active sponsors are public"
  on public.spot_sponsors for select
  to anon, authenticated
  using (active);
-- No insert/update/delete policies: rows are managed from the dashboard or
-- service role only.
