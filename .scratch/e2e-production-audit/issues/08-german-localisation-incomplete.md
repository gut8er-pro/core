# 08 — German localisation is incomplete across the app

Status: resolved
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

---

## Added 2026-09-15 — the report email template is hardcoded English

`src/lib/email/send-report.ts` builds the Gutachten email entirely in English, in a German product,
and sends it to the assessor's German client:

- `:59` — `Dear ${recipientName},`
- `:62` — `Please find attached the report: <strong>${reportTitle}</strong>`
- `:80` — `Sent via Gut8erPRO`
- `:37` — `<html lang="en">`

Only the assessor's own composed body is in their language. Everything the app wraps around it is
not.

Note on A3 above: the provider-error leak it refers to is now specified as part of
**issue 01**, which resolved it into a translated two-class failure message rather than a
translation of Resend's prose.

**This collides with issue 01.** Both rewrite `send-report.ts` — 01 restructures the sender, the
return type and the interpolation escaping; this changes the strings inside the same template.
Land 01 first, then translate against the escaped template rather than the current one, or the
escaping work gets reverted by the merge.

The template has no locale available today. The send route knows it — `route.ts:87` already reads
`data.pdfLanguages` to decide which PDFs to attach — so the email locale should follow the same
input rather than gaining a setting of its own.

---

## Resolution (2026-09-15)

Split across two streams. Everything below marked **fixed** landed here; everything marked
**ticket 10's stream** is the same defect in a file the layout work owns and is being fixed
there. Do not close 08 until that stream confirms B1/B2/B3 and the rows named at the end.

### A — server-generated strings — fixed

- **A1.** `src/app/api/reports/[id]/photos/route.ts` answers `{ error: 'max_photos_exceeded',
  limit, message }` at the same 400. `uploadPhoto` raises a `PhotoUploadError` carrying the code,
  and `usePhotoUpload` — the hook the gallery banner reads its string from — puts it into words.
  No gallery component changed: the banner already renders whatever the hook hands it. The hook's
  own two English sentences (file type, file size) went through `t()` at the same time.
- **A2.** Notifications no longer store prose. A row now carries its message key in `title` and
  its parameters JSON-encoded in `description` — `eventType` alone could not carry it, because
  two different routes both write `REPORT_COMPLETED` with different sentences. No migration: the
  two existing columns hold the encoding. `useNotifications` translates at render, so both the
  page and the top-bar dropdown are covered, and a row whose `title` is not a known key keeps its
  stored prose — every row already in the database still reads correctly. The notification
  **email** is rendered from the same catalogue rather than from the stored columns.
- **A3.** Already resolved by issue 01. No change.

### B — legally significant text — ticket 10's stream

B1 (signature modal), B2 (Besteuerung sublabels), B3 (Gruppe A–L) all live in
`src/components/signature/**` and `src/components/report/calculation/**`.

### C — dates and numbers — fixed, except two rows

- Dashboard list dates: `src/components/dashboard/report-list.tsx` had a hardcoded English
  weekday array. Now `Intl.DateTimeFormat(locale, { weekday: 'short', … })` → `Mi., 14.02.2026`.
- Statistics table dates: the weekday had been dropped in today's rewrite; restored, locale-driven.
- Statistics amounts: the table now renders `268,00 €` (two decimals, locale-driven). The KPI
  cards keep their rounded `268 €` — the ticket records that shape as correct.
- Notifications relative time: `formatDistanceToNow` gets `date-fns/locale`'s `de` under the
  German locale → *vor etwa 1 Stunde*. Done once in `useNotifications`, which covers both the
  notifications page and the bell dropdown.
- **Templates dates** and **billing history currency** are in `src/app/(app)/settings/**` —
  ticket 10's stream. (The templates date there already reads `de-DE` + `dd.MM.yyyy`.)
- **Nächste HU/AU** and **mileage** placeholders are in `condition/` and `vehicle/` —
  ticket 10's stream.

### D — untranslated UI strings — accident-info and the dashboard fixed

- Placeholders in `src/components/report/accident-info/**`: `R0S312`, `eg 006312`,
  `eg 0565012` → one `postcodePlaceholder` (`z.B. 10115`); `Street address or po box` /
  `Street address or p.o. box` / `Musterstraße 123` → one `streetPlaceholder`;
  `John Doe Lawyer Firm` and `Mark Cooper` → translated keys.
- `Untitled Report` in the dashboard list is mapped to `dashboard.untitledReport` at render, so
  rows already holding the database default read as German too.
- Both salutation dropdowns (claimant, opponent) rendered without a `value`, so a saved salutation
  never came back after a reload. Both are `Controller`-bound now.
- **Select / Choose / empty dropdown placeholders**, **Motorbauart "Other"**, the five Vehicle
  `e.g.` placeholders, **"Standard View"** and the **photo classification badges** are all in
  `condition/`, `vehicle/`, `calculation/` and `gallery/` — ticket 10's stream.

### E — AI output — fixed

- `calculation-extractor` takes the locale and requires German for `repairMethod` and `risks`;
  both the pipeline and `/calculation/auto-fill` pass it.
- `overview-analyzer` asks for a German `color` (*Hellgrün*), `interior-analyzer` for German
  `features` (*Panoramadach*). Enum values deliberately stay canonical English — the PDF and the
  UI dropdowns translate them at render, and localising them at write time would break that.
- Damage markers: `Severity:` / `Repair:` and the severity value itself are translated as the
  marker comment is built. The comment is stored and rendered verbatim, so it is the only chance.
- The AI progress sub-line ("Classified 16/20 photos…") is emitted from the pipeline in the user's
  language, which fixes the mixed-language panel without touching the gallery component.
- `overview-analysis` and `interior-analysis` prompt versions bumped to 3 — cached v2 rows answer
  in English and would otherwise keep landing in German reports.

### The report email (the section added 2026-09-15) — fixed

Landed on top of issue 01's escaping, not instead of it. `sendReportEmail` takes a locale;
greeting, the attachment line, the footer and `<html lang>` come from the catalogue. The send
route derives it from `data.pdfLanguages`: one language → that language, both → German, so the
recipient gets one covering note rather than a guess.

### Not done, deliberately

- The AI `summary.warnings` strings are still English. Nothing renders them today.
- `wheelAlignment` / `bodyMeasurements` / `bodyPaint` still come back from the model as English
  prose ("Required") where the form expects `required` / `not_required`, so the select stays on
  its placeholder. No English reaches the screen, so it is not this ticket — but it is a live
  auto-fill defect and wants its own.
