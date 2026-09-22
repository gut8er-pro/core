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

## Resolution

Status: done

Mileage read and estimation mileage now format live with dots grouping from the right
(`125450` → `125.450`) and store plain digits.

- New `src/components/report/condition/mileage.ts`: `toMileageDigits` (strip non-digits, drop
  leading zeros, cap at 9 digits so a paste cannot overflow the Int column) and `formatMileage`
  (group from the right). Colocated `mileage.test.ts` covers grouping, idempotency on
  already-formatted input, the leading-zero and cap cases, and empty input — 6 tests.
- Both inputs became `type="text" inputMode="numeric"`, so the spinners are gone. Live
  formatting was kept rather than falling back to format-on-blur: the mask only ever appends
  separators left of the caret, so typing at the end — which is how a mileage is entered —
  leaves the caret correct.
- The form holds digits; the existing `handleFieldBlur` numeric branch still parses to an Int.
- E2E fills keep working: `fill('125000')` is accepted and renders `125.000`. Assertions in
  `07-condition` and `12-hs` now expect the formatted value.
- `11-edge-cases` "numeric field rejects letters" was rewritten: it relied on `type="number"`
  dropping letters, which a text input does not do. The mask does, so the assertion is now an
  exact empty-string check, plus a new test that typing `125450` renders `125.450`.
