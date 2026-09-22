# 14 — Registration-document OCR reads the wrong boxes

Status: ready-for-agent
Type: bug (AI quality)
Severity: high

Client verdict on the call: "dosta slaba detekcija" from the Zulassungsbescheinigung / plate
photos. Concretely observed on the KIA Ceed demo report:

- engine power taken from the WRONG box (not the kW field),
- displacement (Kubikatur/ccm) wrong,
- first/last registration date not extracted at all.

## Direction

The German Zulassungsbescheinigung Teil I has lettered/numbered boxes with fixed meanings — the
OCR prompt should name them explicitly instead of asking generically for "power" and
"displacement":

| Feld | Meaning | Our column |
|------|---------|------------|
| P.2 | Nennleistung in kW | `powerKw` |
| P.1 | Hubraum in cm³ | `displacement` |
| B | Datum der Erstzulassung | `firstRegistration` |
| 2.1/2.2 (D.1/D.2) | Hersteller / Typ | manufacturer / mainType |
| E | VIN | `vin` |
| 2.1+2.2 zu 4 | KBA-Nr (HSN/TSN) | `kbaNumber` |

Additionally from the call: **Next MOT (HU) is never extracted** although it is readable from
the registration document AND from the rear plate itself — the German HU-Plakette sticker on
the plate encodes month/year of the next inspection. Add `nextMot` to the document-OCR output,
and teach the plate-detection prompt to read the Plakette (year in the center, month at the
12-o'clock position) when the rear plate photo is sharp enough; null when unsure.

- Update the document-OCR prompt (`src/lib/ai/` — ocr-document operation) to extract BY BOX
  LABEL, return nulls rather than guesses, and bump its `promptVersion` so cached rows re-run.
- Related standing issues: `.scratch/e2e-production-audit/issues/17` (AI values missing select
  options) and `18` (AI overwriting user input) — whoever takes this should read all three; the
  write-site guard from 18 (never overwrite a non-empty user value) applies to these fields too.
- Regression material exists: the audit photos + `testing/testing-images/`; add the client's
  expectation (correct kW/ccm/EZ for a known document) as an assertion where feasible.

## Addendum from the meeting-notes PDFs

- "Fix/Vehicle type wrong" — the detected VEHICLE TYPE was also wrong on the demo car (KIA Ceed
  wagon); include vehicle-type classification in the accuracy pass and in the never-overwrite
  guard.
- The notes confirm: Power (kW) wrong, engine displacement wrong (screenshot showed 1482ccm on
  a 1.6 CRDi), Last registration empty despite being clearly legible on the document photo.
