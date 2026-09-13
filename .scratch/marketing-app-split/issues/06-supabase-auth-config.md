# 06 — Supabase auth config (via MCP)

Status: ready-for-agent
Type: task

## Goal
Point Supabase auth at the app subdomain so OAuth, magic links, confirmation, and password-reset emails resolve correctly after the split.

## Changes (Supabase dashboard — agent does via MCP)
- **Site URL** → `https://app.gut8erpro.de` (drives `{{ .SiteURL }}` in the email templates under `supabase/email-templates/`).
- **Redirect URLs allow-list** → add `https://app.gut8erpro.de/auth/callback` and `https://app.gut8erpro.de/auth/callback?next=/reset-password`.
- Keep local dev URLs (`http://localhost:3000/...`) in the allow-list for development.

## Acceptance criteria
- Password-reset and confirmation emails link to `app.gut8erpro.de`.
- OAuth/email redirects are accepted by Supabase (not rejected as un-allow-listed).

## Notes
Google/Apple OAuth console callback URLs are handled by the wizard (ticket 08), not here.

## Comments

**2026-09-01 — status.** **Held deliberately, not blocked.** These are live-service changes to production auth. Setting the Supabase Site URL to `https://app.gut8erpro.de` before DNS resolves there would break password-reset and confirmation links on the currently-deployed app — the change is only safe as part of the ticket-10 cutover, alongside the DNS flip.

Note for whoever runs it: this ticket, not ticket 08, is where the app-side OAuth callback URL actually matters. `https://app.gut8erpro.de/auth/callback` and `...?next=/reset-password` must be in Supabase's redirect allow-list, or Supabase rejects the post-OAuth redirect.

**2026-09-13 — this hold is now breaking production. Reprioritised.**

Password reset is broken on the live app, and the deferral described above is one of the
two reasons. Verified against the live project today — full diagnosis in
`.scratch/password-reset-recovery/spec.md`.

The current state of the allow-list, probed directly against `/auth/v1/verify`:

- `https://gut8er-pro.vercel.app/**` — allow-listed
- `http://localhost:3000/**` — allow-listed
- `https://app.gut8erpro.de/**` — **not** allow-listed

A rejected `redirect_to` is not an error the caller sees: GoTrue silently substitutes the
Site URL, so the reset link lands on `https://gut8er-pro.vercel.app/` with the session in
a URL fragment and no way to reach the password form.

Two corrections to this ticket as written:

1. **The allow-list entries were too narrow.** `https://app.gut8erpro.de/auth/callback`
   alone does not match what the app actually sends — `…/auth/callback?next=/reset-password`
   — because GoTrue matches the full URL including the query string. Use `/**` wildcards.
2. **Adding `app.gut8erpro.de` to the allow-list is safe to do now, ahead of the cutover,
   and should be.** The original hold conflated two settings. Only the **Site URL** is
   destructive to flip early — it is the fallback target, so pointing it at a host that
   does not yet serve the app would break every link. The allow-list is purely additive:
   entries for hosts nobody is using yet change nothing. Splitting the ticket this way
   removes the reason to wait.

Also worth recording: `app.gut8erpro.de` already resolves and serves this same Vercel
deployment today (both hosts return an identical `x-matched-path` and page for `/`), so
even the Site URL flip is less dangerous than this ticket assumed when it was written.

**2026-09-13 (later) — fully superseded. Close with the password-reset PR.**

The cutover this ticket was holding for has happened: PR #2 is merged and serving
production on both `app.gut8erpro.de` and `gut8er-pro.vercel.app`, so there is no longer a
"before DNS / after DNS" distinction to sequence around. The Site URL flip it was reserved
for now lives, alongside the allow-list change, in
`.scratch/password-reset-recovery/issues/01-password-reset-recovery.md`.

One claim in this ticket is simply wrong and should not be carried forward: the Site URL
does **not** drive the email templates. All five under `supabase/email-templates/` use
`{{ .ConfirmationURL }}`; none references `{{ .SiteURL }}`. The Site URL matters only as
the fallback GoTrue substitutes when a `redirect_to` is absent or rejected.
