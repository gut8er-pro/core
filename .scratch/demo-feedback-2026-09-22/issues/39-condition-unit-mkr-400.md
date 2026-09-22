# 39 — Condition unit option "MKR" fails validation and silently loses the save

Status: ready-for-agent
Type: bug
Severity: medium

Found during the wave-1 pass (condition agent): the unit select in
`condition-section.tsx` offers `km`, `miles` and a third value `MKR`, but
`conditionSchema.unit` is `z.enum(['km','miles'])`. Selecting MKR makes the whole condition
PATCH 400 — and because the batch is rejected, every other field queued in that autosave batch
is silently lost with it.

Fix (assigned into the running condition agent's pass): drop the bogus `MKR` option and add a
unit test pinning the UI's option list to the schema enum so they cannot drift again.

## Resolution

Status: done

`MKR` is gone from the unit picker and from both message catalogues
(`report.condition.unitOptions.mkr` removed in `de.json` and `en.json`). `km` and `miles` stay.

To stop the drift recurring, the option list now has one source of truth: `MILEAGE_UNITS` is
exported from `src/components/report/condition/types.ts`, the picker builds `UNIT_OPTIONS` by
mapping over it, and `conditionSchema.unit` is `z.enum(MILEAGE_UNITS)`. The UI can no longer
offer a value the schema rejects, because both read the same array.

Tests in `src/lib/validations/condition.test.ts`: every unit the picker offers parses, and
`'MKR'` is rejected. The same file also pins `emissionGroup` to `EMISSION_GROUPS` (accepts all
four, accepts `null`, rejects `'5'`).
