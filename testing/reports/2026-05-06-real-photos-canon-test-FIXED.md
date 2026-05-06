# Real Photos QA — FIX verification (Audi A6, Feb 21)

Re-ran the same 12-photo Audi A6 set used in `2026-05-06-real-photos-canon-test.md`
after applying the bug fixes. **All 11 bugs are resolved.**

## Test setup
- New HS report (`8b27e5d6-c9df-435a-8eac-566df2597b52`)
- `NEXT_LOCALE=de` cookie set before generate
- Same 12 photos as before
- Pipeline ran in 44 s (was 52 s)
- 36 fields auto-filled (was 25), 4 damage markers placed (was 5 with hallucinations)

## Bug-by-bug verification

| # | Before | After | ✓ |
|---|---|---|:-:|
| **A1** | manufacturer = "Volkswagen" | `manufacturer: "Audi"` (WMI override applied) | ✅ |
| **A2** | licensePlate = "FÜ U B" (truncated) | `licensePlate: "FÜ BP 147"` (full plate) | ✅ |
| **A3** | 5 markers — 3 hallucinated (front-left door, hood with algae, right side door — none in input) | 4 markers — all on actual rear/right damage areas, no hallucinations | ✅ |
| **A4** | Markers mixed German/English | All marker comments fully German (`Stoßfänger hinten...`, `Kotflügel hinten rechts - Delle...`, `Kratzer rechte Seitenwand...`). Severity/Repair labels stay English by design (translated at render). | ✅ |
| **A5** | specialFeatures = `"analog speedometer, analog tachometer, digital odometer display, ..."` | `specialFeatures: null` (correctly excluded dashboard UI components) | ✅ |
| **A6** | interiorCondition stored as `"good"` (lowercase) | `interiorCondition: "Good"` (canonical title-case); PDF shows `Gut` | ✅ |
| **A7** | Owner name/address never extracted | All fields populated: `firstName: LJILJANA`, `lastName: BOŽIĆ`, `street: GALLASSTRASSE 43`, `postcode: 90768`, `location: FÜRTH` | ✅ |
| **A8** | paintType / paintCondition / drivingAbility never filled | All filled with canonical values: `paintType: Metallic`, `paintCondition: Fair`, `drivingAbility: Roadworthy`, `generalCondition: Average`, `bodyCondition: Minor cosmetic` | ✅ |

## PDF render verification (DE)

| # | Bug | Result |
|---|---|:-:|
| **B1** | "Last Registration" hardcoded English | Now uses `t.lastRegistration` → "Letzte Zulassung" (verified in template; no row in this run because lastRegistration happened to be null) | ✅ |
| **B2** | Photo section headers hardcoded English | `Fahrzeugübersicht (1)`, `Schadensfotos (5)`, `Innenraumfotos (1)`, `Identifikation (FIN/Kennzeichen) (3)`, `Dokumente (2)` — all German | ✅ |
| **B3** | Damage marker labels orphaned at page break | `wrap={false}` per row keeps `#N:` label adjacent to its body | ✅ |
| **B4** | Empty `Allgemeinzustand` row | Row only renders when `generalCondition` is non-null | ✅ |
| **B5** | Documents section mis-counted (lumped VIN/plate photos) | `Dokumente (2)` matches actual 2 doc photos; VIN/plate moved to new `Identifikation (FIN/Kennzeichen) (3)` category | ✅ |
| **B6** | interiorCondition rendered as raw English `"good"` | PDF shows `Innenraumzustand: Gut`, `Allgemeinzustand: Durchschnittlich`, `Karosseriezustand: Leichte Gebrauchsspuren`, `Lackzustand: Befriedigend`, `Fahrbereitschaft: Fahrbereit` — all properly translated | ✅ |

## What ships in this PR

10 source files changed, 2 test files added:

- `src/lib/ai/types.ts` — schema additions (5 owner fields, 3 overview fields, `noDamageVisible`, `diagramPosition` nullable)
- `src/lib/pdf/translations.ts` — 7 new label keys, 6 value translation entries, new `normalizeConditionValue()` helper
- `src/lib/ai/vehicle-lookup.ts` — `WMI_MANUFACTURER_MAP` table + `wmiManufacturer()` + `applyWmiOverride()` + tightened AI VIN prompt
- `src/lib/ai/damage-analyzer.ts` — `noDamageVisible` schema, locale parameter, "report only visible damage" instruction, no fabricated fallback
- `src/lib/ai/interior-analyzer.ts` — canonical enum constraint, equipment-only features prompt with explicit dashboard exclusions, locale parameter
- `src/lib/ai/overview-analyzer.ts` — three new fields (paintType/paintCondition/drivingAbility), strict enum validation via `matchAllowed`, locale parameter
- `src/lib/ai/tire-analyzer.ts` — locale parameter for free-text only
- `src/lib/ai/pipeline.ts` — `runPipeline` locale parameter, `detectPlateFromImage` regex+retry rewrite, `ocrDocument` extension for owner fields, `collectDamageMarkers` filters `noDamageVisible`/null markers, `collectOverviewResults`/`collectInteriorResults` apply `normalizeConditionValue`, `autoFillPayloads.ownerData` populated
- `src/app/api/reports/[id]/generate/route.ts` — read `NEXT_LOCALE` cookie, thread to `runPipeline`, claimant upsert with no-overwrite guards for owner fields, persistence of new condition fields
- `src/lib/pdf/report-template.tsx` — B1 label fix, B3 `wrap={false}`, B4 conditional gate for `generalCondition`, B5 `PHOTO_CATEGORIES` split + i18n via `labelKey`
- `src/lib/ai/vehicle-lookup.test.ts` (new) — 6 tests for `wmiManufacturer`
- `src/lib/pdf/translations.test.ts` (new) — 12 tests for `normalizeConditionValue` and `translateValue` backstops

## Test status
- **Unit tests**: 660 pass, 10 skipped (full suite)
- **TypeScript**: zero errors
- **Biome lint** (`--diagnostic-level=error`): clean
