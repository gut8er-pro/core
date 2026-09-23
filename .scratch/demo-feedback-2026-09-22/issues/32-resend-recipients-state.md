# 32 — Sending the same report twice: recipients vanish, and an "empty" send still mails out

Status: done
Type: bug
Severity: high

Client's exact sequence: entered a recipient, sent twice — fine. Re-entered Export & Send later:
the recipient field was EMPTY, he accidentally hit Send Report — nothing visible in the input —
and the mail still went out. Also seen in the screenshots: a "Failed to send report" banner on
the locked report's re-send attempt.

Two distinct defects plus a requirement:

1. **Recipients must persist per report.** What was entered in Recipient stays there when the
   page is reopened (the `ExportConfig` model exists in the schema for exactly this kind of
   state — check whether recipients/subject/body are saved at all today, and wire them if not).
2. **What you see is what gets sent.** A send with a visually empty recipient list must be
   impossible: the Send button disables with zero chips, and the payload is built ONLY from the
   rendered chips — never from stale component/server state. The accidental mail means some
   cached recipient list survived the UI reset; find it (component state vs saved ExportConfig
   vs request built server-side from an earlier send).
3. Re-sending a locked/SENT report is legitimate (the exemption exists) — whatever produced the
   "Failed to send report" banner on the second visit needs a reproduction and a note here
   (could be the same stale-state confusion, could be a real refusal mis-rendered).

E2E: extend the send flow spec with send → reopen → assert chips present → clear chips →
button disabled.

## Addendum from the meeting-notes PDFs

- Scope widened: not just recipients — "if you fill out the sending formula but go back to the
  report and come back, everything is lost" — SUBJECT and BODY must persist per report too
  (ExportConfig carries all composer state).
- The stale send is worse than captured: "recipient is empty but I click send — I receive the
  OLD VERSION I sent last time; could be a problem if it is overarching between reports."
  Verify the payload cannot come from another report's state, and that a re-send always
  regenerates the PDFs from CURRENT data (never a cached attachment).

## Root cause (traced 2026-09-23)

Three independent defects, and the "old version went out" report is explained by the first two
together.

### 1. The chips were never persisted, and never restored

`EmailComposer` held `recipients` in its own `useState`, seeded from nothing. On mount the list
was always `[]`. A `useEffect` then pushed that empty list DOWN into the form:

```tsx
useEffect(() => {
  if (recipients.length > 0) {
    setValue('recipientEmail', recipients.map((r) => r.email).join(', '))
  } else {
    setValue('recipientEmail', '')
  }
}, [recipients, setValue])
```

Meanwhile the page's `reset()` had just restored `recipientEmail` from the server. The two
raced, and which won depended on effect ordering — on a reopen the composer's empty list
usually landed last, so `recipientEmail` was cleared. But `ExportConfig.recipients` was never
written by the composer at all; only the send route wrote `recipientEmail`.

### 2. The send payload came from the form, not from the chips

`handleSend` read `getValues().recipientEmail`. With the chips empty but the reset having
restored the last-sent string, the payload carried **the previous send's recipient while the
field showed nothing** — precisely the client's "recipient is empty but I click send and I
receive the OLD VERSION". It is per-report, not cross-report: the value comes from that
report's own `ExportConfig` row. Confirmed: `recipientEmail` is read from
`prisma.exportConfig.findUnique({ where: { reportId } })`, so it can never leak another
report's address.

There was no zero-chip guard either — `canSend` only consulted the completeness gate.

### 3. "Failed to send report" on the locked re-send — TWO causes, both reproduced

- `POST /send` began with `if (report.isLocked) return 403 'Report is already locked and sent'`.
  Every re-send of a locked report was refused, and the client renders any unclassified error
  as the generic `sendFailed` banner. Re-sending a delivered Gutachten is legitimate work
  (a second insurer, a client who lost the mail), and the download exemption already assumes it.
- Found while reproducing: the route also required an `ExportConfig` row to already exist and
  answered `400 "Export config not found. Please configure export settings first."` otherwise.
  That row is created only by the composer's GET, so any send that did not go through that page
  first died the same way, behind the same banner.

## Resolution (2026-09-23)

Status: done. All three, plus the config-not-found defect found during the reproduction.

- **Persistence.** `ExportConfig.recipients` / `recipientMode` are now read and written.
  `serializeExportConfig` in the export route returns `recipients`, falling back to splitting
  the legacy `recipientEmail` so reports sent before the column existed still show their chips.
  PATCH accepts `recipients` and `recipientMode`; zod validates the mode against the two the
  composer offers. Subject and body already had columns and are now saved on blur / on change
  rather than only at send time — the addendum's "go back to the report and come back and
  everything is lost" case.
- **The chips ARE the state.** `EmailComposer` is now controlled: `recipients` comes in as a
  prop from the page's form value and every mutation calls `onRecipientsChange`. There is no
  local list and no downward `setValue` effect, so there is no longer a second copy to go stale.
- **What you see is what gets sent.** `handleSend` builds `recipientEmail` by joining the
  rendered chips. `canSend` requires `recipients.length > 0`, and `handleSend` returns early on
  an empty list as well — the button covers the ordinary case, the guard covers the race where
  a click lands after the list has emptied.
- **Locked re-send.** The `isLocked` 403 is gone. A locked report that is re-sent keeps its lock
  (`status` is not downgraded from `LOCKED` to `SENT`), and `reportLocked` in the response now
  reflects the report's actual state rather than only this request's toggle.
- **Config-not-found.** The send route upserts the `ExportConfig` row instead of demanding it.
- **No cached attachments.** Every send calls `generateReportPdfBuffer` fresh, per language, per
  request — there is no attachment cache anywhere in the path. Asserted by a test that sends
  twice and counts the generator calls.

### Reproduction, on the live local stack

Send → lock → re-send, against the real Resend boundary:

```
FIRST SEND           {"status":502,"body":{"error":"email_service_unavailable"}}
SECOND SEND (locked) {"status":502,"body":{"error":"email_service_unavailable"}}
EXPORT CONFIG        {"recipients":["pw-resend@example.test"],"subject":"PW resend"}
```

Both attempts now reach the provider and fail identically on the local key's unverified domain
— the classified, expected failure. Before the fix the second attempt returned
`403 "Report is already locked and sent"`. Composer state survived the refused send.

### Tests

- `src/app/api/reports/[id]/export/route.test.ts` (new) — 9 tests: restore of
  recipients/mode/subject/body, the legacy-column fallback, the empty case, row creation on
  first visit, persistence of chips + mode + subject/body + toggles, clearing the last chip, and
  rejection of a mode outside the two.
- `src/app/api/reports/[id]/send/route.test.ts` — 5 new: locked re-send returns 200, the
  attachment is regenerated rather than reused, the sent recipients are stored, a send with no
  pre-existing config row succeeds, and the section selection is honoured.
- `10-export.spec.ts` — Send disabled with zero chips → add a chip → enabled → fill subject →
  navigate to the Vehicle tab → back → chips and subject both still there → remove the last chip
  → disabled again.
