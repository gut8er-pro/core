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

## Reopened — grilling 2026-10-04

Status: ready-for-human (waiting on the client's Teil I photo; everything else done)

The Resolution above fixed how the document is *read*, but not which source *wins*.
`mergeVehicleData` (`src/lib/ai/vehicle-lookup.ts`) prefers the VIN lookup for every technical
spec, and for a European VIN that lookup is `lookupViaAiDecode` — a model guessing specs from
17 characters. 1482 cm³ is the displacement of Kia's 1.5 T-GDi, not a misread of the 1.6 CRDi's
1582: the demo values were almost certainly a VIN guess beating a correctly read document.

Vocabulary: see *Vehicle data from Generate* in `CONTEXT.md` — Generate writes **extracted
values** only, never **assumed values**.

### Decisions

1. **The registration document wins** for every box it prints. No other source may replace a
   document value.
2. **No VIN spec decoding.** Remove `lookupViaAiDecode` and `lookupViaNhtsa` from the Generate
   path. The VIN contributes itself and the manufacturer from the local WMI table, nothing more.
   kW, cm³, seats, doors, fuel, body type, cylinders, engine design and transmission come from
   the document or stay empty. Anything only DAT could supply is out of scope until DAT access
   exists (see *Context: why the VIN cannot give specs* below).
   The local WMI table (`WMI_MANUFACTURER_MAP`, 26 codes, all European brands) has no Kia,
   Hyundai, Toyota, Renault, Peugeot, Tesla etc., so the demo car would get no manufacturer from
   its VIN — **expand it to the brands sold in Germany** (static ISO 3779 WMI list, no inference).
3. **Nächste HU:** when both the document and the HU-Plakette yield a date, the later one wins
   (replaces "document first" in `findNextMot`).
4. **Letzte Zulassung = box I** — confirmed, no change.
5. **Photo fallbacks:** keep the manufacturer-from-overview fallback (a badge is read). Remove the
   body-type-from-overview fallback (`generate/route.ts`, "Enrich vehicleType … from overview
   photos") — body style from a silhouette is an assumed value. Colour, condition, damage,
   odometer and plate reads from photos stay.
6. **Values already saved stay.** The never-overwrite guard cannot tell an earlier Generate's
   value from the assessor's; the assessor clears the field and re-runs. Value provenance
   (AI vs user per column) is a possible later ticket, not this one.
7. **Say what was left empty.** The Generate summary gains a line naming the vehicle fields no
   source stated (e.g. "Nicht im Fahrzeugschein: kW, Hubraum — bitte eintragen"), via
   `de.json`/`en.json`.

### Context: why the VIN cannot give specs

Only positions 1–3 (WMI → manufacturer) of a VIN have a public, fixed meaning. Positions 4–9
encode model, body and engine in each manufacturer's private scheme; in the EU nobody is obliged
to publish it, and many European VINs (VW's `WVWZZZ…`) do not carry the engine at all. Even where
the engine family is encoded, one family ships in several kW ratings (the 1.6 CRDi in ~81/85/100
kW) — only box P.2 states the registered figure. Position 10 (model year) is optional in the EU.

Turning a VIN into kW / cm³ / body therefore needs a licensed database — for our users, DAT
SilverDAT3's VIN query. We have no DAT access yet: the `Integration` table stores assessors' DAT
credentials but nothing reads them, and `dat-modal.tsx` is a manual labour-rate form. DAT is the
planned future integration; when it lands its answer is an extracted value ranked below the
document. Until then, nothing DAT would supply is filled from any other source.

### Acceptance criteria

- [x] `mergeVehicleData` takes document values over any lookup value; unit test with a lookup
      and an OCR result that disagree on kW and cm³ asserts the OCR values.
- [x] Generate makes no NHTSA or AI-VIN-decode call; with a VIN and no document, only `vin` and
      `manufacturer` (WMI) are written. Pinned in a test.
- [x] `WMI_MANUFACTURER_MAP` covers the brands sold in Germany; tests pin at least `U5Y`/`KNA`
      (Kia), `KMH`/`TMA` (Hyundai), `VF1` (Renault), `VF3` (Peugeot), `5YJ`/`XP7` (Tesla).
- [x] `findNextMot` returns the later of document and plate dates; test covers both orders.
- [x] `vehicleType` is never written from an overview photo; test covers a report with no
      document photo.
- [x] Generate summary lists unfilled vehicle fields, in both locales.
- [x] Bump `promptVersion` for any operation whose output shape or meaning changed, so cached
      rows re-run.
- [ ] **Regression on the real document:** ask the client for the demo KIA Ceed Teil I photo
      (holder block redacted), add it to `testing/testing-images/`, and assert P.2 / P.1 / B / I
      in `src/test/integration/ai-live-validation.integration.test.ts` (gated by
      `AI_LIVE_VALIDATION=1`). Note: the Resolution's claim that this is "a two-line addition to
      `registration-ocr.test.ts`" is wrong — those tests run over synthesised responses and
      cannot read a photo. Ticket closes only when the live assertion passes.

## Resolution 2 — 2026-10-05

### The document wins
`mergeVehicleData` (`src/lib/ai/vehicle-lookup.ts`) now takes every box the document prints
(VIN, manufacturer, model, kW, cm³, seats, fuel, body type, transmission) over the lookup. The
lookup only fills a box the document left empty. Pinned with a lookup saying 117 kW / 1482 cm³
against a document saying 100 kW / 1582 cm³: the document's values win.

### No VIN spec decoding
`lookupViaNhtsa` and `lookupViaAiDecode` are deleted. `lookupVehicleByVin` is now synchronous
and returns `{ source: 'wmi', vin, manufacturer }`, with nothing else. `VehicleLookupResult.source`
is `'wmi' | 'none'`; a DAT VIN query would plug in at the same seam, ranked below the document.
The `lookup` progress step and its three locale keys went with it.
`WMI_MANUFACTURER_MAP` grew from 26 to ~120 static ISO 3779 codes covering the brands sold in
Germany. The required ones are pinned: U5Y/KNA Kia, KMH/TMA Hyundai, VF1, VF3, 5YJ/XP7, plus
JTD and UU1.

### Photo fallbacks
The overview-photo fallbacks moved out of `persistResults` into `buildVehicleData`
(`vehicle-lookup.ts`), which is what the pipeline calls. Only the **make badge → manufacturer**
fallback remains. The body-type fallback is removed (Decision 5). The **model** fallback
(`mainType` ← overview `model`) is removed too: the AC says "with a VIN and no document, only
`vin` and `manufacturer` are written", and a model name from a photo is as often judged from
the shape as read. Pinned: VIN + overview with bodyType/model/make → `{ vin, manufacturer }`.
The report *title* still uses the overview model when nothing else names the car; it is not
a Gutachten field.

### Nächste HU
`findNextMot` returns the later of the document date and the Plakette date. Both orders are
tested in `registration-ocr.test.ts`.

### Unfilled fields named in the summary
`GenerationSummary.missingVehicleFields` lists the `DOCUMENT_VEHICLE_FIELDS` (the
document-printed `VehicleInfo` columns) that this run did not state **and** the report does not
already hold. The route reads the row first, through `filledDocumentFields`, so an incremental
run or a field the assessor typed in is not reported. The list is persisted in
`aiGenerationSummary`. The gallery banner renders it via `MissingVehicleFields`:
"Nicht im Fahrzeugschein: kW, Hubraum — bitte eintragen" /
"Not on the registration document: kW, Displacement — please enter". Tested in both locales.
Summaries persisted before this change have no such key and render nothing.

### promptVersion — no bump
No AI operation's prompt or output shape changed. The AI VIN decode was never a cached
operation, and the overview prompt still returns `bodyType` (it is just no longer written).

### Still open — closes the ticket
- [ ] Get the demo KIA Ceed Teil I photo from the client (holder block redacted), add it to
      `testing/testing-images/`, and assert P.2 / P.1 / B / I in
      `src/test/integration/ai-live-validation.integration.test.ts` (`AI_LIVE_VALIDATION=1`).
      The expected values need to come from that photo; they cannot be written without it.
