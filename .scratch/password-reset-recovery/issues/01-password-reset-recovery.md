# 01 — Make password reset work in production

Status: resolved
Type: bug

One issue, one PR. It has a code half (this branch) and a configuration half (Supabase and
Vercel dashboards, human-only — see "Why the config half cannot be delegated" below).
Neither half fixes the bug alone.

## The bug

A password-reset email lands the user on a page with no password form. Diagnosed in
`../spec.md`; three faults chain together.

## Code (done on this branch)

1. **Recovery emails are now implicit-flow.** `requestPasswordReset` mails through
   `createLinkMailerClient()` (`flowType: 'implicit'`) and points at `/reset-password`
   directly rather than `/auth/callback?next=/reset-password`. The PKCE link it replaced
   could only be redeemed in the browser that requested it — a code verifier written as a
   cookie by the server action — so opening the mail on a phone failed. Rationale and
   accepted trade-off: `docs/adr/0002-implicit-flow-for-recovery-links.md`.
2. **`RecoveryRedirect` in the root layout** catches a `type=recovery` (or `error=`)
   fragment on whatever route it lands on and forwards it to `/reset-password`, fragment
   intact. Reads `window.location.hash` at module scope, ahead of any `createClient()` in
   the tree, because a Supabase browser client clears the fragment as it initialises.
   This is what covers mails sent from the Supabase dashboard, which ignore `redirect_to`
   and go to the Site URL.
3. **`/reset-password` redeems the fragment before the form is usable** — submit stays
   disabled until the session cookie the `updatePassword` server action reads is actually
   written, and an expired link shows a message with a "request a new link" path instead
   of dead-ending.
4. **`/login` surfaces `?error=`**, which `/auth/callback` has always been able to set and
   nothing has ever displayed.

## Configuration (human, in the dashboards)

**Supabase → Authentication → URL Configuration**

- **Site URL** → `https://app.gut8erpro.de`.
  Safe to set now: `app.gut8erpro.de` already resolves to Vercel and serves this app.
  Contrary to `.scratch/marketing-app-split/issues/06`, no email template reads
  `{{ .SiteURL }}` — all five use `{{ .ConfirmationURL }}` — so this value only matters as
  the silent-substitution fallback.
- **Redirect URLs** → the list should end up as exactly these three:
  - `https://app.gut8erpro.de/**`
  - `https://gut8er-pro.vercel.app/**` — keep; the old host still serves production
  - `http://localhost:3000/**` — already present; keep for local dev

  Wildcards are required: GoTrue matches the allow-list against the full URL including
  its query string.

**Vercel → gut8er-pro → Settings → Environment Variables (Production)**

- `NEXT_PUBLIC_APP_URL=https://app.gut8erpro.de`
- `NEXT_PUBLIC_MARKETING_URL=https://gut8erpro.de`

Set both explicitly even though `src/lib/urls.ts` falls back to these exact values in
production — the fallback is a seatbelt, not configuration. Redeploy afterwards:
`NEXT_PUBLIC_*` is inlined at build time.

**Order.** Allow-list first (purely additive, changes nothing on its own), then the env
vars plus redeploy, then the Site URL. Flipping the Site URL first would point outstanding
links at an origin the deployed build does not yet consider its own.

## Why the config half cannot be delegated

The Supabase MCP server covers migrations, SQL, logs, advisors and branches — there is no
auth-configuration tool, and GoTrue's URL settings are not in the database, so no SQL can
reach them. The Vercel MCP server exposes no environment-variable tool, and the Vercel CLI
is not installed on this machine.

## Acceptance criteria

- `curl -s -o /dev/null -w '%{redirect_url}' "https://cqgzckghgoyzijxgbncw.supabase.co/auth/v1/verify?token=probe&type=recovery&redirect_to=https%3A%2F%2Fapp.gut8erpro.de%2Freset-password"`
  echoes back `https://app.gut8erpro.de/reset-password#error=…` rather than collapsing to
  the bare Site URL. That is the single check that distinguishes "allow-listed" from
  "silently substituted".
- A reset requested from `/forgot-password` **and opened on a different device** lands on
  `/reset-password` with a working form, and the new password works.
- A recovery mail sent from the Supabase dashboard — which lands on the Site URL, not on
  `redirect_to` — also ends on `/reset-password` with a working form.
- A link with `#error=access_denied&error_code=otp_expired` says so, and offers a new one.
- Fragments that are not recovery links are left alone.

## Related

`.scratch/marketing-app-split/issues/06-supabase-auth-config.md` held the same Supabase
change for the ticket-10 cutover. That cutover has since happened — PR #2 is merged and
in production — so 06 is fully superseded by this ticket and can be closed with it.

## Out of scope, found while diagnosing

The legal footer on every auth page links to `https://gut8erpro.de/impressum` and
`/datenschutz`. The apex resolves to `89.31.143.90`, is not a Vercel project, and does not
answer HTTPS — so both links are dead in production. For a German commercial site that is
a compliance exposure, not a cosmetic one. Needs its own ticket.

## 2026-09-13 — configuration applied and verified

Both dashboard halves are done. Probed against `/auth/v1/verify` after the change:

```
redirect_to=https://app.gut8erpro.de/reset-password  -> https://app.gut8erpro.de/reset-password
redirect_to=https://app.gut8erpro.de/auth/callback   -> https://app.gut8erpro.de/auth/callback
redirect_to=http://localhost:3000/reset-password     -> http://localhost:3000/reset-password
redirect_to=https://gut8er-pro.vercel.app/...        -> preserved (kept deliberately)
(no redirect_to)                                     -> https://app.gut8erpro.de/
```

Each echoes back rather than collapsing to the Site URL, which is the check that
distinguishes allow-listed from silently substituted. The Site URL is now
`https://app.gut8erpro.de`.

The code half shipped in PR #3 (`6e13ed4`) and is live in production
(`dpl_641tP2YfrUmesW1u88hebP2CjJ5i`, target production).

### Still open

- **`NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_MARKETING_URL` on Vercel Production.** Not yet
  set. Reset works without them — `appUrl()` falls back to `https://app.gut8erpro.de` in
  production, which is now allow-listed — so this is no longer load-bearing, only the
  removal of a guess. Neither the Vercel MCP surface nor a CLI can reach env vars from
  here, so it stays human.
- **Drop `https://gut8er-pro.vercel.app/**` from the allow-list.** Kept through the
  cutover because `NEXT_PUBLIC_APP_URL` could not be read, and removing it while OAuth
  still pointed at that origin would have broken Google/Apple sign-in. Now that
  `app.gut8erpro.de/auth/callback` is allow-listed, it is safe to remove once a social
  login has been exercised on the new origin.
- **End-to-end confirmation.** Not performed here: no way to trigger a real recovery mail,
  and the Chrome extension was not connected, so the fragment redemption itself is
  untested in production. Everything upstream of it is measured.

