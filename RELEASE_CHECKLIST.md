# Release Checklist — Gut8erPRO

> **Status:** pre-launch. The app is feature-complete and the codebase is type-clean (`pnpm type-check`) with 675/685 unit tests passing. Items below are the gaps a fresh clone needs to know about before going to production.
>
> **Update rule:** when you finish one of these or discover a new gap, edit this file in the same commit. The whole point is that whoever clones this repo can read this once instead of digging through Slack or git log.
>
> **Last reviewed:** 2026-05-21 — exhaustive E2E re-run confirms 62/62 fields verified; 91/91 fields verified across the actual email-delivered PDFs. HS calc race is closed.

---

## 🚨 Hard blockers — fix before any paid customer touches the app

### 1. Fill in the legal-page placeholders
The four pages at `src/app/legal/*` are wired and linked from the landing footer, but the content still contains placeholders like `[Firmenname]`, `[datenschutz@beispiel.de]`, `[HRB …]`. Search for `[` in those files to see them all.

- [`src/app/legal/impressum/page.tsx`](src/app/legal/impressum/page.tsx) — must satisfy § 5 TMG (company name, address, registry, USt-IdNr, responsible person)
- [`src/app/legal/datenschutz/page.tsx`](src/app/legal/datenschutz/page.tsx) — DSGVO Art. 13 (data controller, processors, retention, rights)
- [`src/app/legal/agb/page.tsx`](src/app/legal/agb/page.tsx) — terms of service
- [`src/app/legal/widerruf/page.tsx`](src/app/legal/widerruf/page.tsx) — assumes B2B; adjust if you sell to consumers

**After filling in the placeholders, have a German lawyer skim.** The template is reasonable but not a substitute for legal review.

### 2. Baseline the existing production database against the new Prisma migrations
The `prisma/migrations/` directory was generated from the live schema *after* the DB had already been created via `prisma db push`. On any pre-existing database, run **once** before the next deploy:

```bash
pnpm prisma migrate resolve --applied 20260514160136_init
```

Then deploys use `pnpm db:migrate` (which is `prisma migrate deploy`). Fresh DBs pick this up automatically — no extra step.

Details in [`prisma/migrations/README.md`](prisma/migrations/README.md).

---

## ⚠ Strongly recommended before client handoff

### 4. Create the Sentry project and add the DSN to env
SDK is wired ([`sentry.client.config.ts`](sentry.client.config.ts), etc.) but it's a no-op until you set:

```env
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=     # only if you want source map upload during build
```

Without these, errors hit the console and disappear. First paying customer is the worst time to discover you have no monitoring.

### 5. Decide what to do about DAT integration
[`src/components/report/calculation/dat-modal.tsx`](src/components/report/calculation/dat-modal.tsx) has zero `fetch` calls — it's a UI shell. The signup wizard collects DAT credentials and the landing page advertises DAT integration, but the calculation tab can't actually call SilverDAT3.

Options:
- **Wire DAT for real** — requires SilverDAT3 API credentials and integration work
- **Remove DAT branding from landing + onboarding for v1** and ship calc as fully-manual. Cheapest path to launch.

Don't ship with DAT advertised but non-functional — that's a refund magnet.

### 6. Test the trial → expired → access-revoked path in staging
Commit `460cb3a` fixed two real bugs in [`src/app/api/stripe/webhook/route.ts`](src/app/api/stripe/webhook/route.ts):
- `subscription.created/updated` used to always set `plan='PRO'` — now respects status
- `invoice.payment_failed` used to only log — now downgrades after 2nd failed attempt

Code is right but **no E2E covers the actual flow.** Before launch, in a Stripe test environment:
1. Create a customer, start trial, confirm `plan='PRO'`.
2. Use a card that fails on charge (e.g. `4000 0000 0000 0341`).
3. Let trial expire, confirm `plan` downgrades to `FREE`.
4. Confirm the user can't access `/reports/*` write endpoints (every route already checks `report.isLocked` — but plan-based gating is somewhere else; verify).

### 7. Mobile responsiveness audit on the report editor
Never visually verified end-to-end on a real device. The CLAUDE.md design tokens include responsive breakpoints, but the report editor's multi-tab + sidebar layout is the most likely place to be broken on mobile.

### 8. Supabase email templates
Templates live in [`supabase/email-templates/`](supabase/email-templates/). Verify each one renders correctly:
- Signup confirmation
- Magic link
- Password reset
- Email-change confirmation

Pay attention to the `{{ .SiteURL }}` substitutions — these need to point at the production domain, not localhost.

---

## 📋 Operational gaps (won't block launch but you'll feel them)

### 9. No backups documented
Supabase has automatic backups but the retention policy and restore process aren't written down anywhere. Worth a 1-page runbook.

### 10. No staging environment described
README has the "Getting Started" path for local dev. There's no documented staging URL, no description of how to promote from staging → prod, no Vercel project naming convention captured.

### 11. Rate limiting
No `next/middleware` rate limiting in front of the AI Generate route or the email send route. A bored user (or a leaked API key) could rack up Anthropic / Resend bills fast.

### 12. Photo size limit on upload
[`src/lib/storage/photos.ts`](src/lib/storage/photos.ts) compresses to 1920px on the client, but if a user uploads a 50MB raw file the upload itself completes before compression. Server-side max-body-size on the photo POST route would be cheap insurance.

---

## ✅ What's already in good shape

To save your time when auditing — these have been verified recently:

- **Server-side lock enforcement** on every write route (`accident-info`, `calculation`, `condition`, `invoice`, `vehicle`, `generate`, `send`, photos, signatures).
- **Photo limit** (max 20 per report) enforced in [`src/app/api/reports/[id]/photos/route.ts`](src/app/api/reports/[id]/photos/route.ts).
- **GDPR self-service**: data export + account deletion endpoints, wired into Settings → Profile (`src/app/api/account/{export,delete}/route.ts`).
- **Signature lifecycle**: create / update / delete all work.
- **4 report types** (HS / BE / KG / OT) render PDFs correctly in EN + DE — last exhaustive run (2026-05-21) verified **62/62** fields end-to-end, and a separate audit of the 4 actual email-delivered PDFs verified **91/91** fields including the previously-broken HS calc tab.
- **API routes** all authenticated (every route under `src/app/api/` calls `getAuthenticatedUser` except the Stripe webhook which is signature-verified).
- **IDOR**: every report-scoped route under `src/app/api/reports/[id]/` verifies `userId === user.id` before reading or writing.
- **Production build** succeeds (`pnpm build`).
- **Type-check** is clean (`pnpm type-check`).
- **Unit tests** 675/685 pass (10 integration tests are env-skipped).
- **E2E** has 18 specs including an exhaustive full-fill suite (`pnpm test:e2e:exhaustive`).
- **No PII in production logs** — `console.log` was removed from auth actions and the generate route.

---

## How to use this file

When you finish one of the items above:

1. Remove it from this file (or move it under "What's already in good shape" if it deserves a permanent note).
2. Commit the deletion in the same commit as the fix, with a one-line note in the commit body referencing the section number.
3. Update `Last reviewed:` at the top.

When you discover a new gap during code review, ops work, or customer testing:

1. Add it under the appropriate severity bucket.
2. Link to the file/line where the work needs to happen.
3. State what "done" looks like — future-you will not remember.

Keep this file under ~200 lines. If it grows past that, the items aren't being addressed fast enough.
