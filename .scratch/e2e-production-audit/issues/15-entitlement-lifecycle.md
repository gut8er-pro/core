# 15 — Entitlement lifecycle: premature PRO, schema default, unhandled 402s

Status: resolved
Type: bug
Severity: high
Blocked by: 13 — none of this may ship until webhook delivery is proven green. Shipping
it while the webhook is down would refuse a genuinely paying customer, because the webhook
is the only thing that would restore them.

Split out of issue 02, where it was reported as "access is not gated on subscription
state". See ADR-0003 for the model these changes implement, and `CONTEXT.md` for the
vocabulary — in particular **lapsed**, which is not a tier.

## The rules, as settled

A subscription buys report creation and the AI features. It does not gate work already
produced: a lapsed user keeps reading, editing, exporting, sending and invoicing every
Gutachten they own. Seven POST handlers call `getEntitledUser()` — `POST /api/reports`,
`reports/[id]/generate`, `reports/[id]/calculation/auto-fill`, and the four `/api/ai/*`
routes. Everything else stays on plain authentication.

## Work

1. **Remove `plan: 'PRO'` from `completeSignup`** (`src/lib/auth/actions.ts:116`), which
   currently grants entitlement plus a seven-day `trialEndsAt` before Stripe is involved —
   so abandoning Checkout leaves a fully entitled account. This is the email-signup twin of
   the OAuth hole closed in `11e3f96`. After this, the webhook is the sole writer.
2. **Flip `plan Plan @default(PRO)` to `@default(FREE)`** in `prisma/schema.prisma`.
   Pre-launch, so it folds into the regenerated init migration per
   `prisma/migrations/README.md` rather than stacking a new one.
3. **Handle the Checkout race on the client.** Removing (1) means a user returning to
   `/?payment=success` may arrive before the webhook lands and briefly see themselves as
   lapsed on their first screen. Poll `/api/settings` for a few seconds there before
   deciding. Do not solve this by keeping the premature grant.
4. **Route the six AI 402s through `SubscriptionRequiredError`.** It is currently thrown in
   one place (`use-reports.ts:71`) and handled in one place (`page.tsx:113`), so the AI
   routes return 402 and the client shows a generic failure. Toast should say AI needs an
   active subscription and that existing reports are unaffected.
5. **Stop treating `past_due` as lapsed.** `webhook/route.ts:33` excludes it from
   `ACTIVE_STATUSES`, so a failed renewal revokes access the same day while Stripe retries
   over roughly two weeks. Let `customer.subscription.deleted` do the downgrading. If the
   hard line ever comes back it needs a dunning email first, and there is none.

## Not doing

- **No redirect for lapsed users.** The commit message on `11e3f96` claims
  `(app)/layout.tsx` redirects a FREE user to `/settings/billing`. It does not, and never
  did — the only redirect is the `SubscriptionRequiredError` handler at `page.tsx:113`,
  which fires after a failed create. Leave the app navigable: a lapsed user legitimately
  keeps read, edit, export and send on everything they own, and bouncing them to billing
  would block work they are still entitled to do. The per-action refusal in (4) tells them
  why at the moment it matters. The claim should be struck from the notes quoted in
  `.scratch/google-oauth/issues/01-enable-google-oauth.md` so nobody goes looking for code
  that is not there.
- **No rename of `plan` / the `Plan` enum.** A migration that buys nothing today;
  `CONTEXT.md` carries the vocabulary instead.

## Acceptance criteria

- Abandoning Checkout leaves an account that cannot create a report or use AI.
- Completing Checkout leaves an entitled account, with no visible lapsed flicker on
  `/?payment=success`.
- Each of the six AI features, invoked by a lapsed user, explains itself.
- A subscription entering `past_due` does not revoke entitlement; the same subscription
  reaching `deleted` does.

## Comments

**2026-09-15 — all five tasks done, shipped as `07ef17f` on `main`. Closed as `resolved`
on the code; the deploy still waits on issue 13's human step, and that ordering matters —
see the end.**

Task 1 — `completeSignup` creates the row with `plan: 'FREE'` and no `trialEndsAt` at all.
Not just the entitlement: the seven-day date it invented was a second opinion on a
question Stripe answers (`CONTEXT.md`, **trial**), and the webhook caches the real
`trial_end` when it arrives. Three cases in `src/lib/auth/actions.test.ts`.

Task 2 — `plan Plan @default(FREE)`, and the init migration regenerated per
`prisma/migrations/README.md`. It is now `prisma/migrations/20260915120000_init`; the
only line that differs from the old one is the `"plan"` default. **This needs a
`prisma migrate reset` against any database already holding the previous init** — a new
migration id on a schema that exists will not apply. Issue 13 found `public."User"`
empty, so there is nothing to preserve, but the reset is not optional and no deploy step
runs it (`build` is `prisma generate && next build`).

Task 3 — `waitForEntitlement` in `src/hooks/use-subscription.ts` polls `/api/settings`
every 750ms for 12s, and `useCheckoutReturn` runs it on the dashboard when the URL
carries `payment=success`. While it waits, "Neues Gutachten" shows
"Abonnement wird aktiviert …" and is disabled, and the report-type menu that
`?new-report=1` opens waits with it — otherwise the race is visible exactly where it
hurts, one click after paying. The param is cleared on arrival and is never read as
entitlement; anyone can type it. Three widenings of the spec worth naming:

- `/signup/complete` forwards `payment=success` to the dashboard. Stripe returns the
  wizard to that screen, not to `/`, and nothing there is gated — the first gated thing
  is one click further on, which is where the wait had to be.
