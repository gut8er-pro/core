# Password reset is broken in production

Reported 2026-09-13 by the owner. A password-reset email link drops the user on the
landing page, silently signed in, with the old password unchanged.

## Reported symptom

Clicking the link in the reset email lands on:

```
https://gut8er-pro.vercel.app/#access_token=…&refresh_token=…&type=recovery
```

…and renders the home page. No password form, no error.

## Verified root cause

Three independent faults chain together. All three were confirmed against the live
Supabase project (`cqgzckghgoyzijxgbncw`) and the deployed app on 2026-09-13.

### 1. Supabase discards the app's `redirect_to` and falls back to the Site URL

Probing `/auth/v1/verify` with a deliberately invalid token, varying only `redirect_to`:

| `redirect_to` sent | Redirect actually issued |
|---|---|
| `https://app.gut8erpro.de/auth/callback?next=/reset-password` | `https://gut8er-pro.vercel.app/#…` — **path stripped** |
| `https://gut8er-pro.vercel.app/auth/callback` | preserved |
| `http://localhost:3000/auth/callback` | preserved |
| *(omitted)* | `https://gut8er-pro.vercel.app/` |

So the allow-list holds the `.vercel.app` origin and localhost but **not**
`app.gut8erpro.de`, and Site URL is `https://gut8er-pro.vercel.app`. GoTrue logs the
*validated* referrer, and the real `/recover` at 18:07:23Z logged
`referer: "https://gut8er-pro.vercel.app"` — i.e. the requested redirect was rejected.

At the time of the report `requestPasswordReset` interpolated the env var without a
fallback, so an unset `NEXT_PUBLIC_APP_URL` sent the literal string
`undefined/auth/callback?next=/reset-password`. Since PR #2 merged, `appUrl()` falls back
to `https://app.gut8erpro.de` in production instead. That is a better value but not a
fixed bug: `app.gut8erpro.de` is still not allow-listed, so it is silently substituted
just the same.

### 1b. The link only redeems in the browser that requested it

Independent of the allow-list, and not in the original report. `requestPasswordReset` is a
server action using the cookie-backed SSR client, so `resetPasswordForEmail` mints a PKCE
challenge whose code verifier is a cookie on the submitting browser. Open the mail on a
phone and `/auth/callback` has no verifier to exchange against — the reset fails with
`?error=auth_callback_error`, which no page displayed. Fixing faults 1–3 without this
would leave reset working only for people who read email on the machine they asked from.

### 2. The link is implicit flow; `/auth/callback` only speaks PKCE

The reported URL carries the session in the fragment (`#access_token=…&type=recovery`),
the auth log records `login_method: "implicit"`, and `auth.flow_state` is empty — no PKCE
challenge was ever created for it. `src/app/auth/callback/route.ts` reads only `?code=`.
A fragment never reaches the server, so that route cannot process this link **even once
the domain is allow-listed**. Every dashboard-initiated recovery email is implicit.

### 3. Nothing that can act on the fragment ever sees it

As reported, `/` was the landing page — `'use client'`, calling `useAuth()` → a Supabase
browser client with `detectSessionInUrl: true`. It parsed the fragment, established a
session, cleared the URL, and emitted `PASSWORD_RECOVERY` (auth-js `GoTrueClient.js:953`),
which `src/hooks/use-auth.ts:24` discards (`(_event, session) =>`). Hence: home page,
signed in, old password.

**Re-verified 2026-09-13, after PR #2 merged.** The landing page is gone: `/` is now
auth-gated and 307s to `/login`, and the browser re-attaches the fragment across that
redirect. `/login` constructs no Supabase browser client at all (`Providers` is React
Query only), so the token is no longer silently consumed — it simply dies unread on the
login screen. Less dangerous, equally broken, and the fix is the same: something has to
route a recovery fragment to `/reset-password` regardless of where it lands.

## Scope

One ticket, one PR: `01-password-reset-recovery.md`. The code half is this branch; the
Supabase and Vercel settings are human-only, for the reasons that ticket records.

## Security note

The reported link contained a live access token and refresh token, and fault 3 as it stood
at the time means the session was actually established. Revoking sessions for
`quadrition@gmail.com` was raised and **declined by the owner on 2026-09-13** — the tokens
never left his own hands. Recorded so the omission reads as a decision rather than an
oversight.
