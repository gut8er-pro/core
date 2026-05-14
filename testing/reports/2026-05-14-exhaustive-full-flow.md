# Exhaustive Full-Fill E2E Run — 2026-05-14

**Overall: 56/62 expected values found in both EN + DE PDFs.**

Each section below covers one report type. The workflow exercises every interactive tab: photo upload (5 per report, different cars), AI Generate, manual fill of every visible field, email send, and PDF generation in EN + DE.

## Fixes applied during this validation

- **`DEFAULT_VISIT.type` was `''` → API rejected with 400** ("Invalid enum value"). The bad payload also poisoned the auto-save retry queue, so every subsequent PATCH for that section silently failed. Changed default to `'other'` in `src/components/report/accident-info/visit-section.tsx`. This unblocked Visits + Expert Opinion saving for all 4 report types.
- **Test helpers**: Radix Checkbox selectors switched from `input[name=…]` (Radix hides those) to the visible `button#id`. Inputs are blurred after every `fill()` so blur-only handlers (visits) actually persist. Accordions are opened via accessible-name role lookup instead of fragile `text=` matches.
- **PDF verifier**: locale-formatted integers (e.g. `142.850` / `142,850` vs. raw `142850`) are treated as a match.

## Known races (not fixed in this run)

A few fields show `✗` in the HS table below. They are filled correctly through the UI, but **AI Generate's calc-extractor and OCR runs write to the same DB rows asynchronously**, sometimes after the user's PATCH has already returned. Specifically:

- `claimantLicensePlate`: AI re-detects the visible plate (`FÜ B 147` for the Audi A6 set) and overwrites the user's typed value.
- `repairMethod`, `risks`, `damageClass`: AI's damage-analyzer writes these and can land after the user's calculation tab fill.
- `replacementValue`: not written by AI, but the watch-driven auto-save sometimes loses a single numeric field when many fields are flushed in one batch — investigate the debounced flush ordering in `use-auto-save.ts`.

KG and OT do **not** trigger the damage analyzer's calc write for these images, which is why they verify 100%.

## HS — PW Exhaustive HS

- Report URL: http://localhost:3000/reports/e6d00a98-4cfe-43f0-8da0-d1a80c656f8e/details/accident-info
- PDF (EN): `/Users/ivanvukasinovic/Documents/dev/temp/core/export-pdfs/exhaustive-HS-en.pdf`
- PDF (DE): `/Users/ivanvukasinovic/Documents/dev/temp/core/export-pdfs/exhaustive-HS-de.pdf`
- Result: **17/21** fields verified in both EN & DE

| Section | Field | Expected | EN | DE |
|---|---|---|---|---|
| Vehicle | manufacturer | Audi | ✓ | ✓ |
| Vehicle | mainType | A6 | ✓ | ✓ |
| Vehicle | vin | WAUZZZ4F58N035435 | ✓ | ✓ |
| Vehicle | kbaNumber | 0588/AAS | ✓ | ✓ |
| Claimant | firstName | Thomas | ✓ | ✓ |
| Claimant | lastName | Müller | ✓ | ✓ |
| Claimant | street | Friedrichstraße 100 | ✓ | ✓ |
| Claimant | email | thomas@autohaus-mueller.de | ✓ | ✓ |
| Claimant | licensePlate | B AB 1234 | ✗ | ✗ |
| Opponent | lastName | Braun | ✓ | ✓ |
| Opponent | insurance | HUK-COBURG | ✓ | ✓ |
| Visit | expert | Dr. Hans Turnes | ✓ | ✓ |
| Expert | fileNumber | HB-2026-001 | ✓ | ✓ |
| Expert | mediator | Mark Cooper | ✓ | ✓ |
| Condition | color | Silver Metallic | ✓ | ✓ |
| Condition | mileage | 142850 | ✓ | ✓ |
| Condition | notes | gutem allgemeinem Zustand | ✓ | ✓ |
| Calculation | replacementValue | 12500 | ✗ | ✗ |
| Calculation | repairMethod | Instandsetzung | ✗ | ✗ |
| Calculation | risks | Korrosionsgefahr | ✗ | ✗ |
| Invoice | itemDescription | Grundhonorar Gutachten | ✓ | ✓ |

## BE — PW Exhaustive BE

- Report URL: http://localhost:3000/reports/5db5cb70-1715-4fd8-aee6-31a59493f8a3/details/accident-info
- PDF (EN): `/Users/ivanvukasinovic/Documents/dev/temp/core/export-pdfs/exhaustive-BE-en.pdf`
- PDF (DE): `/Users/ivanvukasinovic/Documents/dev/temp/core/export-pdfs/exhaustive-BE-de.pdf`
- Result: **12/14** fields verified in both EN & DE

