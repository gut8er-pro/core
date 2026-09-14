# 03 — Claimant "IBAN" and "Erstes Kennzeichen" write to the wrong database columns

Status: resolved
Type: bug
Severity: critical

A bank account number typed into a field labelled **IBAN** is persisted into the **vehicle make**
column. This affects every report type and flows through to the PDF, the invoice and the email.

## The defect

`src/components/report/accident-info/claimant-section.tsx:102-111`

```tsx
<TextField
  label={t('accidentInfo.iban')}            // renders "IBAN"
  placeholder="123/456/78901"               // …a Steuernummer format
  {...fieldProps('claimantVehicleMake')}    // ← writes to vehicleMake
/>
<TextField
  label={t('accidentInfo.firstNumber')}     // renders "Erstes Kennzeichen (Geschädigter)"
  type="tel"
  placeholder="DE123456780"                 // …a USt-IdNr format
  {...fieldProps('claimantPhone')}          // ← writes to phone
/>
```

Label, placeholder and bound field disagree on **both** fields, three ways each.

The opponent section right next to it gets this right — `opponent-section.tsx:96-98` binds the
same `accidentInfo.iban` label to `opponentIban`. So this reads as a copy-paste slip in the
claimant half only.

## Proven on the live app

On report `1a65cb53-b5a2-44c4-9133-17278bf8936f` I typed `DE89370400440532013000` into the box
labelled **IBAN** and `B XY 4321` into the box labelled **Erstes Kennzeichen**. Reading back
`GET /api/reports/<id>/accident-info`:

```json
"claimantInfo": {
  "phone": "B XY 4321",
  "vehicleMake": "DE89370400440532013000",
  "licensePlate": "N FS 1298"
}
```

`claimantInfo` has **no `iban` column at all**.

## Consequences

1. **Banking data lands in a vehicle field.** An IBAN is personal financial data; storing it in a
   column named `vehicleMake` defeats any data-handling expectation and is a GDPR problem —
   nobody auditing the schema would know bank details live there.
2. **The claimant's phone number cannot be captured.** Its input is consumed by the plate label,
   so there is no field anywhere in the UI for a claimant phone number.
3. **The IBAN cannot be stored at all** — there is no column for it.
4. **`vehicleMake` is corrupted**, and it is a *required* field: `src/lib/completeness/manifest.ts:42`
   lists `claimantVehicleMake` among the completeness rules, so users are *forced* to fill the
   mislabelled box before they can send.
5. Whatever is in these columns is rendered into the PDF and the invoice.

## Scope

Verified on **HS** and re-verified on **OT**; BE and KG share the same component, so all four
report types are affected.

On OT it is worse still: the label reads "Erstes Kennzeichen **(Geschädigter)**" — "claimant" —
on an Oldtimer valuation that has no accident and no claimant. The party there is the
*Auftraggeber*.

## Fix

Add an `iban` column to the claimant model, bind the IBAN field to it, bind the plate field to a
real plate column, restore a proper `claimantPhone` input, and correct all three placeholders.
Then check whether any existing production rows have IBANs sitting in `vehicleMake` and migrate
or purge them.

## Answer

Fixed. The Figma reference (`design/Main report flow/06-Gut8erPRO - Edit  _ Accident Overview.png`)
settles the disputed row: it is **Email | IBAN | Phone Number**. There is no "Erstes Kennzeichen"
field and no claimant vehicle-make field in the design — both labels were copy-paste debris.

- IBAN binds to a new `ClaimantInfo.iban` column; the third box is now labelled **Phone Number**
  (`accidentInfo.firstNumber` → `accidentInfo.phoneNumber`) and keeps its correct `claimantPhone`
  binding. Placeholders on both now match their field.
- `ClaimantInfo.vehicleMake` is removed outright — column, form field, and its completeness rule.
  Vehicle make lives on the Vehicle tab, where `manufacturer` is already required. Consequence 4 is
  answered by deletion: had the rule stayed with no input behind it, the send gate would deadlock.
- The plate half of the Fix needed no new column: `claimantLicensePlate` already existed below the
  row, and the design has no second plate field.

Three more fields in the same two sections had the identical silent-drop defect — rendered inputs
with no column and no Zod field, so the API discarded them without a word. `opponentIban`,
`opponentClaimNumber` and `claimantVatId` (the last cast past the type system with
`as keyof AccidentInfoFormData`) now have columns and round-trip. `form-data.test.ts` asserts every
`claimant*`/`opponent*` form field maps to a column the PATCH schema accepts, so the class cannot
recur silently.

### Corrections to this issue

- Consequence 5 is half wrong. `vehicleMake` was carried into the PDF data object but never
  rendered — `report-template.tsx` prints name/company/address/email/phone/licensePlate only, and
  the invoice reads no claimant data. So the IBAN never reached the PDF. What *did* print was the
  licence plate typed into the box labelled "Erstes Kennzeichen", which surfaced under "Phone".

### Data migration

Checked before changing the schema: `SELECT … FROM "ClaimantInfo" WHERE "vehicleMake" IS NOT NULL
AND "vehicleMake" <> ''` returned **0 rows of 5** — the column was empty, so there was nothing to
migrate or purge. The schema change regenerates the single `_init` migration per
`prisma/migrations/README.md`; any existing database must be reset to pick it up.
