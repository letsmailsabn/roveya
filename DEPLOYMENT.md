# ROVEYA deployment

The application is a Next.js server. Production hosting is Fly.io. The database and staff login are Supabase. Online payments are Razorpay.

Do not put secret keys in the repository, in `NEXT_PUBLIC_` variables, or in the browser.

## Environment variables

| Name | Where it is used | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Links and the vehicle QR | Public |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Staff login in the browser session | Public |
| `SUPABASE_SECRET_KEY` | Server-side database access | Secret |
| `RAZORPAY_KEY_ID` | Sent to Razorpay Checkout from the server response | Public key id |
| `RAZORPAY_KEY_SECRET` | Orders and signature checks | Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature checks | Secret |

Development uses Razorpay **test** keys (`rzp_test_...`). Production uses Razorpay **live** keys (`rzp_live_...`). Do not mix them.

If your Supabase dashboard still labels the keys `anon` and `service_role`, paste the anon key into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the service role key into `SUPABASE_SECRET_KEY`.

## Supabase

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/20261003190000_phase2_init.sql`.
3. For a development project, run `supabase/seed.sql`. Replace the placeholder fares before real passengers use `/pay`.
4. In Authentication, enable email login and create the CEO user.
5. Copy that user's id from Authentication → Users and insert an `admin_users` row with role `CEO`. Add further rows with role `ADMIN` for other staff. No other role is accepted.
6. Row Level Security is enabled. The anon key can read active destinations only. Passengers cannot read customers, rides, or payments, and they cannot mark a payment paid. The Next.js server uses the secret key after it validates each request.
7. Confirm Authentication → URL configuration includes your Fly.io domain for staff login redirects if you later add hosted auth redirects. The current desk signs in with email and password through the app.

The CEO can change destinations, fares, and contact settings. Admin and CEO can review rides, confirm cash, and publish testimonials. Every one of those actions is checked on the server and written to `audit_logs`. Changing a destination fare does not rewrite older rides.

## Razorpay

1. Create a Razorpay account and stay in Test Mode while developing.
2. In Account & Settings → API Keys, generate a test key id and key secret.
3. In Account & Settings → Webhooks, add:

   `https://YOUR_DOMAIN/api/payments/razorpay/webhook`

4. Subscribe to `payment.captured`, `payment.failed`, `order.paid`, and `refund.processed`.
5. Set a webhook secret and store it as `RAZORPAY_WEBHOOK_SECRET`.
6. Enable payment auto-capture if Razorpay offers it. The app only marks a ride paid after the payment is captured and the amount matches the stored fare. The browser cannot set that status.
7. When you go live, create a separate live webhook on the production domain and replace the three Razorpay variables with live values.

The Razorpay key secret never leaves the server. Checkout receives only the key id and the order id.

## Fly.io

Build command used by the Dockerfile: `npm run build`

Start command: `node server.js` (Next.js standalone server)

Health check: `GET /api/health`

From the project directory, after [installing the Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) and signing in:

```bash
fly apps create roveya
fly secrets set \
  SUPABASE_SECRET_KEY=your_secret_key \
  RAZORPAY_KEY_ID=rzp_live_your_key_id \
  RAZORPAY_KEY_SECRET=your_live_key_secret \
  RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
fly deploy \
  --build-arg NEXT_PUBLIC_SITE_URL=https://your-app.fly.dev \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

The public Supabase values are inlined when Next.js builds. Pass them as build args. Keep the secret key and Razorpay secrets in `fly secrets` only.

Change `app` in `fly.toml` if `roveya` is already taken. `primary_region` is `bom` (Mumbai). Change it if you want a different region.

This repository does not deploy itself and does not contain real credentials.
