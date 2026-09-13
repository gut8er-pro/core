# 08 — External-dashboard wizard (Google, Apple, Stripe)

Status: resolved
Type: task

## Goal
Generate a step-by-step `wizard` (per the `mattpocock-skills:wizard` skill) for the changes only the owner can make in external UIs the agent cannot drive.

## Wizard steps to cover
- **Google Cloud Console** — add authorized redirect URI `https://app.gut8erpro.de/auth/callback` to the OAuth client (keep localhost for dev).
- **Apple Developer** — add the same return URL to the Services ID / Sign in with Apple config.
- **Stripe** — point the webhook endpoint to `https://app.gut8erpro.de/api/stripe/webhook`; if the signing secret is regenerated, update `STRIPE_WEBHOOK_SECRET` in the core Vercel project. (Checkout/portal return URLs need no dashboard change — they follow `APP_URL`.)

## Acceptance criteria
- A runnable wizard script that walks the owner through each dashboard with exact values.
- Clear verification checks (test OAuth sign-in; send a Stripe test webhook).

## Notes
Agent generates the wizard; the owner runs it. Supabase is NOT here — it's done via MCP in ticket 06.

## Comments

**2026-09-01 — implemented.** Wizard written to `.scratch/marketing-app-split/cutover-wizard.sh` (`bash -n` clean, executable). 4 stages: Google, Apple, Stripe, verification.

**Two of this ticket's three premises are wrong, and the wizard says so.** OAuth here is Supabase-mediated: `signInWithOAuth({ redirectTo })` sends the user to `https://cqgzckghgoyzijxgbncw.supabase.co/auth/v1/callback`, which is the URI Google and Apple are configured with. That URI does not change when the app moves to `app.gut8erpro.de`. Adding `https://app.gut8erpro.de/auth/callback` to Google's authorized redirect URIs (as this ticket asked) would have no effect; the app-side URL belongs in **Supabase's** redirect allow-list, which is ticket 06. So the Google and Apple stages are verification-only, and the Apple stage explicitly warns against adding the app URL as a Return URL.

Stripe is the one genuine external change, and the wizard has the owner paste the signing secret straight into Vercel rather than routing a production secret through the script.
