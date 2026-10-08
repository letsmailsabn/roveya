# ROVEYA

**Phase 1 codebase.** This mark is the shipped public website: the marketing pages, in-vehicle ride payment, and the contact desk.

Premium transportation website and in-vehicle ride payment. Supabase and Razorpay are already connected. Online payment opens Razorpay Checkout.

## Experiences

- Public site: `/` `/about` `/services` `/routes` `/contact`
- In-car payment: `/pay` (the permanent vehicle QR)
- Operations desk: `/admin`

Passengers do not create accounts. Only CEO and Admin sign in.

## Local development

1. Copy `.env.example` to `.env.local` and fill in your own Supabase and Razorpay **test** keys. Do not commit that file.
2. Apply `supabase/migrations/20261003190000_phase2_init.sql` in the Supabase SQL editor.
3. Run `supabase/seed.sql` only for local development. Its fares are placeholders.
4. Create a staff user in Supabase Authentication, then link them:

```sql
insert into public.admin_users (auth_user_id, name, email, role)
values ('AUTH_USER_UUID', 'ROVEYA CEO', 'ceo@roveya.com', 'CEO');
```

5. Start the app:

```bash
npm install
npm run dev
```

`npm test` covers fare calculation, customer reuse, signature checks, webhook idempotency, and role checks. It does not call live Supabase or Razorpay.

Deployment, webhook, and production key setup are in `DEPLOYMENT.md`.
