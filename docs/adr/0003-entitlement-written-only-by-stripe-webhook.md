# Entitlement is webhook-written; the billing page reads Stripe directly

`GET /api/stripe/billing` reads subscription state from Stripe by customer, while every
gated route reads entitlement from `User.plan`. That looks like one thing done two ways,
and it is deliberate: what the billing page shows must always agree with itself, and
entitlement must stay a single indexed read on the hot path of seven handlers.

The alternative we rejected was reconciling the two on read — letting the billing endpoint
write `plan` back whenever Stripe disagreed. It would have silently repaired the exact
state the September 2026 audit found, in which four accounts held active €69/month
subscriptions in Stripe and not one had a `stripeSubscriptionId` in our database. That is
the argument against it, not for it. The webhook had been answering Stripe with a 400 on
every event for roughly a month; a self-healing read would have gone on papering over that
page load by page load, and the only reason anyone noticed was that the damage stayed
visible. We would rather keep it legible.

## Consequences

- **The Stripe webhook is the only writer of `plan` after signup.** Any future code that
  grants or revokes entitlement belongs in `src/app/api/stripe/webhook/route.ts`, not
  wherever it is convenient. `completeSignup` used to break this by setting `plan: 'PRO'`
  before Stripe was involved, which is why abandoning Checkout left a fully entitled
  account behind.
- **Display and entitlement may visibly disagree, and are allowed to.** A user whose
  events were dropped sees an active subscription on the billing page while the gated
  routes refuse them. That is uncomfortable, and it is the point: it is a bug report a
  user can actually file, where a self-healing read produces only silence.
- **Reconciliation is a script run by hand that reports before it repairs** — never a
  scheduled job, never a side effect of a read.
- **`plan` stays the storage name for entitlement.** Renaming the column and the `Plan`
  enum is a migration that buys nothing today; `CONTEXT.md` carries the vocabulary instead.
- **`past_due` remains entitled.** Losing access the day a card fails, while Stripe is
  still retrying over roughly two weeks, costs more in goodwill than the unpaid usage is
  worth in a tool people bill their own clients from. `customer.subscription.deleted` is
  what downgrades.
