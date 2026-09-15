# 15 — Entitlement lifecycle: premature PRO, schema default, unhandled 402s

Status: ready-for-agent
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
