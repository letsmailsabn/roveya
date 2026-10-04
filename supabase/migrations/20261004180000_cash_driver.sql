-- Cash taken in the car is confirmed by the hired driver on their phone.
-- Run this once in the Supabase SQL editor.

alter table public.rides
  add column if not exists driver_id uuid references public.drivers (id) on delete set null;

create index if not exists rides_driver_id_idx on public.rides (driver_id);

create table if not exists public.cash_confirmations (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides (id) on delete cascade,
  driver_id uuid not null references public.drivers (id),
  token_hash text not null unique,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DECLINED')),
  sent_at timestamptz,
  decided_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists cash_confirmations_one_open_ride
  on public.cash_confirmations (ride_id)
  where status = 'PENDING';

alter table public.cash_confirmations enable row level security;
