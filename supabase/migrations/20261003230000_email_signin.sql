-- Let a customer sign in with email. Mobile stays optional.
-- Paste this whole file into the Supabase SQL editor and run it once.

alter table public.customer_profiles add column if not exists email text;

alter table public.customer_profiles alter column mobile drop not null;

alter table public.customer_profiles drop constraint if exists customer_profiles_mobile_check;

alter table public.customer_profiles
  add constraint customer_profiles_mobile_check
  check (mobile is null or mobile ~ '^[6-9][0-9]{9}$');

drop policy if exists "customer inserts own profile" on public.customer_profiles;
create policy "customer inserts own profile"
on public.customer_profiles for insert to authenticated
with check (auth_user_id = auth.uid());

create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customer_profiles (auth_user_id, name, mobile, email)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'name'), ''), 'Traveller'),
    nullif(new.raw_user_meta_data->>'mobile', ''),
    nullif(new.email, '')
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;
