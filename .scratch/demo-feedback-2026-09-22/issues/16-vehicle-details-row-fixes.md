# 16 — Vehicle Details rows: ranges, defaults, dead plus buttons

Status: done
Type: bug + polish
Severity: medium

The client likes the Vehicle Details pill rows as such; three fixes:

1. **Doors and Seats start at 1, not 0.** Drop the `0` pill from both rows (a car with zero
   doors/seats is nonsense in a Gutachten).
2. **Previous Owners has no default and is omitted when unknown.** Nothing pre-selected; the
   assessor picks a value only when they know it. When nothing is selected the field must not
   appear in the report at all — PDF renders no "Previous owners" line (and completeness must
   not require it). Selecting must also be UNDOABLE back to "unknown" (clicking the active pill
   deselects it), otherwise one stray click can never be cleared.
3. **The "+" pills do nothing.** Every row (vehicle type, motor type, axles, driven-by, doors,
   seats, previous owners) ends in a "+" that is currently dead — same dead-control class as
   audit ticket 06. Wire it as "custom value": clicking "+" turns into a small inline input
   (numeric rows: any number, e.g. 6 axles; type rows: free label) that becomes the selected
   pill. If a row realistically has no custom case, remove its "+" instead of faking one.

## Direction

- `src/components/report/vehicle/` details/specification sections hold the pill rows; values
  already flow through the vehicle PATCH as plain ints/strings, so custom values need UI work
  only. Check the zod ranges in `src/lib/validations/` (doors/seats min) and the PDF template's
  vehicle block for the omit-when-null behaviour.
- Mind audit ticket 06's precedent: dead controls are either wired or removed, never left.

## Resolution

All three fixes done in `src/components/report/vehicle/details-section.tsx` plus the data side.

**1. Doors and seats start at 1.** The `0` pill is gone from both rows. Seats now runs 1–5 (was
1–4 after dropping the zero) so the existing default of 5 renders as an ordinary pill rather than
appearing as a custom value. Zod ranges in `src/lib/validations/vehicle.ts` went `min(0)` →
`min(1)` for `doors` and `seats`.

**2. Previous Owners has no default and is omitted when unknown.**
- `VEHICLE_DEFAULTS.previousOwners` is now `null`, and `vehicleFromApi` no longer substitutes a
  default, so nothing is pre-selected.
- Clicking the active pill deselects back to unknown
  (`value === Number(v) ? null : Number(v)`), so a stray click is always undoable.
- Unset persists as `null` in the DB. This needed a real bug fix in
  `src/app/(app)/reports/[id]/details/vehicle/page.tsx`: `handleFieldBlur` ran `Number(value)` on
  every numeric field, and `Number(null)` is `0` — it would have written a false "0 previous
  owners" (which renders as "New") instead of omitting the field. It now short-circuits on `null`.
- `previousOwners` was removed from the vehicle rules in `src/lib/completeness/manifest.ts`
  (surgical: only the BE/OT rule; `vehicleTab` no longer needs its `reportType` param). The
  corresponding test in `compute.test.ts` now asserts no report type requires it.
- PDF: **no change needed, verified not just assumed.** `src/lib/pdf/report-template.tsx:556`
  already guards `previousOwners !== null && !== undefined`, so an unset value renders no line and
  prints no default. The "New"/"Neu" label is UI-only (the `0` pill) and never reaches the PDF. No
  PDF file was edited.

**3. The "+" pills now do something.** New `src/components/report/vehicle/custom-value-pill.tsx`:
clicking "+" swaps in a small inline input that becomes the selected pill on commit. Numeric rows
(axles, driven-by, doors, seats, previous owners) accept any number — 6 axles works; type rows
(vehicle type, motor type) accept a free label. Enter or blur commits, Escape cancels, empty and
non-numeric input is rejected. No "+" was removed: every row has a plausible custom case.

Also folded in: the vehicle slice of ticket 02. All three sections take a `disabled` prop and wrap
their bodies in `<fieldset disabled>`, which natively disables the pills since they are `<button>`
elements — no edit to the shared `NumberChipSelector` / `IconSelector` was needed. The two Radix
`SelectField`s and the `ComboField` get an explicit `disabled` because they do not inherit it.

Tests: `src/components/report/vehicle/details-section.test.tsx` (new, 6 cases) covers doors/seats
starting at 1, no default owner selection, deselect-to-unknown, custom numeric commit, custom label
commit, and locked-report disabling. `identification-section.test.tsx` now builds its defaults from
`VEHICLE_DEFAULTS` rather than a hand-written literal that had already drifted.

No e2e spec asserted a `0` pill or a `previousOwners` default, so none needed updating; the
API-level fill helpers set `previousOwners: 1` explicitly and keep working.
