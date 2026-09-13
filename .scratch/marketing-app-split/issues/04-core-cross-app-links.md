# 04 — Core: env-driven cross-app links

Status: resolved
Type: task
Blocked by: 03

## Goal
Every app link that used to point at the old same-origin landing/legal now points at the marketing domain via env var (never hardcoded). After ticket 03, `/` is the dashboard, so these must become absolute marketing URLs.

## Changes (core repo)
- Introduce `NEXT_PUBLIC_MARKETING_URL` (value set in ticket 07). Use it for:
  - Account-delete redirect: `src/app/(app)/settings/[[...tab]]/page.tsx:287` (`window.location.href = '/'` → marketing home).
  - `src/app/not-found.tsx` "back home" link → marketing home (and its dashboard link stays `/`).
  - Any in-app links to `/legal/*` → `${NEXT_PUBLIC_MARKETING_URL}/legal/...` (e.g. signup consent, footers).
  - Notification email link `src/lib/notifications/create.ts:63` → prefer `NEXT_PUBLIC_APP_URL` (login/app) over the hardcoded `https://gut8erpro.de` fallback; keep sender branding.
- Logout → `/login` stays in-app (no change).

## Acceptance criteria
- No hardcoded `gut8erpro.de` / `localhost` app-origin literals remain for cross-app links.
- Deleted-account users land on the marketing home; not-found "home" resolves correctly.
- In-app legal links open the marketing domain's legal pages.

## Comments

**2026-09-01 — implemented.** Added `src/lib/urls.ts` with `marketingUrl(path)` / `appUrl(path)` (env-driven, slash-normalising, unit-tested in `src/lib/urls.test.ts` — 8 tests) and introduced `NEXT_PUBLIC_MARKETING_URL` in `.env` and `.env.example`.

Wired into the three real call sites: the account-delete redirect in settings, the `not-found` "home" link (its dashboard link became `/`), and the notification email in `lib/notifications/create.ts` (which had a hardcoded `https://gut8erpro.de` fallback).

**The in-app `/legal/*` links in this ticket do not exist.** The only `/legal` references in the repo were inside the landing and legal pages themselves, both deleted in ticket 03. Nothing else in the app links to legal, so no rewrite was needed. `marketingUrl('/legal/impressum')` is available when the signup consent copy eventually needs it.
