-- ============================================================
-- root+ — Supabase setup for the FOUNDING LIST (waitlist) form
-- Run this in your Supabase project → SQL Editor → New query → Run.
--
-- Why a separate table from public.members?
--   members requires first_name / last_name / phone (NOT NULL).
--   The founding-list form on the landing page only asks for an email,
--   so it needs its own lightweight table.
-- ============================================================

-- 1) Waitlist table
create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  product     text,                       -- 'balance' | 'goodnight' | 'radiance' | null
  lang        text,                       -- 'en' | 'th'  (language the visitor used)
  source      text default 'landing',
  referrer    text,                       -- document.referrer, for attribution
  utm         jsonb,                      -- {utm_source, utm_medium, utm_campaign, ...}
  created_at  timestamptz not null default now()
);

-- 2) One row per email — a second submit is treated as "already on the list"
create unique index if not exists waitlist_email_uniq
  on public.waitlist (lower(email));

create index if not exists waitlist_created_idx
  on public.waitlist (created_at desc);

-- 3) Row Level Security: the public anon key may INSERT only.
--    No SELECT / UPDATE / DELETE policy for anon = those are denied,
--    so nobody can read the list with the public key.
alter table public.waitlist enable row level security;

drop policy if exists "public can join waitlist" on public.waitlist;
create policy "public can join waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);

grant insert on public.waitlist to anon;

-- ============================================================
-- After running:
--   View / export the list in Supabase → Table editor → waitlist
--
-- To test from the terminal (must use return=minimal — anon has no SELECT):
--   curl -X POST "https://vumqbxlorsemfvrxxkmj.supabase.co/rest/v1/waitlist" \
--     -H "apikey: <anon key>" -H "Authorization: Bearer <anon key>" \
--     -H "Content-Type: application/json" -H "Prefer: return=minimal" \
--     -d '{"email":"test@example.com","product":"balance","lang":"th","source":"test"}'
--
--   Delete the source='test' rows before the real pilot.
-- ============================================================
