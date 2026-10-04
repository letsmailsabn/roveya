-- Extra desk permissions for the separate ROVEYA admin app.
-- Staff already signed in through Supabase can add reviews.
-- The customer summary view stays behind staff row security.

drop policy if exists "staff insert testimonials" on public.testimonials;
create policy "staff insert testimonials"
on public.testimonials
for insert
to authenticated
with check (public.is_staff());

grant select on public.customer_summaries to authenticated;
