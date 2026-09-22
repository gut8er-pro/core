# 21 — Calculation: missing € prefixes and a clipped tax-rate select

Status: ready-for-agent
Type: polish
Severity: low

Two cosmetic items on Value and Repair Calculation:

1. **€ prefix** — "Cost per Day (€)" renders the € inside the input; Replacement value and
   Residual value don't. Add the same currency adornment to both (and sweep the tab for the
   other money inputs: diminution in value, repair cost fields — consistency across the board).
2. **Tax-rate select is oddly cut off** — the "choose tax rate" control still renders clipped
   ("čudno presečen"). The 2026-09-15 pass restyled this exact area
   (`src/components/report/calculation/value-section.tsx` — value field flex + fixed 128px
   select with divider); verify at the client's viewport widths, the select's inner text is
   likely truncating. Screenshot-verify DE + EN at 1280/1440 after the fix.
