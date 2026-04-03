# Supabase Email Templates

Branded email templates for Gut8erPRO. Copy-paste these into the Supabase Dashboard.

## How to apply

1. Go to **Supabase Dashboard → Authentication → Email Templates**
2. For each template below, click the corresponding tab, paste the HTML, update the subject, and save.

## Templates

| File | Dashboard Tab | Subject Line |
|------|--------------|-------------|
| `confirm-signup.html` | Confirm signup | `Welcome to Gut8erPRO — Confirm your email` |
| `reset-password.html` | Reset Password | `Reset your Gut8erPRO password` |
| `magic-link.html` | Magic Link | `Your Gut8erPRO login link` |
| `invite-user.html` | Invite user | `You've been invited to Gut8erPRO` |
| `change-email.html` | Change Email Address | `Confirm your new email — Gut8erPRO` |

## Template variables

Supabase uses Go template syntax:
- `{{ .ConfirmationURL }}` — The action link (confirm, reset, login, etc.)
- `{{ .Token }}` — The OTP token (if using token-based flow)
- `{{ .SiteURL }}` — Your app URL