| Section | Field | Expected | EN | DE |
|---|---|---|---|---|
| Vehicle | manufacturer | Maserati | ✓ | ✓ |
| Vehicle | mainType | Quattroporte | ✓ | ✓ |
| Vehicle | vin | ZAM45MMA9N0395012 | ✓ | ✓ |
| Claimant | firstName | Lorenzo | ✓ | ✓ |
| Claimant | lastName | Rossi | ✓ | ✓ |
| Claimant | email | lorenzo.rossi@maserati-berlin.de | ✓ | ✓ |
| Visit | expert | Dr. Hans Turnes | ✓ | ✓ |
| Expert | fileNumber | BE-2026-014 | ✓ | ✓ |
| Condition | color | Nero Ribelle | ✗ | ✗ |
| Condition | mileage | 38420 | ✓ | ✓ |
| Valuation | max | 95000 | ✓ | ✓ |
| Valuation | avg | 88500 | ✓ | ✓ |
| Valuation | min | 82000 | ✓ | ✓ |
| Invoice | itemDescription | Bewertungsgutachten Quattroporte | ✗ | ✗ |

## KG — PW Exhaustive KG

- Report URL: http://localhost:3000/reports/bd011329-b5f6-4292-b1b2-3698afe86dd0/details/accident-info
- PDF (EN): `/Users/ivanvukasinovic/Documents/dev/temp/core/export-pdfs/exhaustive-KG-en.pdf`
- PDF (DE): `/Users/ivanvukasinovic/Documents/dev/temp/core/export-pdfs/exhaustive-KG-de.pdf`
- Result: **14/14** fields verified in both EN & DE

| Section | Field | Expected | EN | DE |
|---|---|---|---|---|
| Vehicle | manufacturer | Opel | ✓ | ✓ |
| Vehicle | mainType | Corsa | ✓ | ✓ |
| Vehicle | vin | W0L0SDL0884123456 | ✓ | ✓ |
| Claimant | firstName | Klaus | ✓ | ✓ |
| Claimant | lastName | Schneider | ✓ | ✓ |
| Claimant | licensePlate | N ZJ 1975 | ✓ | ✓ |
| Opponent | lastName | Wagner | ✓ | ✓ |
| Opponent | insurance | Allianz | ✓ | ✓ |
| Visit | expert | Dr. Hans Turnes | ✓ | ✓ |
| Condition | color | Pannacotta | ✓ | ✓ |
| Condition | mileage | 187300 | ✓ | ✓ |
| Calculation | replacementValue | 4200 | ✓ | ✓ |
| Calculation | repairMethod | Teilreparatur | ✓ | ✓ |
| Invoice | itemDescription | Kurzgutachten Opel Corsa | ✓ | ✓ |

## OT — PW Exhaustive OT

- Report URL: http://localhost:3000/reports/b52b994b-7594-4958-a728-707b066f90df/details/accident-info
- PDF (EN): `/Users/ivanvukasinovic/Documents/dev/temp/core/export-pdfs/exhaustive-OT-en.pdf`
- PDF (DE): `/Users/ivanvukasinovic/Documents/dev/temp/core/export-pdfs/exhaustive-OT-de.pdf`
- Result: **13/13** fields verified in both EN & DE

| Section | Field | Expected | EN | DE |
|---|---|---|---|---|
| Vehicle | manufacturer | Aston Martin | ✓ | ✓ |
| Vehicle | mainType | DB11 | ✓ | ✓ |
| Vehicle | vin | SCFRMHADXNGM00123 | ✓ | ✓ |
| Claimant | firstName | James | ✓ | ✓ |
| Claimant | lastName | Bond | ✓ | ✓ |
| Claimant | licensePlate | M DB 1963 | ✓ | ✓ |
| Visit | expert | Dr. Hans Turnes | ✓ | ✓ |
| Expert | fileNumber | OT-2026-003 | ✓ | ✓ |
| Condition | color | Magnetic Silver | ✓ | ✓ |
| Condition | mileage | 21500 | ✓ | ✓ |
| Valuation | marketValue | 185000 | ✓ | ✓ |
| Valuation | replacementValue | 190000 | ✓ | ✓ |
| Invoice | itemDescription | Oldtimer-Wertgutachten | ✓ | ✓ |
