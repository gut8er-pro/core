# 18 — AI Generate overwrites values the assessor already typed

Status: ready-for-human
Type: bug
Severity: medium

Documented during the exhaustive E2E runs (see `testing/reports/2026-09-15-exhaustive-full-flow.md`,
"Known races") and reproduced again on the 2026-09-15 local full-stack run: HS verified 16/21
fields in the PDFs while KG/OT verified 100% — every miss traces to one of two races.

## 1. AI writes user-owned fields after the user

The generate pipeline's calc-extractor and OCR write directly to rows the assessor edits:

- `claimantLicensePlate` — the plate OCR re-detects the visible plate from the photos and
  replaces what the assessor typed.
- `vin`, `kbaNumber` — VIN/registration OCR, same pattern.
- `repairMethod`, `risks`, `damageClass` — the damage analyzer's calc write can land after the
  assessor filled the Calculation tab.

AI output should pre-fill, never overwrite: skip the write when the column already holds a
non-empty value (or stage AI values separately and let the UI offer them), instead of last-writer-
wins against the assessor.

## 2. Debounced flush can drop one field in a large batch

`replacementValue` is not AI-written yet intermittently vanished when many fields flush in one
batch — suspicion is the flush ordering in `src/hooks/use-auto-save.ts` (queued-while-saving path).
Needs a focused reproduction; the exhaustive helper now blurs after every fill which masks it in
tests, but a fast human typist hits the same path.

## Resolution

Status: ready-for-human — §1 fixed, §2 belongs to another agent (see below)

### §1 — the never-overwrite guard

`src/lib/ai/write-guard.ts` (new) is the one rule, applied at every pipeline write site instead
of hand-rolled per field:

```
pickFillable(existing, candidates) → the subset of candidates whose column is still empty
```

`isUserOwned` treats `null`, `undefined`, blank/whitespace strings and empty arrays as free, and
everything else as owned — **including `false` and `0`**. A checkbox the assessor cleared and a
count they set to zero are answers, not gaps; re-filling them is the same defect as overwriting a
typed string. Empty candidates are dropped, so a null AI answer never blanks a filled column.

Applied in `src/app/api/reports/[id]/generate/route.ts`, every write site:

| Site | Before | After |
|------|--------|-------|
| `vehicleInfo` | `update: dbData` — clobbered `vin`, `kbaNumber`, `powerKw`, `vehicleType`, dates | `update: pickFillable(existing, dbData)` |
| `claimantInfo` | hand-rolled per-field guard, 30 lines, `licensePlate` + 5 owner fields | one `pickFillable` over the same candidates |
| `vehicleCondition` | `update: conditionUpdateData` — clobbered every condition dropdown, colour, mileage | `pickFillable`, plus `nextMot` |
| `calculation` | `update: calcData` — clobbered `repairMethod`, `risks`, `damageClass`, the three repair enums | `pickFillable` |
| `tire` ×3 | `data: tireData` / `fillData` | `pickFillable(existingTire, …)` |

Two deliberate exceptions, both commented in the route:

- `manualSetup` on `VehicleCondition` — the pipeline's own flag, not an assessor field. It has to
  be set or the diagram will not render the markers the same run is adding.
- `plasticRepair` on `Calculation` — a non-null boolean with a `false` default, so it always reads
  as user-owned on an existing row. It can only be pre-filled at create time. Same shape as
  `Tire.usability`. Making these nullable is a schema change and out of scope here.

Damage markers were already additive (`create`, never `deleteMany`) and stay that way.

### Fields named in the ticket

`claimantLicensePlate`, `vin`, `kbaNumber`, `repairMethod`, `risks`, `damageClass` — all covered,
plus the general rule across every column the pipeline writes, and `vehicleType` as the addendum
to `demo-feedback-2026-09-22/issues/14` asked.

### Evidence

- `src/lib/ai/write-guard.test.ts` — 11 tests, one per case the ticket names, including the
  `false`/`0` rule and the "row does not exist yet" path.
- One live Generate run against the local stack. `claimantLicensePlate`, `vin`, `repairMethod`
  and `damageClass` were pre-seeded with sentinel values, three photos uploaded, Generate run
  once. **All four sentinels came back byte-identical**, while `risks`, `repairTimeDays`,
  `wheelAlignment`, `bodyMeasurements`, `bodyPaint` and `nextMot` were filled from empty. See
  `src/test/integration/ai-live-validation.integration.test.ts` (gated behind
  `AI_LIVE_VALIDATION=1` — it costs real API money and runs exactly one Generate).

### §2 — debounced flush drops a field — NOT DONE

Out of scope for this agent: the suspect is `src/hooks/use-auto-save.ts` (queued-while-saving
flush ordering), owned by the auto-save agent. `replacementValue` is not AI-written, so the guard
cannot affect it either way. Still open.
