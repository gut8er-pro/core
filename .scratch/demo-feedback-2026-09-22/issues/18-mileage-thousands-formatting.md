# 18 — Mileage input: German thousands separators as you type

Status: ready-for-agent
Type: polish
Severity: low

Mileage fields should format live with dots grouping every three digits FROM THE RIGHT
(`125450` → `125.450`), the way every German number reads.

## Direction

- Applies to mileage read + estimation mileage on Condition
  (`src/components/report/condition/condition-section.tsx`) and any other km input (vehicle
  section, calculation cost fields are € and already formatted elsewhere — check while there).
- Input keeps a numeric value for storage (strip separators on change, format on render);
  caret handling on mid-string edits is the only tricky part — format-on-blur is the acceptable
  fallback if live formatting fights the caret, but try live first.
- The current inputs are `type="number"` with spinner arrows (screenshot shows `21177` with
  steppers) — they must become text inputs with `inputMode="numeric"`, since number inputs
  cannot hold separators; drop the spinners, nobody steps mileage by one.
- E2E fills use plain digits — keep accepting unformatted paste/typing.
