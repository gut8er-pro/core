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

## Resolution — accident-info tab only (2026-09-22)

Status: the accident-info slice is done. The other tabs are their own agents' slices.

The details page reads `report.isLocked` via `useReport` and passes `disabled` down to every
section; `SectionProps` gained an optional `disabled` for it. When the report is locked:

- every text input, select and checkbox in the accident, claimant, lawyer, owner, opponent,
  visit and expert-opinion sections is disabled;
- the add-visit and remove-visit buttons are disabled;
- the three signature-type buttons and the remove / update-signature buttons are disabled, and
  the signature cards drop their pointer cursor rather than looking clickable.

`useAutoSave` already receives `disabled`, so nothing is queued either. Two unit tests in
`claimant-section.test.tsx` assert every input is disabled when locked and enabled when not.

## Resolution — calculation tab (2026-09-22)

Status: the calculation slice is done.

`useAutoSave` on this page already received `disabled: report?.isLocked`, so nothing was ever
queued for a locked report. What was missing was the inputs themselves: every control stayed
editable, so the assessor could type into a locked report and watch the text simply not
persist.

All calculation sections (Value, Repair, Loss of Use, BE Valuation, OT Oldtimer Valuation and
the Correction cards) now render inside a single `<fieldset disabled={isLocked}>`, which
disables every descendant control in one place rather than threading a `disabled` prop through
five section components and their `TextField` / `SelectField` / `Checkbox` children. The
"Upload Image to Auto-fill" button is disabled too, so a locked report cannot start an AI run.

`isLocked` comes from `useReport(reportId)` (`report?.isLocked === true`), the same source the
hook's `disabled` uses.

## Partial resolution — Condition tab (condition agent, wave 1)

The Condition tab's own slice is done. `report.isLocked` is read once in the tab's page as
`isLocked` and threaded into every control the tab owns:

- `ConditionSection` — all seven combos, the unit select, vehicle colour, special features,
  both mileage inputs, next MOT, the three checkbox pills, the notes textarea and the four
  Schadstoffplakette badges.
- `TireSection` — per-tyre size/profile/manufacturer, the usability buttons and the "+",
  the tyre-type pills, both Align Axes / Match The Set buttons, and the add-set tab.
- `PriorDamageSection` — all three inputs and the description textarea.

`ConditionSectionProps` carries an optional `disabled`, so the sections stay usable unlocked
with no call-site change.

Still open on this tab, for whoever owns the shared primitives:

- `YesNoField` (`src/components/ui/yes-no-field.tsx`) has **no `disabled` prop**, so "Airbags
  deployed" and "Error memory read" remain clickable on a locked report. Left alone
  deliberately — shared primitive, coordinator is handling it.
- `DamageDiagramSection` markers were not covered by this pass.

## Gallery slice (2026-09-22) — done

When `report.isLocked`, the gallery hides or disables every mutating affordance, so the assessor
never types into something that will be refused:

- **Upload** — the dropzone is `disabled`, both file-drop surfaces (grid and single view) refuse
  drops, the "+" add tiles are hidden in grid and filmstrip, and `handleFilesSelected` /
  `handleAddPhotos` return early.
- **Delete** — the trash button is hidden in the grid and the single-photo viewer, and
  `handleDelete` returns early.
- **Rotate** — the rotate button is hidden (ticket 08).
- **Reorder** — thumbnails are not `draggable` in either the filmstrip or the grid (ticket 09).

A yellow banner (`gallery.lockedHint`, both locales) says why the controls are gone. The server
already refused these writes; both new routes (`/photos/reorder`, `/photos/[photoId]/rotate`)
return 403 on a locked report, matching the existing photo routes.

Not in this slice: the annotation editor's locked state (annotation-modal is another agent's file).
