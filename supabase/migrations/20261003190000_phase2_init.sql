-- ROVEYA phase 2 schema for Supabase Postgres.
-- Run this in the Supabase SQL editor or with the Supabase CLI.
-- Fares are not inserted here. Development fares live in supabase/seed.sql.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  mobile text not null unique check (mobile ~ '^[6-9][0-9]{9}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 2 and 80),
  slug text unique,
  description text,
  fare_per_seat integer not null check (fare_per_seat > 0 and fare_per_seat <= 100000),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('CEO', 'ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence public.ride_number_seq;

create table public.rides (
  id uuid primary key default gen_random_uuid(),
  -- Customer-facing identifier, for example RV-2026-000001. Not the uuid.
  ride_id text not null unique,
  customer_id uuid not null references public.customers (id),
  destination_id uuid not null references public.destinations (id),
  number_of_seats integer not null check (number_of_seats between 1 and 8),
  fare_per_seat integer not null check (fare_per_seat > 0),
  total_amount integer not null check (total_amount > 0),
  status text not null default 'CREATED' check (
    status in ('CREATED', 'PAYMENT_PENDING', 'CASH_PENDING', 'PAID', 'PAYMENT_FAILED', 'CANCELLED')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rides_total_matches_snapshot check (total_amount = fare_per_seat * number_of_seats)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides (id),
  method text not null check (method in ('RAZORPAY', 'CASH')),
  amount integer not null check (amount > 0),
  status text not null default 'CREATED' check (status in ('CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_one_razorpay_per_ride
  on public.payments (ride_id)
  where method = 'RAZORPAY';

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null unique references public.rides (id),
  stars integer not null check (stars between 1 and 5),
  feedback text check (feedback is null or char_length(feedback) <= 800),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.admin_users (id),
  action text not null,
  entity text not null,
  entity_id text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  id text primary key default 'roveya',
  phone text not null,
  whatsapp text not null,
  email text not null,
  address text not null,
  hours text not null,
  instagram_url text,
  facebook_url text,
  twitter_url text,
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  route text,
  rating integer not null default 5 check (rating between 1 and 5),
  quote text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  email text,
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index rides_customer_id_idx on public.rides (customer_id);
create index rides_destination_id_idx on public.rides (destination_id);
create index rides_created_at_idx on public.rides (created_at desc);
create index rides_status_idx on public.rides (status);
create index payments_ride_id_idx on public.payments (ride_id);
create index ratings_ride_id_idx on public.ratings (ride_id);
create index admin_users_auth_user_id_idx on public.admin_users (auth_user_id);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);

-- ---------------------------------------------------------------------------
-- Historical fare lock and payment amount lock
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.rides_freeze_commercials()
returns trigger
language plpgsql
as $$
begin
  if new.fare_per_seat <> old.fare_per_seat
     or new.total_amount <> old.total_amount
     or new.number_of_seats <> old.number_of_seats
     or new.destination_id <> old.destination_id
     or new.customer_id <> old.customer_id
     or new.ride_id <> old.ride_id then
    raise exception 'historical ride commercials cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function public.payments_amount_matches_ride()
returns trigger
language plpgsql
as $$
declare
  expected integer;
begin
  select total_amount into expected from public.rides where id = new.ride_id;
  if expected is null or new.amount <> expected then
    raise exception 'payment amount must match the stored ride total';
  end if;
  return new;
end;
$$;

create trigger customers_touch before update on public.customers
for each row execute function public.touch_updated_at();
create trigger destinations_touch before update on public.destinations
for each row execute function public.touch_updated_at();
create trigger admin_users_touch before update on public.admin_users
for each row execute function public.touch_updated_at();
create trigger rides_touch before update on public.rides
for each row execute function public.touch_updated_at();
create trigger payments_touch before update on public.payments
for each row execute function public.touch_updated_at();
create trigger site_settings_touch before update on public.site_settings
for each row execute function public.touch_updated_at();

create trigger rides_freeze before update on public.rides
for each row execute function public.rides_freeze_commercials();

create trigger payments_amount_guard before insert or update of amount, ride_id on public.payments
for each row execute function public.payments_amount_matches_ride();

-- ---------------------------------------------------------------------------
-- Public ride numbers
-- ---------------------------------------------------------------------------

create or replace function public.next_ride_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
begin
  n := nextval('public.ride_number_seq');
  return 'RV-' || to_char(timezone('Asia/Kolkata', now()), 'YYYY') || '-' || lpad(n::text, 6, '0');
end;
$$;

revoke all on function public.next_ride_code() from public, anon, authenticated;
grant execute on function public.next_ride_code() to service_role;

-- ---------------------------------------------------------------------------
-- Customer summaries for the operations desk
-- ---------------------------------------------------------------------------

create view public.customer_summaries
with (security_invoker = true) as
select
  c.id,
  c.name,
  c.mobile,
  c.created_at,
  count(r.id) filter (where r.status = 'PAID')::int as total_rides,
  coalesce(sum(r.number_of_seats) filter (where r.status = 'PAID'), 0)::int as total_seats,
  coalesce(sum(r.total_amount) filter (where r.status = 'PAID'), 0)::int as total_spent,
  round(avg(rt.stars) filter (where r.status = 'PAID')::numeric, 2) as average_rating
from public.customers c
left join public.rides r on r.customer_id = c.id
left join public.ratings rt on rt.ride_id = r.id
group by c.id;

revoke all on public.customer_summaries from anon, authenticated;
grant select on public.customer_summaries to service_role;

-- ---------------------------------------------------------------------------
-- Role helpers. security definer so policies can read admin_users safely.
-- ---------------------------------------------------------------------------

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where auth_user_id = auth.uid()
      and role in ('CEO', 'ADMIN')
  );
$$;

create or replace function public.is_ceo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where auth_user_id = auth.uid()
      and role = 'CEO'
  );
$$;

revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_ceo() from public, anon;
grant execute on function public.is_staff() to authenticated, service_role;
grant execute on function public.is_ceo() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security. Service role bypasses these policies.
-- Customers have no Supabase login. The anon key cannot read private tables.
-- ---------------------------------------------------------------------------

alter table public.customers enable row level security;
alter table public.destinations enable row level security;
alter table public.admin_users enable row level security;
alter table public.rides enable row level security;
alter table public.payments enable row level security;
alter table public.ratings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_settings enable row level security;
alter table public.testimonials enable row level security;
alter table public.contact_messages enable row level security;

create policy "public read active destinations"
on public.destinations
for select
to anon, authenticated
using (is_active = true);

create policy "staff read destinations"
on public.destinations
for select
to authenticated
using (public.is_staff());

create policy "ceo manage destinations"
on public.destinations
for all
to authenticated
using (public.is_ceo())
with check (public.is_ceo());

create policy "staff read own profile"
on public.admin_users
for select
to authenticated
using (auth_user_id = auth.uid());

create policy "ceo read staff"
on public.admin_users
for select
to authenticated
using (public.is_ceo());

create policy "staff read customers"
on public.customers
for select
to authenticated
using (public.is_staff());

create policy "staff read rides"
on public.rides
for select
to authenticated
using (public.is_staff());

create policy "staff update ride status"
on public.rides
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "staff read payments"
on public.payments
for select
to authenticated
using (public.is_staff());

create policy "staff confirm cash payments"
on public.payments
for update
to authenticated
using (public.is_staff() and method = 'CASH')
with check (public.is_staff() and method = 'CASH');

create policy "staff read ratings"
on public.ratings
for select
to authenticated
using (public.is_staff());

create policy "staff read audit logs"
on public.audit_logs
for select
to authenticated
using (public.is_staff());

create policy "staff read settings"
on public.site_settings
for select
to authenticated
using (public.is_staff());

create policy "ceo update settings"
on public.site_settings
for update
to authenticated
using (public.is_ceo())
with check (public.is_ceo());

create policy "staff read testimonials"
on public.testimonials
for select
to authenticated
using (public.is_staff());

create policy "staff publish testimonials"
on public.testimonials
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "staff read messages"
on public.contact_messages
for select
to authenticated
using (public.is_staff());

-- No insert/update/delete policies for anon on customers, rides, payments, or ratings.
-- A passenger cannot query other people, edit an amount, or mark a payment paid.
