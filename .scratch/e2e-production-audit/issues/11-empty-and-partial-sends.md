# 11 — A send with no Gutachten attached still succeeds, and still locks the report

Status: resolved
Type: bug
Severity: blocker

If every PDF fails to generate, the app emails the client a covering note with **no Gutachten
attached**, reports "Gutachten erfolgreich gesendet", marks the report `SENT`, and — if the assessor
ticked the lock — locks it against a second attempt.

Found while tracing issue 01. The audit could not have caught it: the Resend failure stopped the
send before this code path mattered.

## The defect

`src/app/api/reports/[id]/send/route.ts:89-103`

```ts
for (const lang of pdfLanguages) {
    try {
        const pdfResult = await generateReportPdfBuffer(id, user.id, lang)
        if ('buffer' in pdfResult) {
            pdfAttachments.push({ … })
        } else {
            console.error(`PDF generation error (${lang}):`, pdfResult.error)   // :99
        }
    } catch (err) {
        console.error(`PDF generation failed (${lang}):`, err)                  // :102
    }
}
const pdfAttachment = pdfAttachments[0]                                          // :105 — undefined
```

Each language is independently try/caught and every failure is swallowed into a `console.error`.
Nothing downstream checks whether the loop produced anything. `sendReportEmail` is called
regardless, Resend accepts a mail with no attachments, and `emailResult.success` is `true`.

Execution then falls through to the `status: 'SENT'` / `status: 'LOCKED'` writes and the
`REPORT_SENT` notification, all of which now assert something untrue.

## Why this is worse than issue 01

Issue 01 fails loudly — the assessor sees an error and knows the client has nothing. This fails
silently. The assessor believes the Gutachten was delivered, the client receives a covering note
referencing an attachment that isn't there, and nobody finds out until the client asks. If the
report locked, the assessor cannot even re-send it.

## Two cases, one rule

**Empty send** — every language failed, zero attachments. Abort.

**Partial send** — the assessor ticked DE *and* EN, German generated, English threw. Currently the
German one goes out alone and the report locks. Also abort.

Ticking two languages is deliberate: the recipient needs both — an insurer's international desk, a
foreign claimant. Silently dropping one and then locking means the omission is discovered by the
client and cannot be corrected in-app.

Sending the partial with a warning was considered and rejected: it leaves the assessor deciding
whether to re-send, and a locked report will not let them.

**The rule:** if `pdfAttachments.length !== pdfLanguages.length`, abort before calling Resend. No
mail, no status change, no notification, no lock.

## The fix

1. After the loop, compare `pdfAttachments.length` against `pdfLanguages.length`. On mismatch,
   return before `sendReportEmail` — 500, with an error code the client translates naming which
   languages failed.
2. Keep the per-language `console.error`s; add the underlying generation error to the response's
   server-side log line so the cause is recoverable.
3. Do not touch the `exportConfig.update` at `route.ts:74-82`. Persisting the recipient details of
   an attempt that then failed is correct — it is what the assessor retries from.

## Tests

Cover both branches with `generateReportPdfBuffer` mocked: all-fail and one-of-two-fail. Assert in
each that Resend was never called, that `report.status` is unchanged, that no notification was
created, and that the report is not locked.

## Related

- **Issue 01** — same route, same branch. The two together are "the send path stops lying about what
  happened": 01 covers what the assessor is told when a send fails, 11 covers a send that fails
  without saying so.

Domain vocabulary — *empty send*, *partial send* — is in
[`CONTEXT.md`](../../../CONTEXT.md#send-failures).

## Resolution (2026-09-15)

`src/app/api/reports/[id]/send/route.ts` collects a cause per failed language and, when
`pdfAttachments.length !== pdfLanguages.length`, answers `500 {error: 'pdf_generation_failed',
languages}` before `sendReportEmail` — no mail, no status write, no notification, no lock. The
refusal logs one `[send] report=… refused:` line carrying every underlying generation error and
captures it to Sentry; the `exportConfig.update` above it is untouched.
`sendErrors.pdfGenerationFailed` in `src/messages/{de,en}.json` is mapped in
`src/app/(app)/reports/[id]/export/page.tsx`. Both branches, plus the send that does go out once
every language rendered, are covered in `src/app/api/reports/[id]/send/route.test.ts`.

The message does not yet name the failed languages: `src/hooks/use-export.ts` drops everything but
`error` from the body, so the list reaches the server log and the response but not the screen.
