# Real Photos QA — Canon EOS Session (Audi A6, Feb 21)

## Scope
End-to-end test of the AI photo pipeline using a real assessor's camera dump.

**Source:** `~/Documents/dev/temp/100CANON` — 817 raw photos from a Canon EOS, organized into 11 distinct vehicle assessment sessions (grouped by file mtime + sequential `IMG_NNNN` ranges).

**Sessions identified:**

| Date       | IMG range            | Count |
|------------|----------------------|-------|
| 2025-12-14 | 0112 → 0335          | 224   |
| 2025-12-22 | 0336 → 0395          | 60    |
| 2025-12-30 | 0396 → 0440          | 45    |
| 2026-01-28 | 0441 → 0491          | 51    |
| 2026-01-31 | 0492 → 0625          | 134   |
| 2026-02-04 | 0626 → 0665          | 40    |
| **2026-02-21** | **0666 → 0701** | **36** ← test session |
| 2026-03-04 | 0702 → 0762          | 61    |
| 2026-03-18 | 0763 → 0818          | 56    |
| 2026-03-19 | 0819 → 0889          | 71    |
| 2026-04-05 | 0890 → 0928          | 39    |

## Test setup
- Picked the smallest complete session (Feb 21, Audi A6 with rear-bumper damage)
- Curated 12 representative photos (registration doc x2, plate close-ups x2, diagonal overview x1, dashboard x1, VIN plate x1, damage close-ups x5)
- Resized to max 1600px / quality 80 (~3 MB total)
- Created `HS` (Liability) report, uploaded photos, triggered AI generation

## AI generation results

**Pipeline performance:** 52 s end-to-end for 12 photos. No errors.

**Classifications (all correct):**
- 2 documents (registration card)
- 3 plate
- 1 vin
- 5 damage
- 1 interior (dashboard)

**Auto-fill summary:** 25 fields, 5 damage markers placed.

### What the AI got right ✅
| Field | Extracted | Ground truth |
|---|---|---|
| VIN | `WAUZZZ4F58N035435` | ✅ matches the doorpost VIN plate (IMG_0680) |
| Main type | `A6` | ✅ |
| KBA type approval | `0588/AAS00050` | ✅ matches registration |
| Power | 171 kW / 233 PS | ✅ Audi A6 3.0 TDI 233 hp variant |
| Displacement | 2967 ccm | ✅ matches registration |
| First registration | 2007-05-07 | ✅ |
| Last registration | 2023-02-16 | ✅ from stamp |
| Vehicle type | sedan | ✅ "Limousine" → sedan |
| Motor type | diesel | ✅ |
| Mileage | 302,929 km | ✅ matches dashboard |
| Damage markers (rear bumper) | 2 of 5 markers correct | ✅ |

### Bugs found 🐛

1. **Manufacturer wrong: extracted as "Volkswagen", should be "Audi".**
   The VIN starts `WAUZZZ` (Audi prefix), the registration document literally says `AUDI`, and the Audi rings are visible on the trunk plate — yet the manufacturer field came back as Volkswagen. NHTSA returned low confidence and the fallback AI VIN decode also got it wrong. Worth investigating the VIN-decode heuristic / prompt.

2. **License plate parsed as "FÜ U B" (should be "FÜ BP 147").**
   Plate is clearly visible in IMG_0670 / 0672 / 0675. The OCR likely truncated after the initial city code.

3. **Damage hallucination (3 of 5 markers):**
   The photos only show rear bumper damage with green paint transfer. The AI fabricated:
   - "Vordere linke Tür/Schweller" — front-left door (no such photo)
   - "Motorhaube - Kratzer und Algenbefall" — hood with algae growth (no hood photo)
   - "Right side door/panel - paint damage" — no side door photo

   Only the two rear-bumper markers correspond to real input photos. The classifier got "damage" right, but the localizer/comment generator invented locations not represented in the input set.

4. **Mixed languages in damage comments.**
   Markers are randomly German or English (e.g., #1 in German, #2 in English, #3 in German, #4 in English, #5 in German). The locale should drive a consistent output language.

5. **`specialFeatures` is wrong content type.**
   AI filled this with dashboard display features ("analog speedometer, analog tachometer, digital odometer display…") rather than vehicle equipment ("Klimaanlage, Navi, Sitzheizung"). The dashboard photo (IMG_0678) is being analyzed for features instead of vehicle equipment.

6. **`interiorCondition` stored as raw English value `"good"`** instead of a localized value. In the German PDF this prints as the English word "good".

7. **Claimant data missing.**
   The Zulassungsbescheinigung clearly shows owner name (`BOZIC LJILJANA`), street (`GALLASSTRASSE 43`), city (`90768 FÜRTH`). These were not extracted into Claimant Info even though the document classification picked the registration card up correctly.

### Render bugs in the German PDF 🐛

8. **Untranslated labels in PDF.**
   "Last Registration" appears in English in an otherwise-German PDF (should be "Letzte Zulassung"). Photo Documentation section headers are in English: "Damage Photos (5)", "Interior Photos (1)", "Documents (6)". `t.lastRegistration` and the photo-section headers need translation keys.

9. **Damage marker page break is awkward.**
   Markers #1–#3 render on page 1 with their text. "#4" and "#5" labels sit alone after the page break, then their text bodies render on page 2. The marker block should keep label + body together (avoid orphan/widow on page break).

10. **Allgemeinzustand renders empty.**
    Label is shown but value is blank. The AI didn't fill `generalCondition`, but the row should hide instead of showing an empty value.

11. **Documents section is empty in the PDF.**
    Title says `Documents (6)` (also wrong count — only 2 doc photos uploaded; classifier seems to have mis-classified plate or interior shots into the document bucket) but no thumbnails or captions render under it.

## Verdict
The pipeline is solid: classification is accurate, photos process fast, the registration document yields highly reliable structured data, and PDF generation works in both locales.

The two highest-impact issues to fix are: (1) the manufacturer mis-decode for Audi VINs and (2) damage-marker hallucination — markers should be tied 1:1 to actual damage photos rather than generated freely. Mixed-language output and the missing translation keys are smaller polish items.

## Artifacts
- Generated PDF: `.playwright-mcp/canon-test-de.pdf` (2.6 MB)
- Test report ID: `baa826cc-9adf-43a5-98ed-cb9e8b7b969e`
