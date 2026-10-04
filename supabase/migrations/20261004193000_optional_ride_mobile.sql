-- A passenger can pay without a mobile number. Name still comes from Google sign-in.
alter table public.customers alter column mobile drop not null;

alter table public.customers drop constraint if exists customers_mobile_check;

alter table public.customers
  add constraint customers_mobile_check
  check (mobile is null or mobile ~ '^[6-9][0-9]{9}$');
