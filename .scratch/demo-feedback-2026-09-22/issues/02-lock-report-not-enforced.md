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

## Finding (2026-09-22, pre-implementation audit)

The server ALREADY refuses locked writes — every section route
(accident-info/vehicle/condition/calculation/invoice/photos) returns 403 "Report is locked" on
PATCH/POST. What the client experienced is the CLIENT side: inputs stay enabled on a locked
report, the debounced autosave swallows the 403 silently, and typing looks saved while nothing
persists. Silent data-loss illusion, not a server hole.

## Direction (revised)

1. **Shared:** `useAutoSave` surfaces the 403/locked response as a distinct error status so
   every tab's save indicator shows "locked" loudly instead of nothing. (Done in the foundation
   pass alongside the other shared pieces.)
2. **Per tab, owned by each cluster agent:** when `report.isLocked`, disable/readOnly the form
   controls and hide add/remove/upload affordances — accident-info, vehicle, condition,
   calculation (wave 1); gallery + annotation editor (wave 1); invoice + export composer
   (wave 2). The invoice page already passes `disabled` to `useAutoSave`; the rest follow the
   same shape and additionally disable the inputs themselves.

E2E: extend `19-send-gate.spec.ts` with a locked-write refusal probe and a locked-page
inputs-disabled check per tab.
