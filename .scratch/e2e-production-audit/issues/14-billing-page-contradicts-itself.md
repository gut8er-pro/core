# 14 — The billing page says "no subscription" above the subscription's paid invoices

Status: ready-for-agent
Type: bug
Severity: high

Split out of issue 02. Independent of both the live-mode blocker and issue 13 — worth
doing on its own merit, because it is what stops this contradiction returning the *next*
time webhook delivery lapses.

## The defect

`GET /api/stripe/billing` fetches a subscription only when `dbUser.stripeSubscriptionId`
is set (`billing/route.ts:41`), and the webhook is the only thing that ever writes that
column. With the webhook down (issue 13), the response is:

```json
{ "plan": "PRO", "trialEndsAt": "2026-08-12T…", "subscription": null,
  "paymentMethod": { "brand": "visa", "last4": "4242" },
  "invoices": [ …three, all status "paid"… ] }
```

`settings/[[...tab]]/page.tsx:741` does `hasSubscription = !!billing?.subscription`, so
the page renders **"Kein aktives Abonnement"** directly above a payment-history table
listing three paid invoices and a card on file. The same handler fetched those invoices
live from Stripe moments earlier — so the page disagrees with itself using two readings of
the same account.

## Work

1. **Read the subscription from Stripe by customer**, not from the cached column.
   `getSubscription(customerId)` in `src/lib/stripe/subscription.ts` already does this and
   is currently unused by the billing route.
2. **Ask for the live subscription, not the newest one.** `getSubscription` currently does
   `list({ customer, status: 'all', limit: 1 })`, which returns the most recently created
   regardless of status. Query `status: 'active'`, fall back to `trialing`, and only then
   report none. "Most recent" and "current" coincide today only because nobody has ever
   had two, which is exactly how it breaks quietly later — and it fixes the display for a
   genuinely cancelled customer, who currently sees their dead subscription.
3. **Leave entitlement alone.** `User.plan` stays the source of truth for the gated routes
   and this endpoint must not write it. ADR-0003 records why: a self-healing read would
   have hidden issue 13 for another month.

## Not doing

- **No test-mode banner.** Considered and declined — the app is deliberately in sandbox
  while verification clears, and issue 02 tracks that.
- **No caching of the extra Stripe call.** The handler already makes three or four; one
  more on a settings page nobody loads in a loop is not worth the staleness.

## Acceptance criteria

- With `stripeSubscriptionId` NULL in the database but an active subscription in Stripe,
  the billing page shows the active subscription, its renewal date, and "Plan verwalten"
  rather than "Zahlung einrichten".
- A customer whose only subscription is cancelled sees no active subscription.
