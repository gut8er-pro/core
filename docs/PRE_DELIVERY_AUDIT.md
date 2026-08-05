# Pre-Delivery Audit — Gut8erPRO

> **Date:** 2026-08-05
> **Purpose:** Independent readiness review before the app is delivered to paying clients.
> **Method:** Live inspection of the Supabase project (via MCP) + six parallel code auditors, each reading the actual source on `main`. Every finding below was verified in code or against the live environment — none are speculative. Documentation claims (`CLAUDE.md`, `RELEASE_CHECKLIST.md`) were treated as unverified and checked.
>
> **Headline verdict:** **Not ready for paying clients.** The source-code craftsmanship is genuinely good (strict TS, no `any`, real AI pipeline, correct Stripe webhook plumbing, authenticated routes). But there are **6 launch-blocking issues** — the paywall enforces nothing, GDPR account-deletion leaves PII behind, the advertised primary integration (DAT) is fake, photo storage is world-readable, and **production was never actually stood up**. These are fixable, but they must be fixed before a client touches the app.

---

## 0. Infrastructure reality (verified live)

| Fact | Evidence |
|------|----------|
| **Production DB was never provisioned** | The only Supabase project (`Gut8er Pro`, eu-west-1) contains 0 application tables, 0 `auth.users`, 0 storage buckets, 0 migrations. The ~25 Prisma models don't exist there. |
| **This checkout can't run** | No `.env` present (only `.env.example`); `DATABASE_URL` unset → `src/lib/prisma.ts:6` throws on first query. The "62/62 verified" runs happened in another environment whose secrets didn't travel with the repo. |
| **No client PII at risk today** | Because there's no data and no users yet. This is the one silver lining. |
| **Neon MCP is the wrong account** | Connected to org "Hyvia" (unrelated product). Disconnect it so nobody runs a migration against the wrong DB. |
| **RLS applied? Unknown** | `supabase/enable-rls.sql` is a manual paste-into-dashboard script, not in migrations, referenced nowhere. Cannot verify it was ever run on the live DB. |

---

## 1. 🚨 Launch blockers (fix before any paying customer)

### B1 — The €69/month paywall enforces nothing
No code path anywhere reads `user.plan` to block a feature. The only gate component (`src/components/ui/pro-feature-gate.tsx:32`) is stubbed to always pass and isn't even imported. Signup (`src/lib/auth/actions.ts:114`) sets `plan=PRO` **before** payment and wraps the Stripe step in a `try/catch` marked "non-fatal — user can set up payment later"; nothing forces a card. **Anyone can sign up and use every Pro feature — AI, reports, send — free, forever.** The Stripe webhook downgrade logic is correct but writes to a column nothing consults.
→ Add a server-side `requireProAccess()` guard (reads `plan` + `trialEndsAt`, returns 402) on report-create, all report write routes, `/generate`, and every `/api/ai/*` route. Flip `Plan` default from `PRO` to `FREE` (`prisma/schema.prisma:25`). Grant PRO only when the `customer.subscription.created` webhook confirms `trialing`/`active`.

### B2 — Account deletion doesn't erase the person (GDPR / DSGVO Art. 17)
`src/app/api/account/delete/route.ts`:
- **Photos survive.** The storage-delete loop lists one level too shallow and passes a folder prefix to `remove()`, which matches no object key → deletes 0 bytes. Every damage photo, VIN/plate photo, and **scanned Zulassungsbescheinigung** (owner name + address) persists behind a public URL after "deletion."
- **Stripe customer/subscription never cancelled** (no Stripe import in the file) → the "deleted" user keeps getting charged and Stripe keeps their PII.
- **Company logo** (`logos/*`) is never scanned → orphaned forever.
- **Swallowed error:** `prisma.user.delete(...).catch(() => {})` hides any real DB failure, then deletes the auth user anyway and returns `success: true` → orphaned, un-erasable PII reported as a successful erasure.
→ Delete storage objects by exact key derived from `Photo`/`Business` rows; cancel the Stripe subscription + delete the customer; only swallow Prisma `P2025`; check every storage result.

