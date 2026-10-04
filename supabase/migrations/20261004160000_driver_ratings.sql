alter table public.ratings add column if not exists driver_id uuid references public.drivers (id) on delete set null;

create index if not exists ratings_driver_id_idx on public.ratings (driver_id);
