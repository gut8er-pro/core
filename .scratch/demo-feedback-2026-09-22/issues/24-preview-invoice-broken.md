# 24 — Preview Invoice does nothing

Status: ready-for-agent
Type: bug
Severity: high

The green "Preview Invoice" button on the Invoice banner: clicking it opens nothing. Client
clicked it live on the call.

## Direction

- `src/components/report/invoice/invoice-banner.tsx` renders the button — check whether a
  handler exists at all and what it is supposed to open (an invoice PDF via the export route, a
  preview modal?). If it was never wired, it is the same dead-control class as audit 06.
- Expected v1: open the generated invoice PDF (the export pipeline already renders the invoice
  section; a dedicated `?section=invoice` or the existing invoice toggle path) in a new tab, or
  an in-app preview modal — whichever the export route already supports with the least new
  surface.
- Coordinate with 25 (claimant block on the invoice) so the preview shows the corrected layout.
