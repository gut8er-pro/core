# Demo feedback — client call, 2026-09-22

Source: live demo call with the client; Ivan relayed findings as they came (notes screenshot +
eight app screenshots + dictated details). This spec collects them as tickets; nothing here is
implemented yet — capture first, execute later on Ivan's go.

Report used on the call: HS "KIA Ceed - FÜ D 80" — the client exercised upload, AI generate,
annotation, accident info and export.

## Issues

| # | Title | Type | Severity |
|---|-------|------|----------|
| 01 | Drag & drop into a non-empty gallery is broken and can land on a random screen | bug | high |
| 02 | Lock report does not actually prevent editing | bug | high |
| 03 | Annotation editor: save is unreliable, markings vanish | bug | high |
| 04 | Annotation editor rework: draw anchoring, move/edit, per-element delete | feature | high |
| 05 | Lawyer: full contact details + recipient presets on Export & Send | feature | high |
| 06 | Vehicle owner section when claimant is not the owner | feature | medium |
| 07 | IBAN: German validation + live formatting | feature | medium |
| 08 | Photo rotation in the single-photo view | feature | medium |
| 09 | Manual photo reordering | feature | medium |
| 10 | Date picker: native calendar clashes with the app design | design | medium |
| 11 | "Empfohlene Fotos" panel text layout broken | bug | low |
| 12 | License plate input auto-uppercase | polish | low |
| 13 | Visits: address presets from the claimant per visit type | feature | medium |
| 14 | Registration-document OCR reads the wrong boxes (kW, ccm, EZ) | bug (AI) | high |
| 15 | Source of technical data: two presets + free entry | feature | low |
| 16 | Vehicle Details rows: doors/seats from 1, no previous-owners default, dead "+" pills | bug + polish | medium |
| 17 | Vehicle Condition: every dropdown also accepts manual entry | feature | medium |
| 18 | Mileage input: German thousands separators as you type | polish | low |
| 19 | Schadstoffplakette: selectable + official sticker look (label is mistranslated) | bug + design | medium |
| 20 | Tires: "Align Axes" and "Match The Set" do nothing | bug | medium |
| 21 | Calculation: missing € prefixes, clipped tax-rate select | polish | low |
| 22 | Data loss on tab switch: calculation, invoice, tire values vanish | bug | high |
| 23 | Correction Calculation: Manual and AI paths don't work | bug | high |
| 24 | Preview Invoice does nothing | bug | high |
| 25 | Invoice carries claimant name + address | feature | medium |
| 26 | Line items: per-unit pricing, four default rows, auto photo count, row delete | feature | high |
| 27 | BVSK fee automatic — research only | research | medium |
| 28 | Payment status lifecycle (pending/completed/delayed) across dashboard + statistics | feature | high |
| 29 | PDF preview/download from Export & Send before sending | feature | high |
| 30 | Export toggles don't shape the PDF; invoice as its own last page | bug | high |
| 31 | PDF photo pages: two per page, larger | design | medium |
| 32 | Resend: recipients vanish, "empty" send still mails out | bug | high |
| 33 | Report number everywhere = file number (Aktenzeichen) | feature | medium |
| 34 | Business Information: website/email/phone editable (no storage today) | bug | medium |
| 35 | Completeness gate demands fields the client considers optional | feature | high |
| 36 | Multi-upload silently drops photos | bug | high |
| 37 | Updating Business Information breaks sending | bug | high |
| 38 | OT Vehicle Grading rework (own tab, auto-grade, no duplicate paint) | feature | medium-high |

## Suggested order of attack

02 (data-integrity claim the client already noticed) → 01 + 03 (bugs in the flow they demo
with) → 14 (AI credibility — read together with audit issues 17/18) → 04 + 05 (the two big
feature asks; 05 has a schema migration) → 06 (schema migration) → 13, 16, 07, 08, 09, 10 →
11, 12, 15.

The client's own meeting-notes PDFs (Haftpflichtschaden_/Kurzgutachten_/Oldtimergutachten_,
read 2026-09-22) are fully reconciled into these tickets. Future-steps noted there for later:
Honorartables (see 27) and automatic Mahnung on delayed invoices (extends 28, not ticketed yet).

Schema changes land in 05 and 06 — both are additive columns, so the auto-migrate deploy path
covers them (`prisma/migrations/README.md`).
