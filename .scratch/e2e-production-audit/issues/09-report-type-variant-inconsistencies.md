# 09 — Report-type variants: headings and one control don't switch correctly

Status: resolved
Type: bug
Severity: low

The conditional *structure* per report type is correct. Two presentation details didn't follow.

## What is correct (verified against CLAUDE.md)

All four types were created on production and their structure checked:

- **BE** (`135dfda2`) — tabs `Unfallübersicht / Fahrzeug / Zustand / `**`Bewertung`**` / Rechnungsdetails`;
  sections limited to Geschädigter, Besichtigungen, Stellungnahme, Unterschriften. No Unfallgegner,
  no Unfallinformationen. ✔ matches spec.
- **OT** (`8c32689e`) — tab **Auftraggeberinformationen** (not Unfallübersicht), section
  **Auftraggeber** (not Geschädigter), exactly **2** checkboxes, `Zustand 0/5` (one section more
  than HS), valuation = Marktwert + Wiederbeschaffungswert + Restaurierungswert + Gesamtkosten.
  ✔ matches spec.
- **HS** (`1a65cb53`) and **KG** (`cfaad8cb`) — standard structure.

## Defect 1 — section heading doesn't switch with the tab

On **BE** the tab reads **"Bewertung"** but the card heading underneath still reads
**"Wert- und Reparaturkalkulation"**. A Bewertung has no repair calculation, so the heading is
wrong for the type.

On **OT** the same mismatch in the other direction: tab "Bewertung", heading "Fahrzeugwert".

The tab label is already report-type aware; the heading is not. Drive both from the same source.

## Defect 2 — "Restaurierungswert" is rendered as a primary button, not a value field

OT → Bewertung. Measured on the live page:

```
tag: BUTTON, text: "Restaurierungswert", 818×40,
background: rgb(1, 148, 71)  // --color-primary
color: rgb(255, 255, 255), cursor: pointer
```

It sits directly beneath **Marktwert (€)** and **Wiederbeschaffungswert (€)**, which are both
`<input>` fields. The spec lists Restoration Value as one of the four OT values, so this should be
an input like its siblings. As a full-width solid-green CTA it reads as an action, and it is the
loudest element on the tab.

## Also worth a look

- The "Anwesend" checkboxes in the OT Visits subsection (`visit-section.tsx:166-178`) are rendered
  without `checked`/`onChange` bindings — see issue 04.
- The BE tab is still called "Unfallübersicht" even though every accident-related section is
  removed for that type. Not in the spec as a rename, but worth a decision: a valuation report
  with an "accident overview" tab containing no accident fields is confusing.

## Resolution (2026-09-15)

Defect 1 — `src/components/report/calculation/heading.ts` (new) holds the one report-type → key
mapping the tab label already used; `src/app/(app)/reports/[id]/details/calculation/page.tsx:181`
now reads `t(calculationHeadingKey(toReportType(reportType)))`, so BE and OT head the card
"Bewertung" exactly as their tab does. `calculation.vehicleValueOt` is now unused (left in place).

Defect 2 — `src/components/report/calculation/oldtimer-valuation-section.tsx`: `restorationValue`
is a `TextField` in the same grid as Marktwert/Wiederbeschaffungswert, saving through the same
`fieldProps` → `handleFieldBlur` → `calculation.restorationValue` path. The green CTA became an
outline "Zusätzlichen Wert hinzufügen" button that reveals only `baseVehicleValue`.

"Also worth a look" — the Anwesend checkboxes are now bound; see issue 04's resolution notes.
