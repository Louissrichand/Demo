-- ============================================================
-- root+ — first-party analytics events
-- Run this in Supabase → SQL Editor → New query → Run.
--
-- Why: config.js has no GA4 / Clarity / Pixel ID, so rpTrack() was only
-- logging to the console. This gives the same funnel numbers using the
-- database you already own — no third-party script, no third-party cookie.
--
-- PDPA note: rows are deliberately anonymous. session_id is a random
-- string generated per browser tab-session (sessionStorage) — it is not
-- a user id, does not persist after the tab closes, and is never linked
-- to an email. No IP address is stored. Nothing here identifies a person,
-- so it does not need consent as personal data.
-- ============================================================

create table if not exists public.events (
  id          bigint generated always as identity primary key,
  session_id  text not null,          -- random per tab-session, NOT a person
  event       text not null,          -- 'page_view' | 'waitlist_submit' | ...
  props       jsonb,                  -- {product: 'balance', channel: 'line', ...}
  path        text,                   -- '/balance.html'
  lang        text,                   -- 'en' | 'th'
  referrer    text,
  utm         jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists events_event_time_idx on public.events (event, created_at desc);
create index if not exists events_session_idx    on public.events (session_id);
create index if not exists events_time_idx       on public.events (created_at desc);

-- Row Level Security: the public anon key may INSERT only.
-- No SELECT policy for anon = nobody can read your analytics with the
-- key that ships in the browser.
alter table public.events enable row level security;

drop policy if exists "public can write events" on public.events;
create policy "public can write events"
  on public.events
  for insert
  to anon
  with check (true);

grant insert on public.events to anon;


-- ============================================================
-- READY-MADE QUERIES — paste any of these into the SQL Editor
-- ============================================================

-- 1) THE FUNNEL, last 30 days
--    How many people saw a product, clicked through, and actually joined.
--
--   with s as (
--     select session_id,
--            max((event = 'view_product')::int)    as viewed,
--            max((event = 'pdp_cta_click')::int)   as clicked,
--            max((event = 'notify_me_click')::int) as notified,
--            max((event = 'waitlist_submit')::int) as joined
--     from public.events
--     where created_at > now() - interval '30 days'
--     group by session_id
--   )
--   select count(*)                                     as sessions,
--          sum(viewed)                                   as viewed_product,
--          sum(greatest(clicked, notified))              as clicked_cta,
--          sum(joined)                                   as joined_list,
--          round(100.0 * sum(joined) / nullif(count(*),0), 2) as pct_of_sessions
--   from s;

-- 2) EVENT COUNTS, last 7 days
--
--   select event, count(*) as n, count(distinct session_id) as sessions
--   from public.events
--   where created_at > now() - interval '7 days'
--   group by event
--   order by n desc;

-- 3) WHICH PRODUCT PULLS
--
--   select props->>'product' as product,
--          count(*) filter (where event = 'view_product')    as views,
--          count(*) filter (where event = 'pdp_cta_click')   as cta_clicks,
--          count(*) filter (where event = 'waitlist_submit') as signups
--   from public.events
--   where props->>'product' is not null
--     and created_at > now() - interval '30 days'
--   group by 1
--   order by views desc;

-- 4) WHERE TRAFFIC COMES FROM
--
--   select coalesce(utm->>'utm_source', nullif(split_part(referrer,'/',3),''), '(direct)') as source,
--          count(distinct session_id) as sessions,
--          count(*) filter (where event = 'waitlist_submit') as signups
--   from public.events
--   where created_at > now() - interval '30 days'
--   group by 1
--   order by sessions desc;

-- 5) THAI vs ENGLISH
--
--   select lang, count(distinct session_id) as sessions,
--          count(*) filter (where event = 'waitlist_submit') as signups
--   from public.events
--   where created_at > now() - interval '30 days'
--   group by lang;

-- 6) REFERRAL PROGRAMME — which share channel members actually use
--
--   select props->>'channel' as channel, count(*) as shares
--   from public.events
--   where event in ('referral_share','referral_copy')
--   group by 1 order by 2 desc;

-- 7) DROP-OFF — sessions that saw a product but never clicked anything
--
--   select count(*) from (
--     select session_id
--     from public.events
--     where created_at > now() - interval '30 days'
--     group by session_id
--     having max((event = 'view_product')::int) = 1
--        and max((event in ('pdp_cta_click','notify_me_click','waitlist_submit'))::int) = 0
--   ) t;


-- ============================================================
-- HOUSEKEEPING
-- Events pile up. Trim anything older than a year now and then:
--
--   delete from public.events where created_at < now() - interval '365 days';
--
-- Remove test traffic before reading real numbers:
--
--   delete from public.events where props->>'test' = 'true';
-- ============================================================
