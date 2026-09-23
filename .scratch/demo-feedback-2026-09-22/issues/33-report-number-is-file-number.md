# 33 — Report number everywhere = the file number (Aktenzeichen)

Status: done
Type: feature
Severity: medium

Wherever the app shows a "report number" — dashboard table, statistics/invoice history, PDF
headers, anywhere a report identifier appears — it must be the report's FILE NUMBER
(`ExpertOpinion.fileNumber`, the Aktenzeichen the assessor enters), not an internal id or a
separate counter.

## Direction

- Sweep the surfaces: dashboard report list (`report-list.tsx`), statistics invoice history,
  PDF header/footer blocks, notifications text, email subjects if they reference a number.
- Display rule: `fileNumber` when present, an em dash (or nothing) when not yet entered — no
  fallback to UUIDs.
- The invoice keeps its own `invoiceNumber` (different document, different number) — the client
  asked specifically about the REPORT number.
- Check search on the dashboard matches fileNumber too while in `page.tsx` (relates to the old
  note that search only matches titles).

## Resolution

The dashboard was showing a number **derived from the report UUID**:

```ts
function generateReportNumber(id: string): string {
	const hash = id.replace(/-/g, '').slice(0, 6).toUpperCase()
	return `GH-${hash.slice(0, 3)}-${hash.slice(3, 5)}`
}
```

A stable, real-looking `GH-XXX-YY` that meant nothing — exactly the looks-real-but-isn't
pattern. Deleted.

- `GET /api/reports` selects `expertOpinion.fileNumber` and returns it as `fileNumber`;
  added to the `Report` type in `use-reports.ts`.
- `report-list.tsx` renders `report.fileNumber || '—'`.
- Dashboard search matches `fileNumber` alongside title, claimant, plate and vehicle.
- Statistics invoice history gained a "Report No." column, kept separate from the invoice's
  own "Invoice ID"; its search matches the file number too.
- PDF header/footer left alone — the export agent owns those files.

Covered by unit tests (file number renders; em dash when absent; no `GH-` anywhere) and an
e2e assertion that no `GH-XXX-YY` string appears on the dashboard.

## PDF part (2026-09-23) — done

The PDF header identified the report by `data.report.id.slice(0, 8).toUpperCase()` — a slice of
the UUID, a number the assessor has never seen and cannot match to anything. It now prints
`expertOpinion.fileNumber`, with an **em dash when the Aktenzeichen has not been entered** and
no fallback to the id, per the ticket's display rule.

Verified on a live report: `Gutachten-Nr. HB-2026-001`. `10-export.spec.ts` asserts both halves
— that the header contains "Gutachten-Nr." and that it does NOT contain the report's UUID slice.

The other surfaces in this ticket (dashboard list, statistics, notifications, email subjects)
are outside the export slice.
