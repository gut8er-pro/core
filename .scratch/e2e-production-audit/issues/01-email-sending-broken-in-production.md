# 01 — Report email sending is non-functional in production

Status: ready-for-human
Type: bug
Severity: blocker

Sending the Gutachten is the product's core deliverable. It cannot currently reach any client.

## What happens

On a fully completed HS report (`1a65cb53-b5a2-44c4-9133-17278bf8936f`), Export & Versand →
recipient `quadrition@gmail.com` → **Gutachten senden** returns:

> Failed to send email: You can only send testing emails to your own email address
> (ivanvukasino@gmail.com). To send emails to other recipients, please verify a domain at
> resend.com/domains, and change the `from` address to an email using this domain.

That is Resend's unverified-account error. The production deployment is using a Resend account
with **no verified sending domain**, so it will only deliver to the account owner's own address
(`ivanvukasino@gmail.com`). Every other recipient — i.e. every real client — is rejected.

This is not reproducible from code alone: the report completed, the PDF generated fine (6.86 MB,
200), and the failure is entirely at the mail provider.

## Two separate defects here

**1. Configuration (human, in the Resend dashboard).** Verify a sending domain for
`gut8erpro.de` at resend.com/domains (DNS: SPF + DKIM records), then set the `from` address to
something on that domain. Until this is done no send can succeed.

**2. Code — the raw provider error is shown verbatim to the user.** The Resend error string is
rendered straight into a banner on the export page. That means:

- it is in English, in a German UI;
- it **leaks an internal email address** (`ivanvukasino@gmail.com`) to whoever is using the app;
- it exposes the provider and the account's configuration state.

Catch the provider error and render a generic, translated failure message. Log the detail
server-side.

## Also verify

After the failed send, `GET /api/reports/<id>` reported `status: "COMPLETED"` and the error
banner stayed on screen. I have no pre-send baseline for `status`, so I can't say whether the
failed send set it — but a send that failed must not leave the report looking sent. Worth
confirming the send handler only advances status on a successful provider response.

## Related

Issue 02 — Stripe is in test mode in the same deployment. Both are "production is wired to a
sandbox"; they are likely the same missed go-live checklist step and should be fixed together.
