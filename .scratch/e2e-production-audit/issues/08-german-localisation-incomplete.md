# 08 — German localisation is incomplete across the app

Status: ready-for-agent
Type: bug
Severity: medium

German is the default and the only locale the client will use. English strings leak into nearly
every screen, including a legally binding consent dialog and a tax control. Collected in one
ticket because the fixes share a root cause: strings that never went through `next-intl`.

---

## A. Server-generated strings are hardcoded English and reach the user

**A1 — API error messages are rendered verbatim.**
`src/app/api/reports/[id]/photos/route.ts:56` returns
`` `Maximum ${MAX_PHOTOS_PER_REPORT} photos per report` ``. The client paints that raw string into a
styled error banner. Uploading a 21st photo shows a German user:

> IMG_0407.JPG: Maximum 20 photos per report

Every API error bypasses i18n this way. Return error *codes* and translate client-side.

**A2 — Notifications are written to the database in English.**
`src/app/api/reports/[id]/invoice/route.ts:123-124`

```ts
title: 'Invoice Generated',
description: `Invoice ${data.invoice.invoiceNumber} has been generated.`,
```

The `notifications` namespace in `de.json` has only chrome strings (title, markAllAsRead, …) and
no message templates, so these are permanently English — including for rows already stored. Store
a type + params and translate at render.

**A3 — The provider error on send** (issue 01) is the same pattern.

---

## B. Legally significant text in the wrong language

**B1 — Signature modal.** The consent dialog mixes languages: **"Draw Signature"**,
**"Upload Signature"**, **"Clear"** and **"By signing, you confirm the accuracy of the information
provided."** are English, sitting directly above the German sentence *"Mit der elektronischen
Unterschrift dieses Dokuments erkläre ich mich damit einverstanden…"*. A German assessor is being
asked to agree to an English declaration.

**B2 — Besteuerung control.** `src/components/report/calculation/valuation-section.tsx:18-20`

```ts
{ value: '0',   label: '0%',   sublabel: 'Natural' },
{ value: '2.4', label: '2.4%', sublabel: 'Difference' },
{ value: '19',  label: '19%',  sublabel: 'Standard rate' },
```

Hardcoded, never translated. These are German tax concepts (Regelbesteuerung /
Differenzbesteuerung) presented in English in a control that changes the money.

**B3 — Nutzungsausfall groups** render as **"Group A" … "Group L"**. German loss-of-use groups
should be "Gruppe A"…

---

## C. Dates and numbers are not localised

| Where | Shows | Should be |
|---|---|---|
| Dashboard + Statistics tables | `Wed, 14.02.2026`, `Mon, 14.09.2026`, `Sat` | `Mi., 14.02.2026` |
| Notifications | `about 1 month ago` | `vor etwa einem Monat` |
| Templates | `05/07/2026`, `14/09/2026` | `05.07.2026` |
| Condition → Nächste HU/AU placeholder | `MM/YY/YY` | malformed — should be `TT.MM.JJJJ` |
| Statistics table | `€268`, `-€268` | `268,00 €` |
| Billing history | `€69.00` | `69,00 €` |
| Mileage placeholder | `e.g. 125,450 km` | `z.B. 125.450 km` (US thousands separator) |

**Relative time root cause:** `src/app/(app)/notifications/page.tsx:99` calls
`formatDistanceToNow(...)` with **no `locale` option**, and there is no `date-fns/locale` import
anywhere in `src/`. Import `de` and pass it.

The KPI cards do use `0 €` correctly — so the currency formatting is inconsistent *within* the app,
not uniformly wrong.

---

## D. Untranslated UI strings

**Dropdown placeholders — three different variants, one of them empty:**

- `"Select"` — Condition → Lack; Vehicle → Motorbauart, Getriebe
- `"Choose"` — Calculation → Ausfallgruppe, Mietwagenklasse
- **empty** — Condition → Innenraumzustand renders with no value *and* no placeholder, so it looks
  broken next to its siblings

**Mixed-language option lists:** Motorbauart offers `Reihe / V-Motor / Boxer / Wankel / `**`Other`**.

**Placeholders using English "e.g." instead of "z.B."** — five on the Vehicle tab alone:
`e.g. WVWZZZ3CZWE123456`, `e.g. Volkswagen AG`, `e.g. Golf VII`, `e.g. Golf VII 2.0 TDI`,
`e.g. 0603 / BGH`.

**Visits section placeholders:** `"Street address or po box"`, `"eg 006312"` — English, and "eg"
is malformed. `006312` is not a German PLZ (5 digits, e.g. `10115`). The claimant postcode
placeholder has the same problem: `R0S312`.

**Other:** `"Standard View"` above the paint diagram; `"Untitled Report"` in the dashboard list;
photo classification badges render raw enums (`OVERVIEW`, and `damage / interior / tire / plate`).

---

## E. AI output is English inside a German report

The AI auto-fill writes English values straight into German report fields, which then flow to the
PDF:

- Fahrzeugfarbe → `Light Green` (should be *Hellgrün*)
- Sonderausstattung → `panoramic sunroof` (*Panoramadach*)
- Reparaturmethode → `PDR (Paintless Dent Repair)`
- Risiken → `Multiple hail dents visible across hood and po…` (English prose)

Damage markers are German but embed English labels:

> Motorhaube - Hagelschaden | **Severity:** moderate | **Repair:** Ausbeularbeiten nach PDR-Verfahren…

The AI progress panel mixes both in one component: German heading "Fotos werden klassifiziert"
over the English sub-line "Classified 16/20 photos…".

Pass the locale into the AI prompts and require German output, and translate the marker field
labels.

---

## Not a defect (checked)

PDF localisation *is* implemented properly — `src/lib/pdf/translations.ts` carries full `en:` and
`de:` blocks, and both `?locale=de` and `?locale=en` produced valid PDFs.
