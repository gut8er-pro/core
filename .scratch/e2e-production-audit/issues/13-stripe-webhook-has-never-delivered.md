# 13 — The Stripe webhook has never successfully written to the database

Status: resolved
Type: bug
Severity: blocker

Split out of issue 02, and the root cause of both defects reported there. **Not blocked by
the live-mode verification** — all of this is fixed and proven in sandbox.

> **One human step, and it gates only the final verification.** Every code task below can
> be written and merged today. See "Human step" before the acceptance criteria.

Read `docs/adr/0003-entitlement-written-only-by-stripe-webhook.md` before starting — it
governs what may write `plan` — and `CONTEXT.md` for **entitlement** / **lapsed** /
**trial**, which are not interchangeable.

## What is actually true

Read from Stripe (`acct_1U0s6ZPX9t4iIbv4`, sandbox) on 2026-09-15:

```
subscriptions : 4, all status "active", all EUR 6900/month on price_1U0sBUPX9t4iIbv4Bfkl6qui
                   each carries metadata.userId matching one of our four users
                   each has a default_payment_method
                   one is in its third billing period (2026-09-11 → 2026-10-11)
our database  : stripeSubscriptionId is NULL for all four
```

The four accounts are **genuinely subscribed**. The audit's reading — unentitled accounts
riding an expired trial — was wrong, and the fix is not to downgrade them. Our database
never learned their subscription ids.

### The four subscriptions

| `metadata.userId` | subscription | customer | `trial_end` |
|---|---|---|---|
| `4d30b014-ef3d-4550-86d1-eadb5ed2645c` | `sub_1U8MkTPX9t4iIbv4hJvOQvJv` | `cus_V8e1nRrsOsHEzw` | 2026-09-01T15:58:52Z |
| `a4cb94b6-3c1c-4a14-b2d1-b7e07980d8e0` | `sub_1U8MXLPX9t4iIbv4LZxkMy1a` | `cus_V8doE8C2VyZSSv` | 2026-09-01T15:45:17Z |
| `08653000-2e96-4ca6-887d-ae2cdc446eb9` | `sub_1U244CPX9t4iIbv4Ecj9v5yY` | `cus_V28KMkVIPB8go9` | 2026-08-15T06:49:11Z |
| `4bd78671-dfa5-493c-b82c-b18e3189581b` | `sub_1U0snjPX9t4iIbv4Pas8t54u` | `cus_V0ucyZumCqKryT` | 2026-08-12T00:35:18Z |

Reference only — task 2 derives this from the API rather than hardcoding it.

## Fault 1 — the signing secret (delivery)

Sandbox endpoint `we_1U0sHLPX9t4iIbv47qXutLDl`:

```
url         : https://gut8er-pro.vercel.app/api/stripe/webhook
description : "Gut8erPRO staging (sandbox) — temporary, swap URL to custom domain when DNS is ready"
status      : enabled
events      : customer.subscription.{created,updated,deleted,paused}, invoice.payment_{succeeded,failed}
```

The URL is the pre-cutover Vercel host, but that is **not** the fault — Vercel keeps
`.vercel.app` alive, and both hosts answer an unsigned POST with HTTP 400, which is the
route's own "missing stripe-signature" response. Requests reach the handler:

```
POST https://gut8er-pro.vercel.app/api/stripe/webhook   → 400
POST https://app.gut8erpro.de/api/stripe/webhook        → 400
```

So `stripe.webhooks.constructEvent` throws on every event, because `STRIPE_WEBHOOK_SECRET`
in Vercel is unset or does not match this endpoint. The app answers Stripe 400 every time
and Stripe stops retrying. This is the one check
`.scratch/marketing-app-split/cutover-wizard.sh` left SKIPPED.

## Fault 2 — a dead field path (code)

`src/app/api/stripe/webhook/route.ts:73`:

```ts
const subscriptionId = (invoice as unknown as { subscription?: string }).subscription ?? null
```

`Invoice.subscription` does not exist on `stripe@20.3.1` — confirmed against
`node_modules/stripe/types/Invoices.d.ts`, where the path is
`invoice.parent.subscription_details.subscription`, typed `string | Stripe.Subscription`.
The cast through `unknown` is what let it compile. The expression is always `undefined`, so
the handler writes `stripeSubscriptionId: null`, clearing the column that
`customer.subscription.created` set correctly moments earlier. Stripe fires both on a new
subscription, so even with delivery fixed this is an ordering race that nulls the column
intermittently.

---

## Task 1 — delete the `invoice.payment_succeeded` branch

