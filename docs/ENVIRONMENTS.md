# Environments — Gut8erPRO

> **Created:** 2026-08-05. How staging and production are structured, and the exact steps to stand each one up.
>
> **Golden rule:** one Supabase project + one Stripe mode per environment. Vercel holds different env-var *values* per environment. Never share a database or a Stripe mode between staging and production.

---

## Environment matrix

| Service | Staging (client demo/test link) | Production (real paying clients) |
|---------|--------------------------------|----------------------------------|
| **Supabase** | `Gut8er Pro` project (`cqgzckghgoyzijxgbncw`) — **already provisioned** | A **new, client-owned** project — created later |
| **DB schema** | applied directly via MCP (do NOT run `migrate deploy` here) | `pnpm prisma migrate deploy` on the fresh project |
| **Stripe** | **Test mode** (sandbox) keys + test €69 price + test webhook | **Live mode** keys + live €69 price + live webhook |
| **Vercel** | `staging` branch → stable staging URL (see topology below) | `main` branch → production domain |
| **AI (Anthropic)** | real key OK (small cost, so the demo works) | real key |
| **Email (Resend)** | verified domain or sandbox sender | verified domain |
| **`NEXT_PUBLIC_APP_URL`** | the staging URL | the production URL |

> ⚠️ **Staging = test data only.** Until audit blockers **B2** (broken GDPR delete), **B4** (public/cross-tenant photo storage) and **B1** (no paywall) are fixed, do **not** put real claimants'/opponents' personal data into staging. Demo with fake data only. See `PRE_DELIVERY_AUDIT.md`.

---

## 1. Supabase — staging (DONE)

The `Gut8er Pro` project is set up: 25 tables, `photos` public bucket, RLS + policies. Nothing more to do for staging DB.

**Still configure (Dashboard):**
- *Authentication → URL Configuration →* set **Site URL** to the staging URL and add it to **Redirect URLs**.
- *Authentication → Providers → Email →* for a smooth demo, decide whether to keep "Confirm email" on (real inbox) or off (instant login).
- *Authentication → Email Templates →* paste the branded templates from `supabase/email-templates/`, making sure `{{ .SiteURL }}` resolves to the staging URL.
- (Optional) Google/Apple OAuth providers if you want social login in the demo.

## 2. Supabase — production (LATER)

1. Create a **new** Supabase project in an account **you/the client own** (not a temporary account).
2. Set its connection string as `DATABASE_URL` and run: `pnpm prisma migrate deploy` (the migration file is now valid — the corruption was fixed 2026-08-05).
3. Create the `photos` bucket. Apply RLS — but **tighten the storage policies first** (B4): make the bucket private, serve via signed URLs, scope policies to the owner.
4. Configure Auth URLs/templates for the production domain.

## 3. Stripe — staging (test mode / sandbox)

Account: **Gut8er Pro sandbox** (`acct_1U0s6ZPX9t4iIbv4`).
**Already created (2026-08-05):** product `prod_V0tzOlQpRVmUYl`, price **`price_1U0sBUPX9t4iIbv4Bfkl6qui`** (€69/mo, EUR) → this is `STRIPE_PRO_PRICE_ID`. Webhook endpoint `we_1U0sHLPX9t4iIbv47qXutLDl` → `https://gut8er-pro.vercel.app/api/stripe/webhook` (6 subscription/invoice events); its signing secret is `STRIPE_WEBHOOK_SECRET` (delivered privately, not stored here). **When you move to the custom domain, update this endpoint's URL.**

1. In Stripe, switch to **Test mode** (toggle top-right) or use the **Sandbox**.
2. ~~Create the €69/mo price~~ — **done** (see above).
3. *Developers → API keys →* copy **test** `sk_test_…` → `STRIPE_SECRET_KEY`, and `pk_test_…` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
4. *Developers → Webhooks →* add endpoint `https://<staging-url>/api/stripe/webhook`, subscribe to: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `invoice.payment_succeeded`, `invoice.payment_failed` → copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`.
5. Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0341` (fails on charge — for trial-expiry testing).

> Note: because of audit **B1**, nothing is actually gated on payment yet, so Stripe is only exercising the billing plumbing until the paywall is built. That's fine for staging.

## 4. Vercel — topology

**Chosen 2026-08-05 (revised): `main` → staging, promote to production manually.**

