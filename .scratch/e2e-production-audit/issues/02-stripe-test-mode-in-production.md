# 02 — Stripe live-mode cutover

Status: ready-for-human
Type: bug
Severity: blocker
Blocked: external — the client has not completed Stripe business verification, so live
mode is unavailable. Nothing in this ticket can start until that clears.

Production runs against Stripe test keys, so no real payment can be collected. The
7-day trial → €69/month flow works end to end, but in sandbox
(`acct_1U0s6ZPX9t4iIbv4`, name "Gut8er Pro sandbox" — the only account the API exposes).

## Evidence

`GET /api/stripe/billing` returns invoices whose links all carry a `test_` path segment:

```
https://pay.stripe.com/invoice/acct_1U0s6ZPX9t4iIbv4/test_YWNjdF8xVTBzNlpQWDl0NGlJYnY0...
https://invoice.stripe.com/i/acct_1U0s6ZPX9t4iIbv4/test_...
```

The card on file is `visa •4242` — Stripe's canonical test card.

## Scope note

This ticket was originally four defects in one. The other three did not depend on live
mode and have been split out; two of them turned out to be the same root cause.

- **13** — the webhook has never delivered. This is what made the billing page contradict
  itself and what left entitlement unenforced. Not blocked; do it first, in sandbox.
- **14** — the billing page reads a stale local column instead of Stripe.
- **15** — entitlement lifecycle: premature `PRO` at signup, schema default, AI 402s.
- **08** — the English invoice descriptions and the `€69.00` / `0 €` formatting split.

## Runbook — when verification clears

Do these in order. Step 2 is the one that is easy to miss and breaks Checkout for every
existing user if skipped.

1. **Recreate the product and price in live mode.** The sandbox price is
   `price_1U0sBUPX9t4iIbv4Bfkl6qui` (EUR 6900, monthly, product `prod_V0tzOlQpRVmUYl`).
   Set the new live price id as `STRIPE_PRO_PRICE_ID` in Vercel.
2. **Null the stale sandbox customer ids.** Every existing user holds a *test-mode*
   `stripeCustomerId`. `checkout/route.ts:36` treats any non-null value as reusable and
   passes it to `checkout.sessions.create({ customer })`; against live keys Stripe answers
   `No such customer` and — unlike `billing/route.ts` — there is no try/catch, so it is a
   500. The first click on "Zahlung einrichten" after the cutover fails without this.

   ```sql
   UPDATE "User" SET "stripeCustomerId" = NULL, "stripeSubscriptionId" = NULL;
   ```

   Harden `checkout/route.ts` to catch `resource_missing` and re-create the customer, as
   defence in depth for the general case of a deleted Stripe customer.
3. **Swap `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** to the live pair.
4. **Create the live webhook endpoint** at `https://app.gut8erpro.de/api/stripe/webhook`
   with the same six events as the sandbox one, and paste its signing secret into Vercel
   as `STRIPE_WEBHOOK_SECRET`. A live endpoint has its own secret; the sandbox value will
   not work.
5. **Redeploy**, then run the acceptance check from issue 13 against live mode.

## Acceptance criteria

- A real card completes Checkout and the resulting invoice URL has no `test_` segment.
- The user's `stripeSubscriptionId` is written within seconds of Checkout completing.
- Cancelling that subscription in Stripe flips the same user to `FREE`.