Do not repair the field path. `customer.subscription.created` already writes
`stripeSubscriptionId` and `plan` from a properly typed field and covers every case this
branch does; keeping it means a second writer of the same column, racing the first, for no
added coverage. Per ADR-0003 there is one writer of `plan`.

Remove this entire case from `src/app/api/stripe/webhook/route.ts`:

```ts
case 'invoice.payment_succeeded': {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string

    if (invoice.billing_reason === 'subscription_create') {
        const subscriptionId =
            (invoice as unknown as { subscription?: string }).subscription ?? null

        await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: {
                plan: 'PRO',
                stripeSubscriptionId: subscriptionId,
            },
        })
    }
    break
}
```

**Keep `invoice.payment_failed`** — it does something the subscription events do not.
It then falls to the `default` case and logs once per payment; trimming the event from the
endpoint's subscription list is a Stripe-side follow-up, not part of this ticket.

## Task 2 — a reconciliation script

`scripts/reconcile-subscriptions.mjs`. Plain Node ESM, not TypeScript: the repo has no
`tsx` or `ts-node`, and already uses `node --env-file-if-exists=.env` for the integration
runner. Outside `src/`, so Biome (which lints `src/` only) does not cover it.

```
node --env-file=.env scripts/reconcile-subscriptions.mjs          # report only
node --env-file=.env scripts/reconcile-subscriptions.mjs --write  # apply
```

Behaviour:

- Read every `User` with a non-null `stripeCustomerId`.
- For each, ask Stripe for that customer's subscriptions, preferring `status: 'active'`,
  then `trialing`, then none — the same precedence issue 14 applies to the billing page.
- Compare `stripeSubscriptionId`, `trialEndsAt` (from `trial_end`) and `plan` against
  Stripe, and print one line per user showing current → proposed for each field that
  differs. Print a summary count. Exit 0 whether or not diffs were found.
- **Write nothing without `--write`.** This is the point of the script, not a convenience:
  ADR-0003 rejects silent repair, so it reports before it repairs.
- Also report users whose `stripeCustomerId` matches no Stripe customer, and Stripe
  subscriptions whose `metadata.userId` matches no user — both are real states after a
  mode swap, and neither should throw.

This replaces a hand-written backfill. Same effect today with four users; it is the thing
you run after the next outage instead of rediscovering this by audit.

## Task 3 — backfill

Run task 2 with `--write` against the sandbox database. Expected outcome: all four users
gain their `stripeSubscriptionId` and a corrected `trialEndsAt`; `plan` stays `PRO`, which
is already right by luck. Paste the report output into this ticket's Comments.

## Task 4 — tests

`src/app/api/stripe/webhook/route.ts` has **no test file** — the handler that has never
worked in production is also the one with no coverage. Add
`src/app/api/stripe/webhook/route.test.ts` covering, with a mocked Prisma and a stubbed
`constructEvent`:

- `customer.subscription.created` with status `trialing` → `plan: 'PRO'`, id written.
- `customer.subscription.updated` to `canceled` → `plan: 'FREE'`, id cleared.
- An unhandled event type does not throw and returns 200.
- A `Record to update not found` failure returns 200, not 500 — Stripe must not retry a
  user row that does not exist.
- No test may assert on `invoice.payment_succeeded`; task 1 removes it.

Do not encode `past_due` behaviour either way — issue 15 changes it, and a test written now
would have to be rewritten there.

## Human step

Gates only the acceptance criteria below; every task above is independent of it.

1. Open endpoint `we_1U0sHLPX9t4iIbv47qXutLDl` in the sandbox dashboard. Its recent-
   deliveries panel should show the 400s and their error text — worth a look, it confirms
   the diagnosis outright rather than by inference.
2. Reveal the signing secret, paste it into Vercel as `STRIPE_WEBHOOK_SECRET`, redeploy.
3. Once the criteria below are green, repoint the endpoint URL to
   `https://app.gut8erpro.de/api/stripe/webhook` — after, not before, so a continuing
   failure still means something.

## Acceptance criteria

- A fresh sandbox Checkout writes `stripeSubscriptionId` within seconds.
- Cancelling one of the four subscriptions in Stripe flips exactly that user to `FREE` —
  this is the direction that matters, and the one that has never once worked.
- The endpoint's delivery panel shows 200s.
- `npm run type-check`, `npm run test` and `npm run lint` clean.
- Re-running task 2 without `--write` reports no diffs.

## Comments

**2026-09-15 — tasks 1, 2 and 4 done; task 3 has nothing to write, for a reason worth
reading. Closed as `resolved` on the code. The signing secret is still unset in Vercel,
and is tracked as the "Human step" above rather than by holding this ticket open.**

