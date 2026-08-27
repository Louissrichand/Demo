-- ============================================================
-- root+ — cart reservations
-- Run this in Supabase → SQL Editor → New query → Run.
--
-- Why: the shop preview let someone fill a cart and press checkout, and
-- then did nothing with it. Someone holding a full cart is the highest-
-- intent visitor on the site, so that moment now captures a reservation
-- instead of a toast.
--
-- Separate from public.waitlist on purpose: waitlist has a unique index on
-- email (one founding-list place per person), while the same person may
-- legitimately reserve more than once — changing their mind, adding the
-- second product later. This table keeps every reservation.
-- ============================================================

create table if not exists public.reservations (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  items        jsonb not null,        -- [{"product":"balance","qty":2}, ...]
  total        integer,               -- THB at time of reserving
  lang         text,
  source       text default 'shop_cart',
  referrer     text,
  utm          jsonb,
  referred_by  uuid,                  -- who invited them, if anyone
  created_at   timestamptz not null default now()
);

create index if not exists reservations_created_idx on public.reservations (created_at desc);
create index if not exists reservations_email_idx   on public.reservations (lower(email));

-- Row Level Security: the public anon key may INSERT only.
alter table public.reservations enable row level security;

drop policy if exists "public can reserve" on public.reservations;
create policy "public can reserve"
  on public.reservations
  for insert
  to anon
  with check (true);

grant insert on public.reservations to anon;


-- ============================================================
-- READY-MADE QUERIES
-- ============================================================

-- 1) DEMAND FORECAST — how many boxes of each product are spoken for.
--    This is the number to take into a production planning meeting.
--
--   select item->>'product' as product,
--          sum((item->>'qty')::int) as boxes_reserved,
--          count(distinct r.email)  as people
--   from public.reservations r,
--        lateral jsonb_array_elements(r.items) as item
--   group by 1
--   order by boxes_reserved desc;

-- 2) RESERVATION VALUE
--
--   select count(*)                as reservations,
--          count(distinct email)   as people,
--          sum(total)              as thb_reserved,
--          round(avg(total))       as avg_basket
--   from public.reservations;

-- 3) WHO RESERVED BUT IS NOT ON THE FOUNDING LIST
--    (worth a separate email — they showed more intent, not less)
--
--   select distinct r.email
--   from public.reservations r
--   left join public.waitlist w on lower(w.email) = lower(r.email)
--   where w.id is null;

-- 4) RESERVATIONS THAT CAME FROM A REFERRAL
--
--   select r.referred_by, p.full_name, count(*) as reservations, sum(r.total) as thb
--   from public.reservations r
--   left join public.profiles p on p.id = r.referred_by
--   where r.referred_by is not null
--   group by 1, 2
--   order by thb desc;

-- Remove test rows before reading real numbers:
--   delete from public.reservations where source = 'test';
-- ============================================================
