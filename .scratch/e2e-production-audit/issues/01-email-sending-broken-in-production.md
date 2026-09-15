# 01 — Report email: sender identity is unconfigured and provider errors leak to the user

Status: resolved
Type: bug
Severity: blocker

Sending the Gutachten is the product's core deliverable. As found in the audit it could not reach
any client, and the failure was shown to the user in the provider's own words.

The configuration half is **now fixed** — see *Resolved since filing*. What remains is code, and it
is fully specified below.

## What happened

On a fully completed HS report (`1a65cb53-b5a2-44c4-9133-17278bf8936f`), Export & Versand →
recipient `quadrition@gmail.com` → **Gutachten senden** returned:

> Failed to send email: You can only send testing emails to your own email address
> (ivanvukasino@gmail.com). To send emails to other recipients, please verify a domain at
> resend.com/domains, and change the `from` address to an email using this domain.

Two independent defects, one visible failure.

## Resolved since filing

`gut8erpro.de` is now verified in Resend (2026-09-15). A verified apex covers every local part on
it, so no further DNS or Resend work is needed for any address below.

The API key was also rotated. Note for the record that the rotation was **not** what fixed this:
Resend's testing restriction is a property of the account's verified domains, not of the key.

## Root cause

Not the Resend account alone. `src/lib/email/send-report.ts:116` falls back to
`onboarding@resend.dev` when `RESEND_FROM_ADDRESS` is unset — and that sandbox address is exactly
what produces the error above. Production was running the fallback.

`RESEND_FROM_ADDRESS` is in `.env.example` but **missing from the README's required-variables
table**, which is the most likely reason it was never set in Vercel.

Separately, `src/lib/notifications/create.ts:61` uses a *different* variable, `EMAIL_FROM`
(defaulting to `Gut8erPRO <noreply@gut8erpro.de>`), documented nowhere at all — not in
`.env.example`, not in the README. Two sender settings defaulting independently, one to a sandbox
address, is the shape of this bug and the reason it survived to production.

## Not a defect — checked

The audit flagged that `GET /api/reports/<id>` reported `status: "COMPLETED"` after the failed
send. That is correct behaviour. `route.ts:135` returns 500 *before* any `report.update`, so status
only advances to `SENT`/`LOCKED` after a successful provider response. `COMPLETED` is written by
`src/lib/reports/completion.ts:29`, which promotes a draft-like report when it reaches 100%
completeness. It has nothing to do with sending.

---

# The work

## 1. One sending domain, two streams

Replace both `RESEND_FROM_ADDRESS` and `EMAIL_FROM` with a single `RESEND_SENDING_DOMAIN`, holding
a bare domain. The part before the `@` belongs to the stream and is never a setting.

| Stream | Envelope | Display name | `reply_to` |
|---|---|---|---|
| Gutachten (client-facing) | `gutachten@<domain>` | `<firm or assessor> via Gut8erPRO` | assessor's account email |
| Notification (platform-to-user) | `noreply@<domain>` | `Gut8erPRO` | — |

One helper owns both. No `from` string is constructed anywhere else in the codebase.

Splitting the local parts means a bounce storm on notification mail cannot cost the Gutachten
stream its delivery — the two have very different recipient hygiene.

**Display name** falls back to the assessor's name when there is no business name, and to
`Gut8erPRO` when there is neither. Sender details are already fetched at `route.ts:110-118`.

**`reply_to`** is `dbUser.email`, the Supabase account email. This is load-bearing, not a nicety: a
Gutachten leaves from an address nobody reads, so without it the document is one-way and a client
pressing Reply is silently lost. No new field, no new setting.

**Rejected:** per-assessor sending domains, where each firm verifies its own domain and mail truly
originates from them. It is what a Sachverständiger ultimately wants, and it is a multi-month
feature — per-tenant domain verification, DNS onboarding, deliverability support. Recorded here so
it is not re-litigated. The display name and reply path carry the assessor's identity to the place
recipients actually look.

**Docs:** add `RESEND_SENDING_DOMAIN` to `.env.example` **and** the README's required-variables
table. The README omission is how this shipped.

## 2. Provider errors never reach the screen

Today `send-report.ts:145` returns `error.message` verbatim; `route.ts:137` wraps it in
`Failed to send email: …`; `use-export.ts:82` rethrows it; and
`src/app/(app)/reports/[id]/export/page.tsx:116` and `:184` render it into a toast and a banner. The
assessor sees Resend's English prose, our provider, our account state, and an internal email
address.

Replace with a discriminated result from `sendReportEmail`, mapped by the route to a stable code
the client translates. Two classes:

- **Assessor-correctable** — the person who clicked can fix it. Recipient rejected, attachment over
  the provider's size cap. Gets a German message naming the cause. (The audit's HS PDF was 6.86 MB
  and a two-language send doubles that, so the size cap is a live concern, not theoretical.)
- **Service failure** — only an operator can fix it. Unverified domain, rejected key, rate limit.
  Gets one generic German message.

A single generic message for everything was considered and rejected: it tells an assessor with a
typo'd recipient address to "try again", forever. Full per-code mapping was also rejected — it
means owning Resend's error taxonomy.

