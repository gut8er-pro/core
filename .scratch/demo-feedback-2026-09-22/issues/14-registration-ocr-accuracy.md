# 14 — Registration-document OCR reads the wrong boxes

Status: ready-for-human
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

## Resolution

Status: ready-for-human

### Document OCR now reads by box label

`ocrDocument` in `src/lib/ai/pipeline.ts` asked generically for "power" and "displacement"; the
model picked whichever nearby number looked plausible. The prompt (`OCR_DOCUMENT_PROMPT`) now
names every box and states that an empty value is correct while a guessed one is a defect:

| Box | Meaning | Column |
|-----|---------|--------|
| B | Datum der Erstzulassung | `firstRegistration` |
| I | Zulassung auf aktuellen Halter | `lastRegistration` |
| D.1 / 2.1 | Hersteller | `manufacturer` |
| D.2 / 2.2 | Typ / Handelsbezeichnung | `mainType` |
| E | Fahrzeug-Identifizierungsnummer | `vin` |
| P.1 | Hubraum cm³ | `engineDisplacementCcm` |
| P.2 | Nennleistung kW | `powerKw` |
| P.3 | Kraftstoffart | `motorType` |
| S.1 | Sitzplätze | `seats` |
| R | Farbe | `color` |
| J / 4 / zu 2 | Fahrzeug-/Aufbauart | `vehicleType` |
| zu 2.1 + zu 2.2 | HSN + TSN | `kbaNumber` |
| C.1.1–C.1.3 | Halter block | claimant first/last/street/postcode/city |

The prompt explicitly forbids reading P.4 (Nenndrehzahl) as the kW value — the most likely source
of the wrong power figure on the demo car — and forbids copying one box into another.

### Parsing hardened so a bad read cannot reach a column

New exported helpers in `pipeline.ts`, all unit-tested in `src/lib/ai/registration-ocr.test.ts`:

- `digitsOnly` — strips the unit the model keeps anyway ("94 kW" → "94", "1.582 cm³" → "1582")
  and returns `''` for a narrated box ("nicht lesbar"), which previously parsed to `NaN`.
- `normalizeOcrDate` — accepts ISO and the German forms (DD.MM.YYYY, MM/YYYY, YYYY-MM), drops
  anything else. Previously a malformed string became an Invalid Date on `VehicleInfo`.
- `normalizeKbaNumber` — enforces HSN (4 digits) + TSN (3 alphanumerics), formatted `8253/AKL`.
  An unreadable box used to store the plain Fahrzeugklasse.
- VIN is re-validated against the 17-character pattern instead of being taken verbatim.

### Vehicle type

Two fixes. The prompt now constrains `vehicleType` to the seven option values in
`src/components/report/vehicle/details-section.tsx` with an explicit German→option mapping, and
says not to guess the body style from a photo of the car when the document does not state it.

Second, and this was the actual demo defect: `normalizeVehicleType` in
`src/lib/ai/vehicle-lookup.ts` iterated its synonym map in insertion order for the substring
fallback, so **"Kombilimousine" matched `limousine` → sedan before `kombi` → wagon**. The demo
KIA Ceed is a wagon. The fallback now sorts keys longest-first, and the map gained the German
compounds (kombilimousine, caravan, variant, avant, touring, sportstourer, sportswagon,
kleinwagen, schrägheck(limousine), geländewagen). Pinned in `vehicle-lookup.test.ts`.

### Next MOT (HU) — new

Two independent sources, document first (a printed date beats a sticker read at an angle):

1. `nextMot` added to `OcrExtractionResult`, read from "Nächste HU" on the document.
2. The plate pass now returns JSON `{plate, nextMot}` and the prompt teaches the HU-Plakette:
   two-digit year in the centre, month at the 12-o'clock position, `""` for a front plate, a
   missing sticker or anything not sharp enough. `parsePlateResponse` still accepts a bare-string
   answer so cached v2 rows and conversational replies keep working.

`findNextMot` picks document over plate; the generate route writes it to
`VehicleCondition.nextMot` (existing column, no migration).

### Prompt versions bumped

`ocr-document` 2→3, `detect-plate` 2→3, `interior-analysis` 3→4 (see audit issue 17). The
`AiResult` cache keys on `promptVersion`, so every row read from the wrong boxes re-runs.

### Live evidence

One Generate run against the local stack (report `27de492d`, photos car1/car2/car4). `car4.png`
is a German rear plate carrying an HU-Plakette: **`VehicleCondition.nextMot = 2025-12-01`** — a
field that was never extracted before. See `src/test/integration/ai-live-validation.integration.test.ts`
(gated behind `AI_LIVE_VALIDATION=1`; it costs real API money, so it does not run by default).

### Not done

No regression assertion against a known Zulassungsbescheinigung: `testing/testing-images/` has no
registration-document photo (5 files, all vehicle/plate shots). The box-label mapping is covered
by unit tests over synthesised model responses instead. **Drop a real Teil I photo into
`testing/testing-images/` and the assertion becomes a two-line addition to
`registration-ocr.test.ts`.**
