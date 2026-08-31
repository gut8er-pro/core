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
