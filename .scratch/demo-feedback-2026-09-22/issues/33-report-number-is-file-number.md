# 33 — Report number everywhere = the file number (Aktenzeichen)

Status: ready-for-agent
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
