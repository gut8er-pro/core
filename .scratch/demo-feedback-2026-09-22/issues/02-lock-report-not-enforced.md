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

## Resolution — Export composer slice (2026-09-23)

Status: the export slice is done, and it deliberately does NOT disable the composer.

Locking closes the Gutachten to **edits**, not to **delivery**. Re-sending a delivered report —
to a second insurer, or to a client who lost the mail — is ordinary work, and the completeness
gate's standing exemption already assumes a locked report stays deliverable. So on a locked
report the composer stays fully usable: recipients, presets, subject, body, the section toggles,
Preview and Send Report all work.

What changed to make that true rather than merely look true:

- `useAutoSave` no longer receives `disabled: report?.isLocked` on this page. It did before,
  which meant a locked report silently dropped every composer change — the same
  looks-saved-but-isn't illusion this ticket is about, just one page over. `ExportConfig` is
  send metadata, not report content, and `/api/reports/[id]/export` PATCH has no lock guard, so
  the writes land.
- The send route's `isLocked` 403 is gone (see ticket 32), so the Send button on a locked report
  no longer leads to a generic failure banner.
- A locked report that is re-sent **keeps its lock**: the route no longer downgrades `LOCKED` to
  `SENT`, and the response's `reportLocked` reflects the report's real state.

The lock toggle itself is unchanged, as instructed.

**No misleading disabled states:** Send is disabled only for reasons the page explains on
screen — the completeness gate (existing panel), zero recipient chips (`noRecipientsHint`), or
all three section toggles off (`noSectionsHint`). Preview is disabled on the same terms minus
the recipients. Nothing is disabled merely because the report is locked.

## Follow-up (2026-09-23): the client could not unlock on production

Reported live: "odčekiram Lock Report, ali polja i dalje ne mogu da se menjaju" — and the
toggle is back ON after a reload.

Reproduced on production (wave 1) with a network probe: clicking the switch fires **no
request at all**. Root cause is the wave-1 deadlock this ticket's export slice already
removed: the export page passed `disabled: report?.isLocked` into `useAutoSave`, so on a
locked report the unlock write itself was silently dropped. Locked → autosave disabled →
unlock impossible. The switch flips only in local form state and reverts on reload.

Wave 2 (staged) already fixes the save path. Two additions made today on top of it:

1. **The banner now follows the unlock without navigating away.** The lock write is flushed
   immediately (`flushNow`) and, once the tracked save lands (`awaitSectionSave`), the page
   invalidates `['report', id]` (exact) so the layout's read-only banner and chip clear in
   place. Export config and section queries are not refetched, so the composer form is never
   reset by this.
2. **E2E regression test** in `10-export.spec.ts` ("Lock and unlock from the UI"): lock via
   API, open Export, click the switch, assert the PATCH lands and `isLocked` is false in the
   DB, banner gone, then type into Accident Scene on the details tab, assert the save PATCH
   returns 200 and the value survives a reload. The suite previously locked only via API and
   never exercised the unlock click — which is exactly where the client got stuck.

Verified: tsc clean, biome clean, hooks unit 105/105, `10-export` + `19-send-gate` 18/18.
