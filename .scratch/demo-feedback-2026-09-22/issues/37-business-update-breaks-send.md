# 37 — After updating Business Information, sending stops working

Status: done
Type: bug
Severity: high

HS notes: "after updating business information no sending possible anymore" — editing the
business settings left the account unable to send reports at all.

## Direction

- The send path reads business data for the sender identity
  (`gutachtenSender({ assessorName, companyName })` in `src/lib/email/send-report.ts`) — a
  changed/emptied company name or a stray character may make the From header invalid and every
  send fail with the generic error.
- Reproduce: update business fields (try empty optional fields, umlauts, quotes in company
  name), then send; capture the actual failure (local stack logs the `[send]` line).
- Fix shape: sanitise/escape the sender display name, treat missing company gracefully
  (fallback to assessor name), and add a unit test on the sender-building path with hostile
  company names. If the real cause turns out different, record it here first.

## Resolution

Status: done

The suspicion was right about the file and wrong about the mechanism. `gutachtenSender`
already stripped CR/LF and quotes, so neither newline injection nor a quoted company name was
the cause. Two other things were, and both are reached only by editing Business Information:

**1. No length cap on the From header.** The display name is
`"<companyName> via Gut8erPRO" <gutachten@…>` with nothing bounding it. Resend refuses the
whole send, verified live against the API:

```
POST https://api.resend.com/emails  from="XXXX…(500) via Gut8erPRO" <gutachten@gut8erpro.de>
-> 422 {"statusCode":422,"name":"validation_error",
        "message":"The email address length is more than 320 characters long."}
```

`classifyResendError` sees `validation_error` with no backticked `to`, so it falls through to
`email_service_unavailable` — "a service problem, try later". The assessor is never told their
own company name is the reason, and since the name is stored, EVERY later send fails the same
way. That is the reported "after updating business information no sending possible anymore".

**2. Raw non-ASCII in the display name.** `Müller & Söhne` went onto the wire unencoded. RFC
5322 has no room for it in an unencoded display name; it is rejected or mangled depending on
the hop. Umlauts in a German firm name are the rule, not the edge case.

The empty-company path was already correct — it falls back to the assessor name — and now has
a test pinning it, plus one for a company name that is nothing but quotes (which used to
survive cleaning as an empty string and silently dropped the assessor too).

### Fix

`src/lib/email/sender.ts` only. The route was not touched.

- `cleanDisplayName` extracted, and `gutachtenSender` now cleans the company and assessor names
  BEFORE choosing between them, so `'""'` or `'  '` falls through to the assessor.
- `encodeDisplayName` emits RFC 2047 `=?UTF-8?B?…?=` when the name is not printable ASCII, and
  a plain quoted string when it is — an all-ASCII firm name looks exactly as before.
- `formatSender` trims the name until the finished header fits `MAX_FROM_LENGTH` (320). The cap
  is measured on the assembled header, not guessed from the name, because base64 inflates by a
  third and an umlaut costs two bytes before it does. A name too long to fit at all degrades to
  the bare address rather than failing the send.

### Tests

`src/lib/email/sender.test.ts`, 13 passing (6 new): umlauts encoded and ASCII-only on the wire,
plain ASCII still quoted not encoded, the quotes-only fallback, a 500-char name capped at 320
while still showing the firm, and a 500-char non-ASCII name capped too.

### Operational note, not fixed here

`RESEND_SENDING_DOMAIN` is in neither `.env` nor `.env.local` — only in the dev-server command
line. A machine started without it gets a 503 `email_service_unavailable` from the send route's
config preflight, which looks identical to this bug from the UI. Worth adding to `.env` so the
two failures cannot be confused again. Separately, the Resend account reports
`gut8erpro.de` as not verified (403 on every send), which will need doing before real delivery.