Task 1 — the `invoice.payment_succeeded` branch is gone from
`src/app/api/stripe/webhook/route.ts`, replaced by a comment saying why it is not coming
back. The event still reaches the endpoint and now falls to `default`, which answers 200
and logs; trimming it from the endpoint's event list stays a Stripe-side follow-up.
`invoice.payment_failed` is untouched, including its `attempt_count >= 2` downgrade —
that is issue 15's to settle, alongside `past_due`.

Task 4 — `src/app/api/stripe/webhook/route.test.ts`, 8 cases: the id written on
`customer.subscription.created` while `trialing`, `updated → canceled` lapsing the
account, `deleted` clearing the id, an unhandled type answering 200, a missing user row
answering 200, any other write failure answering 500, and both signature refusals.
Nothing asserts on `invoice.payment_succeeded` or on `past_due`.

Task 2 — `scripts/reconcile-subscriptions.mjs`, plain Node ESM on `pg` (the generated
Prisma client is TypeScript source and there is no loader for scripts). Its decision
logic is a pure `reconcileUser`, covered by `scripts/reconcile-subscriptions.test.mjs`
(12 cases); `vitest.config.ts` now includes `scripts/**/*.test.mjs` so the one thing that
writes entitlement by hand is not the one thing without tests.

One deliberate widening of the spec. The ticket has it reconcile users that have a
`stripeCustomerId`; it also matches the other way, from `subscription.metadata.userId`
back to a row, and proposes `stripeCustomerId` as a fourth field. Without that it cannot
see the row this outage actually produces — Checkout completed, every event refused, our
row never learned *any* Stripe id — and, worse, it would report that row as clean. It
never clears a customer id; a customer Stripe no longer has is reported instead.

### Task 3 — there are no rows to back-fill. `public."User"` is empty.

```
node --env-file=.env scripts/reconcile-subscriptions.mjs

── reconcile (report only) ──

Stripe subscriptions matching no user of ours:
  sub_1U8MkTPX9t4iIbv4hJvOQvJv (active) customer cus_V8e1nRrsOsHEzw, metadata.userId 4d30b014-ef3d-4550-86d1-eadb5ed2645c
  sub_1U8MXLPX9t4iIbv4LZxkMy1a (active) customer cus_V8doE8C2VyZSSv, metadata.userId a4cb94b6-3c1c-4a14-b2d1-b7e07980d8e0
  sub_1U244CPX9t4iIbv4Ecj9v5yY (active) customer cus_V28KMkVIPB8go9, metadata.userId 08653000-2e96-4ca6-887d-ae2cdc446eb9
  sub_1U0snjPX9t4iIbv4Pas8t54u (active) customer cus_V0ucyZumCqKryT, metadata.userId 4bd78671-dfa5-493c-b82c-b18e3189581b

0 user(s), 0 drifted, 0 orphaned customer(s), 4 unattributed subscription(s).
```

The ticket reads the four rows as having a NULL `stripeSubscriptionId`. They do not have
a NULL anything — the rows are gone. Against project `cqgzckghgoyzijxgbncw`, the same
project whose `auth.users` holds all four of these `metadata.userId` values:

```
User 0    Business 0    Report 0    auth.users 4
_prisma_migrations: 20260914120000_init, applied 2026-09-14 23:42:13Z
```

The init migration was regenerated and re-applied yesterday, per
`prisma/migrations/README.md`, which drops and recreates the public schema. `auth.users`
lives in another schema and survived. So four people hold Supabase identities and live
€69/month subscriptions, and the application knows none of them.

Consequences for the criteria below, and for issue 15:

- The backfill criterion is moot. Nothing is stale; nothing exists.
- When these four next sign in through OAuth, `src/app/auth/callback/route.ts` recreates
  the row with `plan: 'FREE'` and no `stripeCustomerId` — correct for a new signup, wrong
  for a paying customer, and no Stripe event fires on a login to correct it. That is the
  case the metadata matching above was added for: run the script after they return and it
  links row to subscription in one pass. Until then the script reports them, which is the
  point.
- Whether the four should instead be re-linked before they notice is a call for whoever
  owns the accounts, not for this ticket. The script makes it one command either way.

### What is verified, and what is not

Green: `npm run type-check`, `npm run lint`, `npm run test` (846 passed, 17 skipped —
the two integration files, which need `DATABASE_URL` in the vitest env).

Not verified, and not verifiable from here: everything downstream of the signing secret.
The three criteria about delivery all wait on the human step. Nothing in this ticket's
code changes that, and none of it needed to.
