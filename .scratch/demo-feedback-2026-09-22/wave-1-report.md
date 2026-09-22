# Wave 1 report — 2026-09-22

Landed in one pass over the demo-feedback tracker. Gates at the end of the wave, all on a
fresh dev server, serial runs: full E2E **188 passed / 2 failed** (both failures are NEW
coverage of a pre-existing gap, listed below — every baseline test passes, zero regressions),
unit **1122/0**, tsc clean, biome clean, locale parity **1164 = 1164, zero drift**.

## Ticket status

| # | Ticket | Status |
|---|--------|--------|
| 01 | Gallery drag & drop broken / stray drop navigates | done |
| 02 | Lock report not enforced (client side) | done — every tab disables when locked; server always refused |
| 03 | Annotation save unreliable, markings vanish | done — 4 root causes |
| 04 | Annotation editor rework (corner anchor, move/edit, per-element delete) | done |
| 05 | Lawyer contact details (Part A) | done — Part B (send presets) in wave 2 |
| 06 | Vehicle owner (Fahrzeughalter) section | done |
| 07 | IBAN validation + live formatting | done — business tab has no IBAN field/column; Ivan to confirm if wanted |
| 12 | License plate auto-uppercase | done (claimant scope; vehicle tab has no plate input) |
| 13 | Visit address presets | done — one-address caveat noted, Ivan to confirm office address model |
| 14 | Registration OCR by box labels + HU-Plakette + vehicle type | done — live-run proven |
| 15 | Source of technical data combobox | done |
| 16 | Vehicle details rows (doors/seats from 1, owners no default, live "+") | done |
| 17 | Condition comboboxes | done |
| 18 | Mileage thousands formatting | done |
| 19 | Schadstoffplakette selector + label fix | done — PDF line is a wave-2 item |
| 20 | Tires align axes / match the set | done (+ fresh-report placeholder set) |
| 21 | € prefixes + tax-rate clipping | done — one visual re-check at 1280/1440 pending |
| 22 | Data loss on tab switch | done systemically (tracked section saves); two NEW tests still red, see below |
| 23 | Correction calculation Manual/AI | done — incl. new correction columns |
| 39 | MKR unit 400 | done |
| 40 | damageDescription had no column | done |
| audit 17 | AI values miss select options | done |
| audit 18 | AI overwrites user input | done — never-overwrite guard, sentinel-proven |
| 27 | BVSK research | findings delivered; go/no-go with Ivan (licensing + repairCostsNet prerequisite) |

## Bonus defects found and fixed during the wave

1. `Number(null) → 0` wrote a false "0 previous owners" ("New") for unset values.
2. ComboField `setValue` without `shouldDirty` — debounced autosave silently skipped the field.
3. Tires: duplicate "First Set" tab and second set created as set 1 again.
4. Annotation confirm dialog unclickable (Fabric upper-canvas z-index above the popup).
5. Cached image left the annotation canvas dead (editor open, Save doing nothing).
6. Calculation write skipped when AI produced only `plasticRepair`.
7. Stale Prisma client in a long-running dev server masquerades as an API regression —
   documented: restart `next dev` after every `prisma generate`.

## Known-red (new tests, carried into wave 2 with owners)

- `21-tab-switch` invoice case — invoice page saves on blur only; needs the `watch()`
  change-subscription the calculation page has. → wave-2 invoice agent.
- `21-tab-switch` tire case — fast-switch during the placeholder/auto-create window. → wave-2
  diagnosis (small).

## New tickets raised during the wave

41 (BE Quick/Detail Valuation buttons dead), 42 (CollapsibleSection unmounts collapsed
children — systemic hazard).

## Decisions waiting on Ivan

1. BVSK auto-fee: licensing contact with BVSK (or per-user fee table); `repairCostsNet` column
   prerequisite (ticket 27 findings).
2. Business IBAN field — wanted or not (ticket 07 note).
3. Claimant second (company) address for the Office visit preset (ticket 13 note).
