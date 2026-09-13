# 03 — Core: rename dashboard to root, remove landing + legal, update middleware

Status: resolved
Type: task

## Goal
Make `app.gut8erpro.de/` the dashboard, and drop the marketing surfaces (now owned by the Astro site) from the app.

## Changes (core repo)
- **Remove landing** — delete `src/app/page.tsx`.
- **Rename dashboard to root** — move `src/app/(app)/dashboard/page.tsx` → `src/app/(app)/page.tsx` (route group adds no URL segment, so it resolves to `/`). Verify its imports still resolve and the `(app)/layout.tsx` shell still wraps it.
- **Remove legal** — delete `src/app/legal/*` (moved to Astro).
- **Fix hardcoded `/dashboard` redirects → `/`:** `src/lib/auth/actions.ts:32`, `src/app/auth/callback/route.ts:8` (default `next`), `src/lib/supabase/middleware.ts:38` (PKCE `next`) and `:65` (authed-away-from-auth target), `src/components/auth/complete-step.tsx:109,116`.
- **Middleware public routes** — in `src/lib/supabase/middleware.ts:46`, remove `/` and any `/legal` handling from `publicRoutes` (so the new root `/` is auth-gated). Review the PKCE `?code=` branch (`:36-43`) that referenced `/` and `/login`.

## Acceptance criteria
- `app.gut8erpro.de/` renders the dashboard for authed users; unauthenticated users are redirected to `/login`.
- No route resolves to a deleted landing/legal page.
- All post-auth redirects land on `/`.

## Notes
`(app)/help/page.tsx` stays public and is special-cased by pathname in `(app)/layout.tsx` — unaffected by the rename.

## Comments

**2026-09-01 — implemented.** Deleted `src/app/page.tsx` and `src/app/legal/`; moved `(app)/dashboard/page.tsx` (and its test) to `(app)/page.tsx`. Removed `/` from the middleware `publicRoutes`, so the root is now auth-gated. Updated every `/dashboard` redirect.

The ticket listed 6 call sites; there were **10**. Beyond the listed ones: `(app)/layout.tsx` (the `activePath` derivation — `startsWith('/dashboard')` had to become `pathname === '/'`, since a prefix match on `/` matches everything), `(app)/reports/[id]/layout.tsx` (back-to-dashboard button), `components/layout/top-nav-bar.tsx` (the centre nav item and the logo button), and `api/stripe/checkout/route.ts` (the Checkout `successUrl`). The Stripe one would have silently sent every post-payment user to a 404.

Verified with `pnpm build`: the route table now lists `/` and no `/legal/*` or `/dashboard`.

**⛔ Deploy gate.** This ticket deletes the landing page and the four `/legal/*` routes, but the
Astro site that replaces them (ticket 02) does not exist yet, and `gut8erpro.de` currently *is*
this app. Deploying this to the apex before tickets 02/06/07 land takes the live Impressum and
Datenschutz offline. Keep it on a branch until the cutover (ticket 10). Recorded as blocker #0 in
`RELEASE_CHECKLIST.md`.
