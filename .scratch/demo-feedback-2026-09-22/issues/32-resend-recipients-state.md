# 32 — Sending the same report twice: recipients vanish, and an "empty" send still mails out

Status: ready-for-agent
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
