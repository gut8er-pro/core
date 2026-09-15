# 04 — Mock/placeholder data ships in production

Status: resolved
Type: bug
Severity: high

Several production screens display fabricated data as if it were the user's own. A client opening
Statistics today sees nine invoices that do not exist.

## 1. Statistics invoice history is entirely fake

`src/app/(app)/statistics/page.tsx:29-95` — a `MOCK_INVOICES` constant, carrying its own admission:

```ts
// Mock invoice history — replace with real API when invoice list endpoint exists
const MOCK_INVOICES = [
  { id: 'OT-0214-01', client: 'Marko Jovanović', date: 'Wed, 14.02.2026', amount: 268, … },
  …nine entries, all dated 'Wed, 14.02.2026', all €268…
]
```

Rendered live under "Rechnungsverlauf". The account has three real reports; the table shows nine
invented invoices with invented client names. Filtering/search operates on the mock array.

## 2. KPI change percentages are hardcoded

`statistics/page.tsx:147, 153, 159, 169` pass literal `change={12.5}`, `{8.2}`, `{-3.1}`, `{5.4}`.
The page therefore renders **"0 €" with "↑ +12.5%"** underneath it — a growth figure on a zero
value. These are decorative numbers presented as analytics.

## 3. A dummy person's name is rendered in the report editor

`src/components/report/accident-info/visit-section.tsx:169`

```tsx
<Label htmlFor="present-expert" className="cursor-pointer font-normal">
  Expert Ketn Torres
</Label>
```

Hardcoded, untranslated, and shown in the OT report's Visits → "Anwesend" subsection. It should be
the logged-in expert's name. ("Ketn" is also a typo of "Kent".)

While there, check the two checkboxes beside it — `<Checkbox id="present-expert" />` and
`present-client` are rendered with no `checked`/`onChange` binding, so they may not persist.

## 4. Figma dummy values as placeholders

`src/app/(app)/settings/[[...tab]]/page.tsx:165, 171, 180, 191, 195` hardcode
`"Ketn"`, `"Torres"`, `"Kfz-Sachverständiger"`, `"ketn.torres@example.com"`, `"+49 151 23456789"`.
None go through `t()`; `settings.profile` in `de.json` has no `*Placeholder` keys at all.

Related: the field labelled **"Anrede"** is a free-text input showing the raw enum `mr` instead of
"Herr". Translations for this already exist and go unused
(`report.accidentInfo.salutationOptions.mr = 'Herr'`). Its placeholder — "Kfz-Sachverständiger" —
is a professional qualification, not a salutation. Label, placeholder and value all disagree.

## 5. Statistics metric is mislabelled

"Gesamtgutachten" shows **2** while the dashboard shows **3** reports. `statistics/page.tsx:101-102`
computes it as `completedPayments + pendingPayments + delayedPayments` — that counts *payments*,
not reports. A report with no invoice is invisible to it.

## Fix

Build the invoice-list endpoint the comment anticipates and delete `MOCK_INVOICES`; derive the KPI
deltas from real period-over-period data or remove the indicators until they mean something;
replace the hardcoded expert name with the session user; route all placeholders through `t()`;
render Anrede as a select over the existing salutation options.

## Resolution notes

§3 fixed (2026-09-15) — `visit-section.tsx` now labels the checkbox from `useUserSettings()` via
`visits.presentOptions.expertNamed`, and all three Anwesend boxes are `Controller`-bound to a new
`present` group on the form; no DB column exists for them yet, so they do not survive a reload.

## Resolution (2026-09-15)

§1 `MOCK_INVOICES` deleted; `src/app/api/stats/route.ts` now returns the user's real invoice rows
(number, claimant, date, gross, derived status) and `src/app/(app)/statistics/page.tsx` renders
them through `src/hooks/use-revenue-stats.ts`, with translated empty/not-found/error rows.
§2 the four literal percentages are gone — the route computes 30-day-over-30-day change for
revenue, reports and average value (null when the prior window is empty, in which case no
indicator renders at all) and the completion-rate indicator was removed as underivable.
§4 every placeholder in `src/app/(app)/settings/[[...tab]]/page.tsx` now goes through `t()`, and
Anrede is a `SelectField` over `report.accidentInfo.salutationOptions.*` storing the enum value.
§5 "Gesamtgutachten" reads the new `totalReports` (a `report.count`), not the payment buckets.
§3 was handled separately — see the note above.
