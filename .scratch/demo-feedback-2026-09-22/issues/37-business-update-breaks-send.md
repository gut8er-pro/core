# 37 — After updating Business Information, sending stops working

Status: ready-for-agent
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
