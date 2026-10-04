-- TEMPORARY DEVELOPMENT DATA.
-- Fare amounts below are placeholders so /pay can be tried locally.
-- Replace them from the operations desk before accepting real passengers.
-- Do not treat these numbers as production fares.

insert into public.destinations (name, slug, fare_per_seat, description, is_active, sort_order)
values
  ('Khammam', 'khammam', 500, 'Comfortable intercity travel to Khammam.', true, 1),
  ('Warangal', 'warangal', 450, 'Reliable journeys to Warangal.', true, 2),
  ('Nalgonda', 'nalgonda', 400, 'Straightforward travel to Nalgonda.', true, 3),
  ('Vijayawada', 'vijayawada', 700, 'Longer-distance travel to Vijayawada.', true, 4),
  ('Suryapet', 'suryapet', 350, 'Convenient travel to Suryapet.', true, 5),
  ('Hyderabad', 'hyderabad', 800, 'Premium journeys to Hyderabad.', true, 6)
on conflict (name) do nothing;

insert into public.site_settings (id, phone, whatsapp, email, address, hours)
values (
  'roveya',
  '+91 90000 00000',
  '919000000000',
  'hello@roveya.com',
  'ROVEYA Travel Desk, Khammam, Telangana, India',
  'Daily, 5:00 AM – 11:00 PM'
)
on conflict (id) do nothing;

-- Sample reviews for the marketing page. Unpublish these before launch
-- and publish real feedback from the operations desk instead.
insert into public.testimonials (name, route, rating, quote, published)
select * from (
  values
    ('Ananya Reddy', 'Hyderabad', 5, 'Smooth journey, transparent pricing and a very convenient payment experience.', true),
    ('Ravi Kumar', 'Warangal', 5, 'The vehicle was clean and the fare was clear before I paid. No confusion at all.', true),
    ('Sneha Rao', 'Vijayawada', 5, 'Paying from my seat was simple. I would travel with ROVEYA again.', true)
) as sample(name, route, rating, quote, published)
where not exists (select 1 from public.testimonials);

-- Staff accounts are not seeded with passwords.
-- 1. Create the person in Supabase Authentication.
-- 2. Then link them:
-- insert into public.admin_users (auth_user_id, name, email, role)
-- values ('00000000-0000-0000-0000-000000000000', 'ROVEYA CEO', 'ceo@roveya.com', 'CEO');
