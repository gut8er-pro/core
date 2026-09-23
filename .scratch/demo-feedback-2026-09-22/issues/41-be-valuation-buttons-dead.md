# 41 — BE Valuation: Quick/Detail Valuation buttons have no onClick

Status: done
Type: bug
Severity: medium

Found while fixing ticket 23: the two green buttons in `ValuationSection` (BE reports only —
Quick Valuation / Detail Valuation) are plain `<button>` elements with no handler at all. Same
dead-control class as audit 06. They presumably belong to the DAT valuation flow, so wiring
them needs DAT-credential work; until then they must either do something honest (open the DAT
modal / show the "connect DAT first" hint like the correction card now does) or not render.

## Resolution

Status: done

Both buttons now do something in every state — no silent click remains.

- **DAT connected** (an `Integration` row with `provider: 'DAT'` and `isActive`): both buttons
  open the existing `DatModal`. It was already mounted on the calculation page for the
  correction card, so wiring it was passing the same `onOpenDat` the `CorrectionSection`
  already receives. No new modal, no DAT-credential work.
- **DAT not connected**: an inline warning appears above the pair carrying
  `report.calculation.correction.datNotConnected` — the same key and the same warning-border
  treatment as the correction DAT card from ticket 23, so the two read as one behaviour.
- **DAT connected but no way to open the modal** (`onOpenDat` absent, i.e. the section rendered
  outside the calculation page): the new `report.calculation.valuation.needsDatCalculation`
  key says the valuation is read from a SilverDAT3 calculation and that the calculation has to
  run first. The honest hint, rather than a button that shrugs.

`ValuationSection` gained a `ValuationSectionProps` type extending `CalculationSectionProps`
with optional `datConnected` and `onOpenDat`, so the OT/HS call sites are unaffected.

Files: `src/components/report/calculation/valuation-section.tsx`,
`src/app/(app)/reports/[id]/details/calculation/page.tsx` (two props on the BE branch),
`src/messages/{de,en}.json` (one key each, inside `report.calculation.valuation`).

Tests: `src/components/report/calculation/valuation-section.test.tsx`, 6 passing — the modal
opens from each of the two buttons, each button shows the not-connected hint instead of going
silent, the connected-but-unopenable case names the missing calculation, and the hint clears
once DAT becomes available.
