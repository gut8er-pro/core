# 30 — Export toggles don't shape the PDF; invoice must be its own last page

Status: ready-for-agent
Type: bug
Severity: high

Observed on the call: with only "The Invoice" toggled on, the sent document was the WHOLE
report — the three Export & Send toggles (Vehicle valuation / Commission / The Invoice)
apparently don't drive the PDF content at all. And when everything is selected, the invoice
must render as a SEPARATE page — the last page of the PDF, starting on a fresh page.

## Direction

- Trace the toggle state: composer → send/export request params → PDF template conditionals
  (`src/lib/pdf/`). Find where the chain breaks (state saved to `ExportConfig` but never read?
  params never passed? template ignores them?) and note it here before fixing.
- Semantics to implement: each toggle includes/excludes its section; invoice-only produces an
  invoice-only document; the invoice section always begins on a new page and sits last
  (`@react-pdf` `break` on the invoice page component).
- Preview (ticket 29) must honour the same params — build both on one code path.
- Add a unit test around the template's section selection with the three toggle combinations
  the client will try first: all on, invoice-only, invoice-off.
