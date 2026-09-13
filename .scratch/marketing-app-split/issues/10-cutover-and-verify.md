# 10 — Big-bang cutover & verification

Status: ready-for-agent
Type: task
Blocked by: 02, 03, 04, 05, 06, 07, 08, 09

## Goal
Flip everything in one coordinated pass and verify the split end-to-end.

## Steps
1. Deploy the Astro site (website project) and the migrated Next app (core project).
2. Owner sets the DNS records from ticket 07; wait for propagation.
3. Owner completes the wizard from ticket 08 (Google, Apple, Stripe).
4. Verify:
   - Marketing: apex serves German at `/`, English at `/en`; sitemap/robots/`hreflang` present; strong Lighthouse.
   - App root: `app.gut8erpro.de/` is the dashboard for authed users; unauth → `/login`.
   - Auth: email/password login, Google + Apple OAuth (callback resolves), password reset email links to `app.`.
   - Signup: full wizard → Stripe Checkout → return to app; billing portal returns to settings.
   - Cross-app links: marketing CTAs → app; account-delete → marketing home; in-app legal → marketing legal.
   - Emails: notification + Supabase transactional links resolve to `app.`.
5. e2e (ticket 09) green.

## Rollback
No live users → reassign the domain to the previous target + `git revert`. Trivial.

## Acceptance criteria
- Every item in step 4 verified; e2e green; owner signs off.

## Comments

**2026-09-01 — status.** **Blocked.** Waits on 02, 06 and 07. The core-repo half of the migration (03, 04, 05, 09) is merged and verified locally: `pnpm build` clean, `tsc --noEmit` clean, 683 unit tests green.
