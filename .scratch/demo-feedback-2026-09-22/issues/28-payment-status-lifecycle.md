# 28 — Payment status lifecycle: pending → completed/delayed, coherent across dashboard and statistics

Status: ready-for-agent
Type: feature
Severity: high

The client caught the incoherence live: dashboard shows "Completed Payments: 2" while Total
Revenue reads 0,00 € — and the latest report's invoice is missing from Invoice History
entirely. The payment model needs to become real:

## Lifecycle

- Invoice created (report sent / invoice written) → **PENDING**.
- Assessor manually marks it **COMPLETED** when the money arrives — by clicking the status in
  Statistics (status chip cycles or opens a small menu).
- When the invoice's payout-delay days pass without payment → automatically **DELAYED**, shown
  in red. (Delay source: the invoice's own `payoutDelay` field, counted from invoice date.)
- Delayed invoices can still be marked completed; completed is terminal unless manually
  reverted.

## Storage

Additive: `Invoice.paidAt DateTime?` is enough — PENDING = unpaid & not overdue, DELAYED =
unpaid & `date + payoutDelay < now` (computed, never stored), COMPLETED = `paidAt` set. One
small PATCH endpoint/extension for marking paid/unpaid.

## Dashboard must follow the same numbers

- Total Revenue = sum of COMPLETED invoices (per selected period, chart included).
- Add the two missing money figures so "gore sekcije prate donje": Pending = sum awaiting,
  Delayed = sum overdue — counts and sums always from the same query
  (`/api/stats` + `use-revenue-stats.ts` / `use-revenue-series.ts`).

## Statistics / Invoice History

- Every report with an invoice appears — investigate first why the client's latest one is
  missing (filter? join? only SENT reports?) and note the cause here.
- Sort newest first by default.
- Status chip per row: colored (delayed red), CLICKABLE to change status (pending ↔ completed),
  and the table filterable/sortable by status so unpaid ones list fast.
- KPI cards on statistics reflect the same three sums as the dashboard.

Completeness/PDF untouched. Locales for the three status labels. E2E: extend the statistics
spec with mark-paid → totals move.
