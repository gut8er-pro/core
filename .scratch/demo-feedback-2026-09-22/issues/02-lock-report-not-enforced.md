# 02 — Lock report does not actually prevent editing

Status: ready-for-agent
Type: bug
Severity: high

Ivan, from the call: "lock report je bez funkcije — iako se trigeruje, takođe se može editovati."
The screenshot shows the locked state rendering correctly (Lock Report badge next to the title,
yellow "This report has been locked and is read-only" banner) — but fields still accept input and
saves still go through.

Business rule #1 in CLAUDE.md says locked reports are read-only, and the 2026-09-15 pass verified
the BANNER, not the enforcement.

## Direction

Two layers, both needed:

1. **Server (the one that matters):** every section PATCH route
   (`/api/reports/[id]/{accident-info,vehicle,condition,calculation,invoice,photos,signatures}`)
   must refuse writes when `report.isLocked` — today at least some of them don't check. Return a
   dedicated code (e.g. 423 `locked`) so the client can toast it. Unlock stays where it is
   (Export & Send toggle → `/api/reports/[id]` PATCH `isLocked: false`), and the send route keeps
   working for delivered reports.
2. **Client:** the details pages already receive `report.isLocked` (invoice page passes
   `disabled: report?.isLocked` to `useAutoSave` — check the other tabs do the same) but the
   INPUTS remain enabled. Disable/readOnly the form controls per tab when locked, hide
   add/remove/upload affordances (photos, visits, line items, annotation editor), and make the
   banner the single explanation.

Add gate tests next to the existing send-gate suite (`testing/e2e/19-send-gate.spec.ts` covers
the locked-download exemption; extend with locked-write refusals).
