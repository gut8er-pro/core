# 30 — Export toggles don't shape the PDF; invoice must be its own last page

Status: done
Type: bug
Severity: high

Observed on the call: with only "The Invoice" toggled on, the sent document was the WHOLE
report — the three Export & Send toggles (Vehicle valuation / Commission / The Invoice)
apparently don't drive the PDF content at all. And when everything is selected, the invoice
must render as a SEPARATE page — the last page of the PDF, starting on a fresh page.

## Direction

- Trace the toggle state: composer → send/export request params → PDF template conditionals
  (`src/lib/pdf/`). Find where the chain breaks (state saved to `ExportConfig` but never read?
  params never passed? template ignores them?) and note it here before fixing.
- Semantics to implement: each toggle includes/excludes its section; invoice-only produces an
  invoice-only document; the invoice section always begins on a new page and sits last
  (`@react-pdf` `break` on the invoice page component).
- Preview (ticket 29) must honour the same params — build both on one code path.
- Add a unit test around the template's section selection with the three toggle combinations
  the client will try first: all on, invoice-only, invoice-off.

## Root cause (traced 2026-09-23)

The chain broke in **three** places, which is why "only The Invoice" still mailed the whole
Gutachten:

1. **`includeCommission` had no consumer at all.** It was written to `ExportConfig`, read back
   into the form, and then dropped. `src/lib/pdf/report-template.tsx` only ever looked at
   `includeVehicleValuation` and `includeInvoice`.
2. **The toggles could only ever SUBTRACT two sections.** `VehicleInfoSection`,
   `AccidentInfoSection`, `VisitsSection`, `ConditionSection` and `PhotoGallerySection` were
   rendered unconditionally. Invoice-only was therefore structurally impossible: the most the
   toggles could do was drop the calculation block from a full report.
3. **Nothing travelled with the request.** The send route called
   `generateReportPdfBuffer(id, userId, lang)` with no section argument, and the generator
   re-read `report.exportConfig` from the database. The composer's toggles reach that row only
   through the debounced autosave, so a send that followed a toggle click by less than the
   debounce window rendered the PREVIOUS state. Worse, the generator's fallback for a missing
   row was `{ includeVehicleValuation: false, includeInvoice: true }` — the inverse of the
   form's defaults, so a report whose config row did not exist silently lost its calculation.

The invoice also had no `break`, so it ran on from whatever section preceded it.

## Resolution (2026-09-23)

Status: done.

- **`src/lib/pdf/sections.ts` (new)** — one `PdfSectionSelection` type and the three functions
  that produce it: `sectionsFromToggles` (stored config → selection), `parseSectionsParam`
  (`?sections=` → selection, falling back to the stored toggles when absent or unrecognisable,
  so a typo can never yield an empty Gutachten) and `serializeSections` (selection → param).
  The `report` body flag is DERIVED, not chosen: it is false only when the invoice is the one
  thing selected, because a valuation annex with no vehicle and no parties is not a readable
  document.
- **`report-template.tsx`** — `ReportPdfDocument` takes `sections` and gates every block.
  `commission` maps to the Visits + Expert Opinion block (Auftragserteilung); see the note
  below. The invoice renders last, after the photo pages, with `break` so it always starts a
  fresh page, and takes a `standalone` flag: invoice-only makes it page 1 and gives it the
  business letterhead the report header would otherwise have carried.
- **`generate-buffer.ts`** — `generateReportPdfBuffer(reportId, userId, locale, sections?)`.
  An explicit selection wins over the stored row; the fallback defaults are now `true` across
  the board, matching the form. Invoice-only files download as `<Title>_Invoice.pdf`.
- **`/api/reports/[id]/export` GET** — accepts `sections` and `lang` (`locale` still works, the
  exhaustive verifier uses it) plus `disposition=inline` for preview. The contract the invoice
  agent asked for holds: `?format=pdf&sections=invoice&lang=de` returns an invoice-only PDF.
- **`/api/reports/[id]/send`** — `sections` on the send payload, built by the composer from its
  live toggles, so preview and attachment cannot diverge.

### Interpretive call for Ivan — "Commission"

`includeCommission` has no backing data anywhere in the schema or the UI; it was a toggle over
nothing. Bound to the **Visits + Expert Opinion** block (Auftragserteilung / order placement),
which is the closest thing in the document to "the commission". If the client means a
commission FEE line instead, that is a new column and a new template block — flag it and it is
a small follow-up. The DE label is currently "Provision", which reads as a sales commission and
may itself be the mistranslation.

### Tests

- `src/lib/pdf/sections.test.ts` — 11 tests over the selection algebra, including the
  round-trip and the typo fallback.
- `src/lib/pdf/report-template.test.tsx` — 7 tests asserting which section components the
  document asks for: all-on, invoice-only, invoice-off, valuation-off, commission-off, the
  invoice's position after the photos, and the stored-toggle fallback. Asserted on the element
  tree, not a rendered buffer — rendering 20 photos to learn which sections were selected costs
  seconds per case.
- `10-export.spec.ts` — three PDF-text cases against a real report: invoice-only contains
  "Rechnung" but not "Fahrzeuginformationen"/"Unfallinformationen"/"Fahrzeugzustand"; all-on
  contains both; invoice-off keeps the report and drops "Rechnungsnummer".

Verified on a live 7-page report: pages 1-3 report body, 4-6 photos, **page 7 the invoice
alone**. Invoice-only renders as a single page.
