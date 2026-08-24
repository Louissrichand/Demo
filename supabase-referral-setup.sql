-- ============================================================
-- root+ — Referral attribution
-- Run this in Supabase → SQL Editor → New query → Run.
--
-- Why: the My Account → Refer tab hands members a link ending in
--   ?ref=<their user id>
-- but nothing was storing that id when the invited friend signed up,
-- so referrals produced no data and no one could be credited.
-- These two columns close that loop.
-- ============================================================

-- 1) Founding-list signups: who invited them
alter table public.waitlist
  add column if not exists referred_by uuid;

comment on column public.waitlist.referred_by is
  'auth.users.id of the member whose ?ref= link brought this signup (null = direct)';

create index if not exists waitlist_referred_by_idx
  on public.waitlist (referred_by)
  where referred_by is not null;

-- 2) Full accounts: same idea, for people who create an account instead
alter table public.profiles
  add column if not exists referred_by uuid;

comment on column public.profiles.referred_by is
  'auth.users.id of the member whose ?ref= link brought this signup (null = direct)';

create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by)
  where referred_by is not null;

-- NOTE: deliberately NOT a foreign key to auth.users.
-- A bad or stale ?ref= value in a shared link should not block a signup —
-- we would rather capture the lead and clean the value up later.

-- ============================================================
-- Leaderboard: who has brought in the most founding members.
-- Run this in the SQL Editor whenever you want the standings.
-- (The anon key cannot read this — it has INSERT only, by design.)
--
--   select w.referred_by,
--          p.full_name,
--          count(*) as referrals,
--          min(w.created_at) as first_referral
--   from public.waitlist w
--   left join public.profiles p on p.id = w.referred_by
--   where w.referred_by is not null
--   group by w.referred_by, p.full_name
--   order by referrals desc;
-- ============================================================
