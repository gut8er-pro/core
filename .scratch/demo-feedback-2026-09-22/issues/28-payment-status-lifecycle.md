# 28 — Payment status lifecycle: pending → completed/delayed, coherent across dashboard and statistics

Status: done
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

## Resolution

### Why the client's latest invoice was missing from Invoice History

Two causes, both in `/api/stats`, neither of them a filter on report status:

1. **The row date was the invoice date, not the report date.** Rows were keyed on
   `invoice.date ?? report.createdAt` and sorted by that string descending. The client's
   newest report carried an invoice whose `date` was an old (or unset) value, so it sorted
   to the *bottom* of an unpaginated 83-row table — present in the DOM, invisible in
   practice. Ten invoices in the local DB still have `date = NULL`.
2. **Every row showed 0,00 €, so nothing looked real.** `Invoice.totalGross` is 0 for all
   70 local invoices — the invoice tab never PATCHes the stored totals, even though the
   line items sum to ~€22k. Revenue summed `totalGross`, hence "Total Revenue 0,00 €".

The "Completed Payments: 2" vs "Total Revenue 0,00 €" incoherence had a third, separate
cause: the counts came from **report status** (`SENT`/`LOCKED` counted as "completed",
`DRAFT` older than 30 days as "delayed") while revenue summed *all* invoices. Two unrelated
queries over two unrelated notions of "completed". Payment state had nothing to do with it.

### What changed

- `src/lib/invoice/payment-status.ts` — the lifecycle, computed, never stored: COMPLETED
  when `paidAt` is set, DELAYED when `date + payoutDelay <= now`, PENDING otherwise. An
  invoice with no `date` stays pending (nothing to count from). Default payout delay 30 days.
- `src/lib/invoice/amount.ts` — `invoiceGross()` mirrors the fallback the PDF template
  already used (stored gross → stored net grossed up → line items), so the money is real
  regardless of whether the invoice tab wrote the totals.
- `/api/stats` — one query over invoices now feeds counts, sums and the chart, so the top
  numbers and the bottom counts cannot disagree. Adds `pendingRevenue` / `delayedRevenue`.
  The revenue series buckets on **`paidAt`**, so the chart is money actually received.
- `PATCH /api/invoices/[id]/payment` — `{ paid: boolean, paidAt?: string }`, ownership
  checked through `report.userId`. Deliberately not on the invoice PATCH: that route
  refuses locked reports, and a delivered report is exactly when payment gets marked.
- Dashboard: each of the three figures now shows its count *and* its sum.
- Statistics: status chip is a button that toggles pending↔completed, status filter
  (All/Pending/Overdue/Completed), and two KPI cards for the pending and overdue sums.

### Verified

Live, against the local DB: 83 invoices, €26,485.83 total, split pending €232.05 /
delayed €26,253.78 / completed €0 — the three sums add up to the grand total. Clicking a
chip moved €17.85 between Total Revenue and Pending and back.

### Mahnung (not built)

Nothing here blocks a later dunning step: DELAYED is derived, so a Mahnung feature would
read the same `dueDate()` helper and only needs its own reminder-sent state. Not built.