### B3 — DAT SilverDAT3 is advertised but 100% fake
`src/components/report/calculation/dat-modal.tsx` has zero network calls (the valuation button has no `onClick`); there is no DAT client anywhere. Signup/Settings collect DAT credentials into `Integration.encryptedCredentials` **as plaintext** (`JSON.stringify`, no crypto in the repo) and never read them. DAT is on the landing page and onboarding as the "primary" integration. Shipping this = guaranteed refunds/chargebacks.
→ **Decision needed:** wire real SilverDAT3, or strip DAT from landing/onboarding/signup for v1 and ship calc as fully-manual. Either way, stop storing credentials in plaintext.

### B4 — Photo storage is world-readable and cross-tenant deletable
`supabase/enable-rls.sql:220` — the `photos` bucket is public and every storage policy authorizes on `bucket_id='photos'` **alone**, with no owner/path predicate. So any authenticated user can read *or delete* any object in the bucket if they know the path. Uploads use `getPublicUrl`, so claimant/opponent PII photos are world-readable to anyone with the URL.
→ Make the bucket private, serve via signed URLs, and scope each storage policy to the owning report/user.

### B5 — IDOR: one user can overwrite/delete another user's photos
`src/app/api/reports/[id]/photos/[photoId]/route.ts:66` — PATCH verifies the *report* belongs to the caller but then updates the photo by `photoId` alone (no `reportId` scoping), and `deleteMany({ where: { photoId } })` wipes the victim's annotations. Attack: `PATCH /reports/{my report}/photos/{victim's photoId}`. The photo UUID is exposed in the public storage URL (see B4).
→ Scope the write: `updateMany({ where: { id: photoId, reportId: id } })`. (Also fix the sibling tire-update IDOR at `condition/route.ts:275`.)

### B6 — Production environment does not exist
See §0. Before any client: provision the DB (run/baseline the Prisma migration), create the storage bucket(s), apply RLS as a *tracked* step, configure Supabase auth (redirect URLs, email templates pointing at the prod domain), and set every secret in the deployment env.

### B7 — The init migration file was corrupted and would fail `migrate deploy` (FIXED 2026-08-05)
`prisma/migrations/20260514160136_init/migration.sql` had a stray Prisma CLI update banner (`┌── Update available 7.4.0 -> 7.8.0 ──┐ …`) captured into lines 629–634 — non-SQL text that would make `pnpm prisma migrate deploy` fail with a syntax error on any fresh DB. Undetected because the dev DB used `db push` (which never reads this file). **Fixed** by truncating the file to the 628 valid SQL lines; new checksum `249a61bb…`. The prod-provisioning path (`migrate deploy`) now works.

### B8 — Middleware redirected the Stripe webhook to /login → webhooks never worked in any deployed env (FIXED 2026-08-05)
`src/lib/supabase/middleware.ts` ran on all paths (`src/middleware.ts:17` matcher) and redirected any unauthenticated non-public request to `/login` (307). `/api/stripe/webhook` was not on the public list, so **every** Stripe delivery got `307 → /login` and never reached the signature-verified handler. Observed live: Stripe delivery log showed `307 {"redirect":"/login"}` for `customer.subscription.created` / `invoice.payment_succeeded`. Consequence: subscription linking, trial-expiry downgrade, and payment-failed handling (the logic B1's fix depends on) were all silently dead in every deployment. **Fixed** by exempting `/api/*` from the middleware login-redirect (API routes self-authenticate and return JSON 401s). Requires redeploy to take effect. This compounds B1 — even once plan-gating is built, it can't work until webhooks are reachable.

> **Note — test environment provisioned 2026-08-05:** The empty `Gut8er Pro` Supabase project was set up for testing via MCP: 25 tables created (clean schema), `photos` public bucket created, RLS enabled on all 25 tables + 25 table policies + 4 storage policies applied. This is a **scratch/test** environment — do not run `prisma migrate deploy` against it (tables were applied directly, not through Prisma's migration history). Production must be a fresh, client-owned project provisioned via `pnpm prisma migrate deploy`. The storage policies applied are the insecure bucket-wide ones (B4) — acceptable for testing, must be tightened before real clients.

---

## 2. ⚠ High severity (fix before or immediately at launch)

| ID | Finding | Location |
|----|---------|----------|
| H1 | `trialEndsAt` is guessed from the local clock at signup, not read from Stripe's `subscription.trial_end` | `src/lib/auth/actions.ts:116` |
| H2 | Invoice line-item save is **destructive + non-atomic** (delete-all-then-recreate, no transaction). Partial failure or a concurrent save wipes or duplicates the charges that go to the insurer | `src/app/api/reports/[id]/invoice/route.ts:130` |
| H3 | Deleting the **last** line item or visit silently doesn't persist (`if (items.length>0)` guard) → the removed row reappears in the sent PDF | `.../invoice/page.tsx:99`, `.../accident-info/page.tsx:185` |
| H4 | Loss-of-use total and correction result cards are **never computed** (hardcoded `"—"`); no `costPerDay × days` anywhere | `.../calculation/page.tsx:370`, `correction-section.tsx:96` |
| H5 | Invoice `totalNet/totalGross/taxRate` are **never persisted** → revenue statistics & monthly chart always read €0 | `.../invoice/page.tsx:92`, `src/app/api/stats/route.ts:16` |
| H6 | Custom-branding logo uploads/stores but is **never rendered on the PDF** (a sold Pro feature) | `generate-buffer.ts:284`, `report-template.tsx:476` |
| H7 | Email ships mis-configured: from-address defaults to a placeholder / Resend sandbox sender → can't email real clients out of the box | `src/lib/email/send-report.ts:116`, `.env.example:20` |
| H8 | DAT credentials stored plaintext despite `encryptedCredentials` column name (contradicts CLAUDE.md rule) | `settings/route.ts:116`, `auth/actions.ts:155` |
| H9 | GDPR data export omits Invoice, line items, ExportConfig (recipient PII), and photo annotations | `src/app/api/account/export/route.ts:22` |
| H10 | Stale `package-lock.json` (missing `@sentry/nextjs`, `pg`) → `npm install`/Vercel can build a different, broken dependency tree than CI (pnpm). Delete it. | root |
| H11 | No route-level error boundaries (`error.tsx`/`global-error.tsx` = 0), despite CLAUDE.md claim → Sentry won't capture React render errors | `src/app/**` |
| H12 | No boot-time env validation → a missing secret fails deep inside a checkout/AI request instead of at startup | (no `env.ts`) |

## 3. 📋 Medium severity

| ID | Finding | Location |
|----|---------|----------|
| M1 | Invoice numbers are **random** (`GH-<rand>-<year>`), not sequential/unique → GoBD / §14 UStG violation + collision risk, no DB unique constraint | `src/lib/utils/invoice-calculations.ts:43` |
| M2 | All money stored as `Float`; tax unrounded, net & gross rounded independently → cent mismatches on legally-binding invoices | `prisma/schema.prisma:446`, `invoice-calculations.ts:31` |
| M3 | Invoice tax hardcoded to 19% with no UI to change it → wrong for Kleinunternehmer / 0% VAT assessors | `invoice-banner.tsx:26` |
| M4 | Auto-save unmount flush is fire-and-forget (not awaited); Send doesn't `flushNow()` → sent PDF/toggles can be stale | `use-auto-save.ts:194`, `export/page.tsx:78` |
| M5 | Auto-save has no retry after a failed save; errors on unmount/tab-close are silently dropped (docstring overstates "no data loss") | `use-auto-save.ts:145` |
| M6 | Stripe webhook has no idempotency / event-ID dedup → out-of-order events can misorder plan writes | `stripe/webhook/route.ts` |
| M7 | `checkout.session.completed` not handled → trial/customer state relies solely on `subscription.*` firing | `stripe/webhook/route.ts` |
| M8 | AI routes accept an arbitrary client-supplied `photoUrl` (SSRF surface, not scoped to caller's report) | `api/ai/analyze-photo/route.ts` |
| M9 | CI never runs E2E or integration tests, and builds with zero env → regressions don't block merges; build-success unverified | `.github/workflows/ci.yml` |
| M10 | Orphaned root `/e2e` suite (7 specs); bare `npx playwright test` runs the wrong config | `/e2e`, root `playwright.config.ts` |
| M11 | Weak lint gate: a11y / unused-import / unused-var rules are `warn`, filtered out by `--diagnostic-level=error` → never fail CI | `biome.json` |
| M12 | Biome doesn't lint/format `testing/**`, `e2e/**`, or root `*.config.ts` | `biome.json` |
| M13 | RLS script orphaned (not in migrations, unverifiable) — if never run, the Supabase anon key can read/write every table via PostgREST | `supabase/enable-rls.sql` |
| M14 | Inconsistent email-sender env var (`EMAIL_FROM` for notifications vs `RESEND_FROM_ADDRESS` for reports); `EMAIL_FROM` undocumented | `notifications/create.ts:60` |
| M15 | AI per-photo failures are swallowed → a report can come back with little/no AI data yet still be marked "complete" | `pipeline.ts:301` |
| M16 | "DAT vehicle data" is actually NHTSA + AI VIN-decode, misattributed; weak coverage for European vehicles | `src/lib/ai/vehicle-lookup.ts` |

## 4. Low severity / housekeeping

- L1 — Client `isPro` store defaults to `true` and is read by nothing (dead code implying protection). `src/stores/pro-store.ts:9`
- L2 — Fragile `where: { userId: user?.id }` pattern; if the auth helper ever returns `user:null` without an error it becomes mass-IDOR. Use `if (error || !user)` everywhere.
- L3 — Calc completion badge counts HS fields for every report type (BE/OT under-report). `.../calculation/page.tsx:299`
- L4 — Tab-completion marks a section "filled" if ≥1 field has a value (overstates readiness; `0` counts as filled). `use-tab-completion.ts`
- L5 — `additionalCosts` API duplicates rows if ever re-sent without ids (latent; no editor wired yet). `calculation/route.ts:128`
- L6 — Notifications only fire on 3 report events; none for trial-ending or payment-failed.
- L7 — Dead `eslint-disable` comments in a Biome-only project (suppress nothing). `annotation-canvas.tsx:192`, `dat-modal.tsx:69,141`
- L8 — 3 stray `console.log` (`stripe/webhook/route.ts:108`, `pipeline.ts:267,716`).
- L9 — CI runs `next build` directly; only works because `postinstall: prisma generate` runs. `--ignore-scripts` breaks it.
- L10 — Doc drift: CLAUDE.md says "16 specs" (actually 18); integration test labels price "€49" vs actual €69.
- L11 — Standalone `api/ai/*` routes duplicate the generate-pipeline logic with a different model → drift risk.
- L12 — Two lockfiles (see H10) — the same root cause as the delivery risk.

---

## 5. ✅ What's genuinely solid (don't over-correct)

- **Source discipline:** strict TypeScript with `noUncheckedIndexedAccess`, **zero** `any` / `@ts-ignore` / `@ts-expect-error` / `biome-ignore` in `src`; no committed secrets; no server secrets in the client bundle; `.gitignore` sound. 685 real unit tests, 0 skips.
- **AI pipeline (Anthropic):** genuinely implemented — real SDK calls, valid current model IDs (`claude-haiku-4-5`, `claude-sonnet-4-5`), a real two-tier cache and per-task image routing. Missing-key path returns 503 rather than crashing the report.
- **Auth:** every API route authenticates; sessions are validated via `supabase.auth.getUser()` (not just decoded); report-level ownership checks are present; GDPR routes are strictly self-scoped; no `userId` trusted from request bodies; no plan mass-assignment.
- **Stripe plumbing:** webhook signature verified on the raw body, fails closed; status-aware downgrade on lapse/`past_due`/`payment_failed` is correct (the `460cb3a` fixes check out). It just isn't enforced anywhere (B1).
- **Report internals:** visits use a proper transactional reconcile; the PDF reads exclusively from the DB and recomputes invoice net/gross from line items as a fallback (which is the only reason printed totals are usually right despite H5); report-type conditional rendering is sound (no cross-type field contamination).
- **Email mechanism:** real `resend.emails.send` with PDF attachment; report is only marked SENT/LOCKED *after* a successful send.

---

## 6. Open decisions (to resolve in the grilling session)

1. **DAT:** wire it for real, or strip it from v1? (biggest scope fork; gates timeline + marketing)
2. **Who remediates:** fix in this session, or hand this list back to the original author?
3. **Launch model:** hard-gate on payment, or soft-launch to a few trusted clients while gating is built?
4. **Money correctness:** move to integer-cents/Decimal now, or accept float risk for v1?
5. **Production runbook:** who provisions the prod environment, and where (this Supabase project, or elsewhere)?

_This document is the durable record. As decisions are made, capture the hard, one-way ones as ADRs under `docs/adr/`._
