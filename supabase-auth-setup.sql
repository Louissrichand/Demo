-- ============================================================
-- root+ — Supabase AUTH setup (accounts: Google + email/password)
-- Run this in Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
-- ============================================================

-- 1) profiles: one row per account, linked to auth.users
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  first_name   text,
  last_name    text,
  phone        text,
  dob          date,
  gender       text,
  interests    text[] default '{}',
  marketing    boolean default false,
  pdpa_consent boolean default false,
  avatar_url   text,
  provider     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2) Row Level Security: each user can read & edit ONLY their own row
alter table public.profiles enable row level security;

drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 3) Auto-create a profile row whenever a new account is created,
--    pulling name/avatar from Google (or from email signup metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, first_name, last_name, avatar_url, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- After running this:
--   1. Authentication → URL Configuration:
--        Site URL       = https://louissrichand.github.io/Demo/
--        Redirect URLs  = https://louissrichand.github.io/Demo/**
--                         http://localhost:8087/**   (for local testing)
--   2. Authentication → Providers → Google: enable + paste Client ID/Secret
--        (Google Cloud → Credentials → OAuth client; Authorized redirect URI:
--         https://vumqbxlorsemfvrxxkmj.supabase.co/auth/v1/callback)
--   3. (Optional, easier pilot) Authentication → Providers → Email:
--        turn OFF "Confirm email" so testers log in immediately.
--   View accounts in: Authentication → Users, and Table editor → profiles.
-- ============================================================