Detail goes server-side only: `console.error('[send] …')` with report id and classified kind, plus
`Sentry.captureException`. **Sentry currently captures nothing — see issue 12, which must land
first or this call is decorative.**

## 3. Escape the interpolated fields

`send-report.ts` interpolates four values raw into the email HTML: `${reportTitle}` (:42, :62),
`${recipientName}` (:59), `${body}` (:66) and `${footerLine}` (:83, carrying `senderName` and
`senderCompany`).

Escape all of them **except** `${body}`, which is the assessor's rich-text composition and is
intentionally HTML.

## 4. Tests

- Unit-test the classifier against mocked Resend error payloads, one case per class. E2E recipients
  stay as they are (real sends to the account owner) by decision, so mocked payloads are the only
  coverage the failure branches get.
- `src/test/integration/services.integration.test.ts:134` hardcodes
  `from: 'Gut8erPRO <onboarding@resend.dev>'`. Repoint it at the helper so no sandbox sender
  survives anywhere. Its recipient (`delivered@resend.dev`, Resend's sink) is correct — leave it.

## Deliberately out of scope

- **The email chrome is hardcoded English** — "Dear …" (:59), "Please find attached the report"
  (:62), "Sent via Gut8erPRO" (:80) — in a German product. That is **issue 08**. Flagged there that
  it lands in this same file and will collide.
- **A sandbox-sender guard** (refusing to send from `*.resend.dev`) was specified and then deferred:
  a domain switch is going in before go-live regardless, and with the domain verified the condition
  no longer exists.
- **Stripe live mode** — issue 02, blocked on the client's paperwork.

## Configuration still owed (human)

In Vercel → Settings → Environment Variables, across Production, Preview and Development:

1. Add `RESEND_SENDING_DOMAIN` = `gut8erpro.de`
2. Delete `RESEND_FROM_ADDRESS`
3. Delete `EMAIL_FROM` if present
4. Redeploy — env changes do not apply to a running deployment

Same two lines in the local `.env`. Nothing further in Resend.

## Related

- **Issue 11** — empty and partial sends. Found while tracing this path; the send route will mark a
  report sent and lock it while carrying no PDF at all.
- **Issue 12** — Sentry captures nothing. Blocks part 2's `captureException`.
- **Issue 02** — Stripe test mode. Was filed as the same "production wired to a sandbox" story; the
  Resend half is now closed and the Stripe half is waiting on paperwork, so they no longer move
  together.

Domain vocabulary for all of this is in [`CONTEXT.md`](../../../CONTEXT.md#mail-senders).

---

## Answer

Fixed in code. Parts 1–4 all landed; the human configuration below is the only thing still
outstanding, and it is unchanged.

- **One sending domain, two streams.** `src/lib/email/sender.ts` is now the only place a `from` is
  built. `RESEND_FROM_ADDRESS` and `EMAIL_FROM` are gone, replaced by `RESEND_SENDING_DOMAIN`
  holding a bare domain; the local parts belong to the stream. There is **no fallback** — an unset
  domain throws, rather than reaching for a sandbox address, which is the whole shape of this bug.
  Display name is firm → assessor → `Gut8erPRO`, and `reply_to` is `dbUser.email`.
- **Provider errors never reach the screen.** `sendReportEmail` returns a discriminated result
  carrying a `SendFailureCode`; the route answers with the bare code and logs the provider's prose
  server-side. Two classes as specified, in `src/lib/email/send-failure.ts`.
- **Escaping.** `reportTitle`, `recipientName` and the footer are escaped via `src/lib/email/html.ts`;
  `${body}` is left alone, being the assessor's rich text.
- **Tests.** 27 unit tests over the classifier, the sender and the send path.
  `services.integration.test.ts` no longer names a sandbox sender.

### Corrections to this issue

- The spec put the classifier on Resend's message prose. That was wrong: a reworded provider string
  would silently reclassify to the service class, which is the one with no assessor remedy — "try
  again", forever, the outcome the two-class design exists to avoid. The classifier now keys off
  `name`, Resend's stable `RESEND_ERROR_CODE_KEY` enum, and falls back to the message only for the
  three names Resend reuses across both classes. This is not the per-code mapping the spec rejected:
  it is one set of names collapsing to one class.
- The preflight guarded `RESEND_API_KEY` only. With the key set and the domain unset — production's
  exact state until the configuration below is done — every PDF rendered before the send threw. It
  now checks both, before anything expensive.
- `docs/TECH_STACK.md:877` held a **third** env list, also missing the variable. The issue named
  `.env.example` and the README. Three places is how this shipped; all three now carry it.

### Beyond the spec

Two things were added that part 3 did not ask for, both the same defect class in files already being
edited:

- The notification mail interpolated `firstName` and `description` raw. Escaped.
- A display name reaches a mail **header** from a user-editable business name, so `formatSender`
  strips CRLF, quotes and backslashes. Without it the firm name is header injection.

### Still outstanding

- **Sentry captures nothing.** Issue 12 has not landed, so the `captureException` here is
  decorative. The `console.error` beside it works today. Do 12 next.
- **The Vercel environment variables** under *Configuration still owed (human)* above. The local
  `.env` already carries `RESEND_SENDING_DOMAIN`; Vercel does not.
- **Issue 11** is untouched and still live on this same route: a send whose PDFs all fail still
  reports success and locks the report.