- `fetchSubscription` defaulted a missing `plan` to `PRO`. Polling a fail-open read for
  entitlement would have answered "entitled" to a response we could not parse.
- The wait ends whether or not the webhook lands, and then invalidates the settings and
  subscription queries. A webhook that never arrives leaves a lapsed account, which the
  next paid action explains; it does not leave a spinner.

Task 4 — `src/lib/ai/client.ts` throws `SubscriptionRequiredError` on 402 for all four
`/api/ai/*` routes (one `postToAiRoute` helper; 12 cases in `client.test.ts`), and the
four mutations in `use-ai.ts` toast `toast.aiSubscriptionRequired` by default, so a
future caller gets the explanation without wiring it. `useGenerateReport` carries the
402 as `status.subscriptionRequired`, and the gallery toasts once and prints the
translated line in the error box it already had. The calculation page does the same for
auto-fill. New key at both locales' full parity; the routes' English "Subscription
required" never reaches a screen.

Task 5 — `past_due` is in `ACTIVE_STATUSES`, and the `invoice.payment_failed` branch no
longer writes `plan: 'FREE'` on the second attempt — that was the same hard line by
another route. It still logs. Two cases added to the webhook test. **`ENTITLED_STATUSES`
in `scripts/reconcile-subscriptions.mjs` moved with it**, which its own comment had
already flagged as this ticket's job: left behind, the reconciliation script would have
lapsed by hand the customer the webhook is deliberately keeping.

Also struck the `(app)/layout.tsx` redirect claim from
`.scratch/google-oauth/issues/01-enable-google-oauth.md`, in both places it appeared —
the bullet claiming it was added and the paragraph claiming it was then removed. Neither
happened: the file has not been touched since `df9eaf6`.

### Review pass — one real bug, and four cleanups

`/code-review` on the finished diff, two axes in parallel. The spec axis found something
that would have shipped:

**`useCheckoutReturn` hung under React StrictMode**, which is Next's development default.
The effect consumed the param *before* starting the wait, so StrictMode's second mount
found nothing to do and returned early, while the first mount's cleanup had already set
the `cancelled` flag that suppressed its answer. Result: "Neues Gutachten" disabled on
"Abonnement wird aktiviert …" for ever — a worse lie than the flicker the wait exists to
prevent, and invisible to the original tests because `renderHook` does not use StrictMode
unless asked. Now a `hasStartedRef` starts the wait once and nothing cancels it (settling
state after unmount is a no-op in React 18+), with a test that renders through
`StrictMode`.

Four standards findings, all taken:

- The read-param → delete → `replaceState` shape was written twice, in
  `useCheckoutReturn` and the dashboard's `?new-report=1` effect, each hardcoding `/`.
  Now one `consumeQueryParam` in `src/lib/navigation.ts`, tested directly — including
  that consuming one param leaves the other intact, which is the state the one journey
  that matters passes through.
- One 402 was compared four ways. `isSubscriptionRequired(response)` in
  `src/lib/api/errors.ts` now names it once, next to the error type it belongs to.
- `useTranslations('toast')` + `useToast()` had been pasted into three components.
  `useSubscriptionNotice` returns `{ message, notify }` — the sentence single-sourced,
  since two of the three screens print it where the failure happened as well as toasting.
- The webhook's `ACTIVE_STATUSES` and the script's `ENTITLED_STATUSES` were one concept
  under two names. Both are `ENTITLED_STATUSES` now, matching `CONTEXT.md`.

Also fixed: `prisma/migrations/README.md` still named the migration this ticket replaced.

Not taken: the AI client's English fallback strings (`'VIN detection failed'` and the
other three) are untranslated, which the standards axis correctly flags against CLAUDE.md.
They are pre-existing, they only surface when a route returns no `error` field, and
translating them means moving the strings up to the call sites — issue 08's territory,
not a change to make while nothing renders four of them.

### Not done, and visible from here

- `useProStore` still initialises `isPro: true`. It is a fail-open default on the client
  mirror, but nothing reads `useProStatus` today and `(app)/layout.tsx` overwrites it
  from `/api/settings` on mount, so flipping it would change no pixel and would need its
  own test rewritten. Recorded rather than quietly changed.
- **Four of the six AI features have no caller.** `use-ai.ts` and the four functions in
  `lib/ai/client.ts` are imported by nothing outside their own tests; only `generate` and
  `calculation/auto-fill` are reachable from the UI today. So the acceptance criterion is
  demonstrable end-to-end for two of six, and for the other four it holds at the seam —
  the client throws the typed error and the mutations toast by default, so the
  explanation exists the moment a screen calls them. Worth knowing before someone tests
  all six by hand and finds four buttons that do not exist.
- The E2E suite signs in as a fixed account against a live database. With the schema
  default flipped, that account must be `PRO` in the database or every create-report spec
  now fails with a 402. Not reachable from here — no dev server, no `DATABASE_URL`.

### Verified

`npm run type-check`, `npm run lint` (the 119 warnings are pre-existing), `npm run test`
— 896 passed, 17 skipped (the two integration files, which need `DATABASE_URL`) — and
`npm run build` compiles.

Not verified, and not verifiable from here: anything downstream of webhook delivery. This
is the ticket that makes the webhook load-bearing — before it, an abandoned Checkout
still left an entitled account, so a dead webhook cost nothing. **After it, a dead
webhook refuses a paying customer.** Issue 13's human step (the signing secret in Vercel)
is the thing that must be green before this deploys, exactly as the Blocked-by line says.
