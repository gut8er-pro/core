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
