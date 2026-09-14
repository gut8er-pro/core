# 02 — Stripe runs in test mode in production, and subscription state contradicts itself

Status: ready-for-human
Type: bug
Severity: blocker

No real payment can be collected. Settings → Abrechnung also shows a self-contradictory state.

## Evidence

`GET /api/stripe/billing` on the live app returns three invoices whose links are all **test-mode**
URLs:

```
https://pay.stripe.com/invoice/acct_1U0s6ZPX9t4iIbv4/test_YWNjdF8xVTBzNlpQWDl0NGlJYnY0...
https://invoice.stripe.com/i/acct_1U0s6ZPX9t4iIbv4/test_...
```

Note the `test_` path segment. The card on file is `visa •4242` — Stripe's canonical test card.

So production is running against Stripe test keys. The 7-day trial → €69/month Pro flow described
in `CLAUDE.md` cannot charge anyone.

**Fix (human, in the Vercel + Stripe dashboards):** swap the production environment to live Stripe
keys, recreate the product/price in live mode, and re-point the webhook endpoint at the live
signing secret. Then redeploy.

## Second defect — subscription state is internally inconsistent

The same API response says:

```json
{ "plan": "PRO", "trialEndsAt": "2026-08-12T…", "subscription": null,
  "paymentMethod": { "brand": "visa", "last4": "4242" },
  "invoices": [ …three, all status "paid"… ] }
```

`subscription` is `null`, so `settings/[[...tab]]/page.tsx:741` (`hasSubscription = !!billing?.subscription`)
renders **"Kein aktives Abonnement"** — directly above a payment-history table showing three paid
invoices and a card on file. The UI tells the user they have no subscription while showing them
their subscription payments.

## Third defect — access is not gated on subscription state

`trialEndsAt` is `2026-08-12`, which is in the past (today is 2026-09-14), and `subscription` is
`null` — yet the account has full access to every Pro feature. Whatever the intended paywall is,
it is not being enforced. Worth deciding explicitly whether that is intentional for now, but it
should not ship unexamined.

## Also in this area

- Invoice descriptions come back from Stripe in English ("1 × Gut8erPRO Pro (at €69.00 / month)",
  "Free trial for 1 × Gut8erPRO Pro") and render untranslated in the German UI. Fix in the Stripe
  product configuration, or map to local strings. See issue 08.
- Amounts render as `€69.00` here but `0 €` on the plan card — see issue 08.
