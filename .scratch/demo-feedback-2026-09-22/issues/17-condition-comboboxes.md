# 17 — Vehicle Condition: every dropdown also accepts manual entry

Status: ready-for-agent
Type: feature
Severity: medium

Client on the call: too many closed dropdowns — EVERY select under Vehicle Condition must offer
its predefined options AND free typing ("select box ali i manuelno").

Fields in scope (`src/components/report/condition/condition-section.tsx`): paint type, paint,
paint condition, general condition, body condition, interior condition, driving ability — and
sweep the section for any others (unit stays a pure select, km/mi is a real enum).

## Direction

- Reuse the `ComboField` primitive from ticket 15 (editable input + suggestions dropdown);
  stored values are already plain strings in `VehicleCondition`, so API/zod/PDF are untouched.
- This DISSOLVES most of audit ticket `e2e-production-audit/issues/17` (AI writes values that
  match no select option): with free-entry fields the AI's "Excellent" simply displays as
  entered instead of falling back to a placeholder. Cross-reference both tickets; the remaining
  17-work is only the fields that stay hard enums.
- Completeness treats these as filled when non-empty — no manifest change needed.
- Both locales for the preset labels; the typed value itself is free text and goes into the PDF
  verbatim.

## Resolution

Status: done

All seven Vehicle Condition dropdowns are now the shared `ComboField` — preset options plus
free typing: paint type, paint (`hard`), paint condition, general condition, body condition,
interior condition, driving ability. The unit picker stays a real `SelectField`, since km/miles
is a stored enum (see ticket 39, which removed the bogus third option).

- `condition-section.tsx` gained a local `comboProps` helper. The shared
  `useControlledFieldProps` saves on every `onValueChange`, which is right for a select (one
  change = one decision) but would fire an autosave PATCH per keystroke on a free-typing combo.
  `comboProps` keeps that helper's value/error/missing wiring and moves the save to blur.
- Stored values remain plain strings, so zod, the PATCH mapping and the PDF were untouched.
- Completeness needed no manifest change: `conditionTab()` treats these as plain field rules,
  satisfied by any non-empty string.
- Both locales already carried the preset labels; a typed value goes through verbatim.

Confirms the cross-reference in the ticket: with free entry, an AI-written value that matches
no option now displays as entered instead of falling back to the placeholder.

E2E: `07-condition.spec.ts` selectors moved off positional `[role=combobox]` indexing (the old
Radix trigger and the new input both report that role) onto `input[name="…"]`, and the
persisted-value assertion moved from `toHaveText` to `toHaveValue`. Added a test that a typed
value matching no option round-trips through a reload.
