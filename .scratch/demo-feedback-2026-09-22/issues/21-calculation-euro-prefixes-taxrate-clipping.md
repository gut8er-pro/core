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

## Resolution

Status: fixed

### 1. € adornments

Measured the live tab at 1280px: only `replacementValue` and `costPerDay` carried the
`prefix="€"` adornment (`padding-left: 48px`); `residualValue` and `diminutionInValue` had
none (`padding-left: 16px`). Both now get `type="number" prefix="€" step="0.01"`, matching
their siblings. `additionalCosts.*.amount` already had it. The OT section
(`oldtimer-valuation-section.tsx`) states its currency in the label as `… (€)` — a different,
self-consistent treatment, left alone.

### 2. Tax-rate select — the clipping was vertical, not horizontal

Not a text truncation. The wrapper is `sm:w-32` (128px **total**) and `sm:pl-6` eats 24px of
it, leaving the trigger 103px. Measured on the live page:

    trigger width 103px, overflow 0 (text "19%" was NOT truncating)
    label "Choose tax rate" → height 48px = 2 lines
    sibling label "Replacement value" → height 24px = 1 line
    trigger top - replacementValue input top = 24px

So the label wrapped to two lines in the narrow column and pushed the select box a full line
below the input it shares a row with. That shear — a control sitting half a row lower than its
neighbour, against the divider rule — is what reads as "oddly cut off".

Fix: widen the column to `sm:w-52` (208px total → 184px for the trigger), which fits both
`Choose tax rate` and the longer German `Steuersatz wählen` on one line and restores the row
alignment. No change to `select.tsx` — CLAUDE.md forbids restyling a shared primitive for one
screen, so this is a call-site width only.

### Verification note

DOM geometry was measured on the running app before the change (numbers above). The after-fix
screenshot pass at 1280/1440 in DE + EN could **not** be completed: the shared dev server was
intermittently unresponsive (20s timeouts, 8s page loads) under the parallel-agent load this
wave, and the calculation route repeatedly failed to render. The change is a pure Tailwind
width swap on one element; it still wants a visual confirmation once the server is quiet.
