-- ============================================================
-- root+ — Supabase setup for the membership signup form
-- Run this in your Supabase project → SQL Editor → New query → Run.
-- ============================================================

-- 1) Members table
create table if not exists public.members (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text not null,
  email         text not null,
  phone         text not null,
  dob           date,
  gender        text,
  interests     text[] default '{}',
  marketing     boolean not null default false,
  pdpa_consent  boolean not null default false,
  source        text default 'landing',
  lang          text,
  created_at    timestamptz not null default now()
);

-- 2) Enable Row Level Security
alter table public.members enable row level security;

-- 3) Allow the public (anon) key to INSERT only — it cannot read others' data.
--    (No SELECT/UPDATE/DELETE policy for anon = those are denied.)
drop policy if exists "public can insert signups" on public.members;
create policy "public can insert signups"
  on public.members
  for insert
  to anon
  with check (true);

-- Optional: helpful index for admin lookups
create index if not exists members_email_idx on public.members (email);
create index if not exists members_created_idx on public.members (created_at desc);

-- ============================================================
-- After running:
--   Project Settings → API → copy "Project URL" and the "anon public" key
--   into assets/js/config.js  (supabaseUrl / supabaseKey).
-- View members in Supabase → Table editor → members.
-- ============================================================