Project: `prj_FRJ4NeY3xI8wQ31xk9xUKrJLVgE3`, team `gut8er-pro` (`team_3s7QvFLr84UC3SgMbwLurzsI`).
Current state: `main` deploys to the **production** target; domains `gut8er-pro.vercel.app` (+ git-main preview). **Vercel Authentication (SSO) is ON for all non-custom-domain URLs** — the `.vercel.app` links sit behind a login wall, which blocks *both* the client *and* Stripe webhooks / Supabase auth redirects. Staging must be made publicly reachable to function.

Target setup (dashboard):
1. **Make `main` → staging (not prod):** *Settings → Git → Production Branch* → set to `production` (create it first: `git branch production && git push -u origin production`). Now pushes to `main` are non-production (staging) deploys.
2. **Env vars:** set the staging values (§5) for the environment `main` deploys to (Preview, or the `staging` custom environment), including the Stripe **sandbox** keys + price ID above.
3. **Make staging publicly reachable** (required for webhooks + client access): attach a custom domain like `staging.gut8erpro.de` (custom domains bypass the SSO wall), OR relax deployment protection. A Vercel *Shareable Link* lets a human client in but does NOT unblock Stripe's server-to-server webhook — so for working webhooks you need a public URL.
4. **Promote to production manually:** when a `main` build is good → Vercel dashboard → *Promote to Production* (or merge `main` → `production`). Production keeps its own live env vars + domain.

Repo: `github.com/gut8er-pro/core`. Superseded reference (earlier branch-based patterns):

- **Pattern A — one project, branch-based (fewer moving parts):** existing Vercel project; `main` = Production env vars (prod Supabase + Stripe live), a long-lived `staging` branch = Preview env vars (staging Supabase + Stripe test). Vercel gives a stable per-branch URL; attach a custom domain like `staging.gut8erpro.de`. **Watch out:** Preview deployments may sit behind Vercel deployment protection (a login wall) — disable it or use a shareable link so the client can open it.
- **Pattern B — two projects (cleanest for a client link):** two Vercel projects from the same repo — `gut8er` (deploys `main`, production) and `gut8er-staging` (deploys `staging` branch). Each has its own env vars and its own domain. Clear separation, no protection confusion. Recommended when a client will use the staging link.

Set env vars (below) per environment/project. `NEXT_PUBLIC_*` and `DATABASE_URL`/service-role/Stripe/Anthropic/Resend all differ between staging and prod.

## 5. Env vars (per environment)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL          # staging: https://cqgzckghgoyzijxgbncw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     # staging project's anon key
SUPABASE_SERVICE_ROLE_KEY         # staging project's service_role secret
DATABASE_URL                      # staging Session-pooler URI (port 5432)
# Stripe (staging = test keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_PRO_PRICE_ID
STRIPE_WEBHOOK_SECRET
# AI / email
ANTHROPIC_API_KEY
RESEND_API_KEY
RESEND_FROM_ADDRESS
# App
NEXT_PUBLIC_APP_URL               # the environment's own URL
```

## Troubleshooting

**"Signed up, paid, then logged out / can't log in" + subscription not linked (`stripeSubscriptionId` stays null):**
1. **Env vars need a redeploy.** Vercel binds env vars to a deployment at build time — after adding them, **Redeploy production** (Deployments → ⋯ → Redeploy). An older build has stale/empty `NEXT_PUBLIC_SUPABASE_*`.
2. **Test on ONE host.** Use exactly `https://gut8er-pro.vercel.app` (= `NEXT_PUBLIC_APP_URL`), never a `-git-`/`-hash-` preview URL. Signup sets the session cookie on the host you're browsing; the Stripe `success_url` returns you to `NEXT_PUBLIC_APP_URL` — if those differ, you land logged-out.
3. **Disable the login wall** (Deployment Protection → Vercel Authentication → Off) so Stripe's webhook POST to `/api/stripe/webhook` isn't blocked (401). Verify in Stripe → Developers → Webhooks → endpoint → recent deliveries (want 200; 401 = wall, 400 = wrong `STRIPE_WEBHOOK_SECRET`).

## Open follow-ups (tracked in PRE_DELIVERY_AUDIT.md)
- Remove DAT from landing/onboarding/signup (ADR 0001).
- Fix B1 (paywall), B2 (GDPR delete), B4 (storage) before real client PII touches any environment.
- Disconnect the Neon + Vercel "Hyvia" MCPs so nothing is deployed/migrated to the wrong account.
