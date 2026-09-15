# 14 — The billing page says "no subscription" above the subscription's paid invoices

Status: resolved
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

## Resolution

`GET /api/stripe/billing` now asks Stripe for the subscription by customer, through
`getSubscription`, and no longer reads `User.stripeSubscriptionId` at all — the column is
gone from its `select`. The page's two readings of the account are one reading, taken in
the request that also fetches the card and the invoices. Entitlement is untouched: `plan`
is served exactly as the database has it, and a test asserts the handler never writes it.

`getSubscription` asks for each current status in turn — `active`, then `trialing`, then
`past_due` — instead of taking the newest of `status: 'all'`, and returns the whole
display shape (id, billing period, trial end, cancellation) rather than the three fields
it used to. One Stripe call for anyone who has a subscription; three only for someone who
has none.

### Two deviations from the plan above

**`past_due` is in the status chain.** The ticket said active, then trialing, "and only
then report none". Stripe retries a failed card for roughly two weeks and the subscription
stands throughout, so reporting none would offer a customer who already owes on one
subscription the "Zahlung einrichten" button — a second Checkout, a second €69/month. It
is also what the code does whenever the webhook is up, since
`customer.subscription.updated` writes the id on a `past_due` transition; omitting it
would have been a regression dressed as a fix.

This is display only and writes no entitlement. Note what the customer now reads:
"€69,00 / Monat · Verlängerung am {date}" — reassuring wording for a card that is
failing. Saying something truer needs a `past_due` state on this card, which belongs with
issue 15 and the ADR-0003 rule it implements (`past_due` stays entitled). Today's webhook
still writes FREE on `past_due`, contradicting that ADR; that contradiction is issue 15's,
not this one's, and nothing here touches it.

`unpaid` and `paused` are deliberately outside the chain: Stripe has stopped trying on
both, and the webhook already treats `paused` as a downgrade. Where they belong is the
same lifecycle question issue 15 owns.

**Two things outside the endpoint were fixed, because both were this same defect.**

1. `trialEndsAt` is a cache of Stripe's `trial_end` and "has no vote" (CONTEXT.md), yet
   the handler served it while holding the authoritative value. It has the same sole
   writer as `stripeSubscriptionId` and was NULL for the same accounts, so the page
   computed `isTrialing` from a live Stripe status and the countdown from an empty cache
   — and showed a customer mid-trial a renewal date instead of their days left. The
   subscription's `trial_end` now overrules the cache whenever there is a subscription;
   with none to defer to, the cache is all there is and it stands.
2. `getPlanStatusText` in `BillingSection` fell through to "Kein aktives Abonnement"
   whenever there was no renewal date to print — beside the "Tarif verwalten" button the
   same subscription had just produced. That is this ticket's contradiction in miniature,
   at the component the ticket names. It now says `billing.subscriptionActive`
   ("Abonnement aktiv" / "Subscription active", added to both locales at parity) and the
   denial is reachable only when there really is no subscription.

### Verified

- `src/lib/stripe/subscription.test.ts` — 7 tests, new file: status precedence, the
  cancelled-only case, and the v20 period-on-the-item mapping.
- `src/app/api/stripe/billing/route.test.ts` — 11 tests, new file: both acceptance
  criteria against a mocked Stripe, the trial-authority rule, both payment-method paths,
  the Stripe-outage fallback, and the ADR-0003 rule that this handler reads entitlement
  and never repairs it.
- Green: `npm run type-check`, `npm run test`. `npx biome check` is clean on every touched
  file; the repo's pre-existing lint errors are elsewhere and untouched.
- Reviewed on both axes. The Standards axis found the `trialEndsAt` violation and the
  Spec axis the `getPlanStatusText` fall-through and an inert cancelled-subscription
  fixture (keyed `all:`, a status the code never queries, so the mock returned nothing
  either way); all three are fixed above. Declined, with reasons: collapsing the two test
  files' fixtures into a shared module, deleting the pre-existing unused `isProPlan`, and
  importing `SubscriptionInfo` into the client hook rather than mirroring it — the last
  would put a one-keyword edit between the Stripe secret and the client bundle.
- Not verified from here: the page against live Stripe data. That wants the four accounts
  from issue 13 back, and the human step that ticket is waiting on.
