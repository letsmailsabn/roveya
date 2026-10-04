-- Shared taxi routes, hired drivers, customer accounts, and seat requests.
-- Run this once in the Supabase SQL editor.

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  mobile text not null unique check (mobile ~ '^[6-9][0-9]{9}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  vehicle_number text not null,
  vehicle_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.travel_routes (
  id uuid primary key default gen_random_uuid(),
  origin text not null,
  destination text not null,
  depart_at timestamptz not null,
  arrive_at timestamptz not null,
  fare_per_seat integer not null check (fare_per_seat > 0 and fare_per_seat <= 100000),
  seats_total integer not null check (seats_total between 1 and 8),
  driver_id uuid references public.drivers (id) on delete set null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint travel_routes_arrive_after_depart check (arrive_at > depart_at)
);

create table if not exists public.pool_bookings (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.travel_routes (id) on delete cascade,
  customer_id uuid not null references public.customer_profiles (id) on delete cascade,
  seats integer not null check (seats between 1 and 6),
  status text not null default 'REQUESTED' check (status in ('REQUESTED', 'CONFIRMED', 'DECLINED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  unique (route_id, customer_id)
);

alter table public.customer_profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.travel_routes enable row level security;
alter table public.pool_bookings enable row level security;

create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'mobile' is not null then
    insert into public.customer_profiles (auth_user_id, name, mobile)
    values (
      new.id,
      coalesce(nullif(btrim(new.raw_user_meta_data->>'name'), ''), 'Traveller'),
      new.raw_user_meta_data->>'mobile'
    )
    on conflict (auth_user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_customer();

create or replace function public.guard_pool_seats()
returns trigger
language plpgsql
as $$
declare
  cap integer;
  used integer;
begin
  if new.status in ('DECLINED', 'CANCELLED') then
    return new;
  end if;
  select seats_total into cap from public.travel_routes where id = new.route_id;
  select coalesce(sum(seats), 0) into used
  from public.pool_bookings
  where route_id = new.route_id
    and status in ('REQUESTED', 'CONFIRMED')
    and id is distinct from new.id;
  if cap is null or used + new.seats > cap then
    raise exception 'Not enough seats left on this taxi';
  end if;
  return new;
end;
$$;

drop trigger if exists pool_bookings_guard on public.pool_bookings;
create trigger pool_bookings_guard
before insert or update on public.pool_bookings
for each row execute function public.guard_pool_seats();

drop policy if exists "public read active travel routes" on public.travel_routes;
create policy "public read active travel routes"
on public.travel_routes for select to anon, authenticated
using (is_active = true);

drop policy if exists "staff manage travel routes" on public.travel_routes;
create policy "staff manage travel routes"
on public.travel_routes for all to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "staff manage drivers" on public.drivers;
create policy "staff manage drivers"
on public.drivers for all to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "customer reads own profile" on public.customer_profiles;
create policy "customer reads own profile"
on public.customer_profiles for select to authenticated
using (auth_user_id = auth.uid());

drop policy if exists "customer updates own profile" on public.customer_profiles;
create policy "customer updates own profile"
on public.customer_profiles for update to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "staff read customer profiles" on public.customer_profiles;
create policy "staff read customer profiles"
on public.customer_profiles for select to authenticated
using (public.is_staff());

drop policy if exists "staff manage customer profiles" on public.customer_profiles;
create policy "staff manage customer profiles"
on public.customer_profiles for update to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "customer reads own bookings" on public.pool_bookings;
create policy "customer reads own bookings"
on public.pool_bookings for select to authenticated
using (
  customer_id in (select id from public.customer_profiles where auth_user_id = auth.uid())
);

drop policy if exists "customer requests a seat" on public.pool_bookings;
create policy "customer requests a seat"
on public.pool_bookings for insert to authenticated
with check (
  status = 'REQUESTED'
  and customer_id in (select id from public.customer_profiles where auth_user_id = auth.uid())
);

drop policy if exists "customer cancels own booking" on public.pool_bookings;
create policy "customer cancels own booking"
on public.pool_bookings for update to authenticated
using (
  customer_id in (select id from public.customer_profiles where auth_user_id = auth.uid())
)
with check (status = 'CANCELLED');

drop policy if exists "staff manage pool bookings" on public.pool_bookings;
create policy "staff manage pool bookings"
on public.pool_bookings for all to authenticated
using (public.is_staff())
with check (public.is_staff());

create or replace view public.pool_companions as
select
  b.route_id,
  b.seats,
  b.status,
  split_part(p.name, ' ', 1) as first_name
from public.pool_bookings b
join public.customer_profiles p on p.id = b.customer_id
where b.status in ('REQUESTED', 'CONFIRMED');

grant select on public.pool_companions to anon, authenticated;

insert into public.travel_routes (origin, destination, depart_at, arrive_at, fare_per_seat, seats_total, notes)
select * from (
  values
    ('Hyderabad', 'Khammam',
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '05:30') at time zone 'Asia/Kolkata'),
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '08:30') at time zone 'Asia/Kolkata'),
      500, 4, 'Morning taxipool'),
    ('Hyderabad', 'Warangal',
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '06:00') at time zone 'Asia/Kolkata'),
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '09:00') at time zone 'Asia/Kolkata'),
      450, 4, 'Morning taxipool'),
    ('Khammam', 'Hyderabad',
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '16:00') at time zone 'Asia/Kolkata'),
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '19:00') at time zone 'Asia/Kolkata'),
      500, 4, 'Evening return'),
    ('Hyderabad', 'Vijayawada',
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '06:30') at time zone 'Asia/Kolkata'),
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '11:00') at time zone 'Asia/Kolkata'),
      700, 4, 'Morning taxipool'),
    ('Hyderabad', 'Nalgonda',
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '07:00') at time zone 'Asia/Kolkata'),
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '09:30') at time zone 'Asia/Kolkata'),
      400, 4, 'Morning taxipool'),
    ('Hyderabad', 'Suryapet',
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '06:15') at time zone 'Asia/Kolkata'),
      ((date_trunc('day', timezone('Asia/Kolkata', now())) + interval '1 day' + time '08:45') at time zone 'Asia/Kolkata'),
      350, 4, 'Morning taxipool')
) as sample(origin, destination, depart_at, arrive_at, fare_per_seat, seats_total, notes)
where not exists (select 1 from public.travel_routes);
