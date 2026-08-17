# Open the PDF view-model seam + one formatting module

**Status:** needs-triage
**Next step:** `/grilling` on this file to design the `buildReportView` / `loadReport` / `render` split.
**Strength:** Worth exploring · **Dependency category:** in-process (inject Prisma at `loadReport`)

## Problem

`generateReportPdfBuffer` **welds** fetch + a 215-line hand map + render into one un-injectable function, so the biggest, most bug-prone part — the DB→view-model mapping — cannot be tested without a database. There are **zero** PDF tests beyond the translation lookup. Locale rides along: dates and currency are hardcoded `de-DE`, so EN PDFs still print German dates; `formatDate` exists in **triplicate**.

Note: `ReportPdfDocument` itself is already a **deep** component (props in → JSX out) — the friction is the welding around it, not the renderer.

## Evidence (file:line)

The welded function (`src/lib/pdf/generate-buffer.ts:10-293`):

- Dependency newed up inline: imports `prisma` directly (`:2`) and calls `prisma.report.findFirst` with a ~50-line `include` tree (`:15-65`). No injection point.
- View-model build inline: ~215 lines of hand field-copying into `ReportData` (`:76-289`).
- Render inline: `getPdfTranslations` (`:292`) then `renderToBuffer(ReportPdfDocument({...}))` (`:293`).
- Consequence: the `ReportData` view model cannot be obtained without hitting the DB; `renderToBuffer` emits a real PDF binary, so there's nothing to assert on short of parsing a PDF.
- Default-locale mismatch across the seam: `generate-buffer.ts:291` defaults `locale ?? 'en'`, but both callers default `'de'` (export route `:21`, send route).

Locale honored for strings, hardcoded for dates/currency:

- `report-template.tsx` `formatDate` hardcodes `'de-DE'` (`:439`), `formatCurrency` `'de-DE'/'EUR'` (`:448`), `formatNumber` `'de-DE'` (`:456`), `FooterSection` date `'de-DE'` (`:1247`).
- `locale` is passed to only 3 of 8 sections (`VehicleInfoSection:515`, `ConditionSection:664`, `VisitsSection:1016`); **not** to Calculation / Header / AccidentInfo / Invoice / Footer.
- `formatDate` triplicated with divergent locales: `report-template.tsx:435` (`de-DE`), inline in `FooterSection:1247` (`de-DE`), settings `page.tsx:718` (`de-DE`) — while `TemplatesSection:1012` uses `'en-GB'`.

The value-translation trio (small interface, wide contract) — `src/lib/pdf/translations.ts`:

- Label table `translations` + `getPdfTranslations` (`:133-394`) is deep/good.
- But `valueTranslations` (`:400-463`), `valueLabelsEn` (`:472-490`), `translateValue` (`:492-496`), `conditionAliasMap` + `normalizeConditionValue` (`:506-537`) duplicate the **same canonical keys** across three hand-synced maps.
- **Upstream leak**: `pipeline.ts:3` imports `normalizeConditionValue` from the PDF layer and applies it in `collectOverviewResults` (`:803-807`) / `collectInteriorResults` (`:821`) — a renderer concern leaking into AI aggregation.

Only test: `translations.test.ts` (94 L) exercises `normalizeConditionValue` + `translateValue`. No test imports `report-template`, `generate-buffer`, `ReportPdfDocument`, or `generateReportPdfBuffer`.

## Why it's shallow / deletion test

`generateReportPdfBuffer` is a **fat** function, not a thin passthrough — but it destroys testability by welding fetch + map + render with no injection and no exposed view model. Deleting the weld and exposing `buildReportView` concentrates the mapping (the real bug surface) behind a pure, assertable interface.

## Deepening target (to be finalized in grilling)

Split into three modules with one exposed seam:

1. `loadReport(db, id, userId)` — injected Prisma, returns the raw row.
2. `buildReportView(row): ReportView` — **pure**, testable, assertable (the 215-line map lives here).
3. `render(view) → buffer` — the existing deep `ReportPdfDocument`.

Plus **one locale-aware formatting module** (`formatDate/Currency/Number(value, locale)`) that all three `formatDate` copies collapse into, and that actually honors `locale`. Give it a home for `normalizeConditionValue` / `translateValue` so the PDF-enum contract stops leaking into `pipeline.ts`.

Open grilling questions:
- Does `ReportView` ask [01](../01-report-type-policy/spec.md)'s `reportTypePolicy` for its per-type shape instead of re-deriving `isBE/isOT`?
- Resolve the default-locale mismatch (library `'en'` vs routes `'de'`) — pick one default.
- Thread `locale` to all 8 sections, or bake formatting into the view model so sections don't each need it?

## Wins

- View-model mapping testable without a DB.
- Locale honored for dates + currency (fixes German-date-on-EN-PDF).
- Delete two duplicate `formatDate`.
- Assert on the view, not a PDF binary.
- Homes the enum-normalization that currently leaks upstream into AI.

## Related

Consumes [01-report-type-policy](../01-report-type-policy/spec.md) (do 01 first). Homes the enum leak noted in [02](../02-pipeline-result-seam/spec.md)/[03](../03-cached-vision-operation/spec.md).
