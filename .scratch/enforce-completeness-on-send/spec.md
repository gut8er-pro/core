# Spec: Enforce completeness before a Gutachten can leave the building

Status: ready-for-agent
Type: feature

> Feature slug: `enforce-completeness-on-send`.
> Supersedes four Out of Scope entries in `.scratch/show-missing-information/spec.md`,
> which have been corrected in place. All decisions below were settled with the
> maintainer across six grilling rounds.

## Problem Statement

`show-missing-information` shipped. The completeness engine exists at
`src/lib/completeness/`, the toggle highlights gaps, the tab and section badges
agree with the banner. Every number on the Report Details screen is now honest.

And every one of them is advisory. An assessor can look at a banner reading
"37 required fields missing", walk to Export & Send, and mail the Gutachten to
an insurer. The report locks, becomes read-only, and the gaps are permanent.
Nothing between the toggle and the recipient's inbox reads the manifest.

Three further things are wrong underneath:

- `Report.completionPercentage` is written by nothing. `src/hooks/use-statistics.ts:47`
  averages it across reports, so that statistic is permanently 0, and the column
  sits at its `@default(0)` for the life of every report.
- `status: 'COMPLETED'` is never set by anything in the app. `REPORT_COMPLETED`
  notifications exist and never fire.
- Three manifest rules cannot fail, because the columns they name are non-nullable
  with defaults. They read as enforcement and enforce nothing.

## Solution

Completeness stops being advice and becomes a precondition for the two acts that
put a Gutachten in front of someone else: sending it by email, and generating its
PDF. Both are refused by the server until the report satisfies its type's manifest.

The same engine runs server-side to keep `completionPercentage` and `status`
truthful as the assessor works, so the dashboard and statistics stop lying.

The client never lets the assessor reach a refusal it could have predicted: the
Export page disables Send and shows which tabs are short, so the server's 422 is a
backstop rather than a routine experience.

## Governing Constraint

**The product is pre-launch. There are no customers and no production data.** No
backward-compatibility logic, no grandfathering, no data migrations, no backfills.
Anything that becomes stale is discarded rather than carried. This rule overrides
any decision below that would otherwise preserve existing state.

## User Stories

1. As an assessor, I want the app to refuse to send a Gutachten that is missing
   required fields, so that I cannot deliver an indefensible report by accident.
2. As an assessor, I want Send disabled with a per-tab list of what is missing, so
   that I know where to go rather than merely being told no.
3. As an assessor, I want the refusal enforced by the server, so that the guarantee
   holds regardless of what the browser does.
4. As an assessor, I want the PDF blocked on the same terms as the email, so that
   the block cannot be walked around by downloading the document and sending it myself.
5. As an assessor, I want a report I have already sent to stay downloadable forever,
   so that tightening the required set later cannot take back a delivered Gutachten.
6. As an assessor, I want my dashboard completion percentage to reflect reality, so
   that the number on the report list means something.
7. As an assessor, I want a report to mark itself complete when it is, so that I can
   filter for what is ready.
8. As an assessor filling an Oldtimer valuation, I want the grading table and the
   value-increasing features to survive a reload, so that I do not silently lose the
   substance of the valuation.
9. As an assessor filling an Oldtimer valuation, I want to be asked to grade each
   category rather than handed a pre-filled 5, so that the report does not assert a
   grade I never gave.
10. As an assessor, I want to answer "airbags deployed" and "error memory read"
    explicitly as yes or no, so that a report does not record a finding nobody made.
11. As an assessor, I want the Export page to load fresh data before judging me
    complete, so that a field I just filled is not reported missing.
12. As a developer, I want one completeness engine serving both client and server,
    so that the two can never disagree about whether a report may be sent.
13. As a developer, I want the manifest to only name fields that can actually be
    empty, so that a rule that cannot fail is not mistaken for enforcement.

## Implementation Decisions

### The gate

- **Hard block, no override.** Send and PDF generation are refused while required
  fields are empty. There is no "send anyway", no admin bypass, no test-only flag.
  A bypass becomes the default path and a test flag reaches production.
- The block applies to **every report**, with no exemption by creation date. There
  is no production data to grandfather.
- **One exemption, and only one:** a report that is `isLocked`, or whose status is
  `SENT` or `LOCKED`, is never gated. It passed at send time; tightening the
  manifest later must not retract a Gutachten that has already been delivered.

### Server seam

- New module `src/lib/completeness/server.ts` exporting one async function,
  `getMissingInfo(reportId, userId)`, returning the existing `MissingInfoReport`.
- It fetches the same relations the five tab GET routes fetch, round-trips the
  Prisma result through `JSON.parse(JSON.stringify(rows))`, and feeds the **existing**
  `*FromApi` mappers unchanged.
  - The round-trip is load-bearing, not laziness. Those mappers consume the API's
    JSON shape — `form-data.ts:62` does `accident?.accidentDay?.split('T')[0]` — and
    Prisma returns `Date` objects, so calling them on raw rows throws
    `.split is not a function` for any report with a date set. Serializing first makes
    the server's input byte-identical to the browser's, and keeps exactly one mapper
    per tab. A second set of server mappers would be two manifests in a trenchcoat.
- The PDF gate lives **inside `generateReportPdfBuffer`**, the single choke point
  both `export/route.ts:23` and `send/route.ts:80` call.
- The send route runs its **own** explicit check before calling the PDF, so it can
  return the structured 422 body rather than a PDF-layer error.

### Error contract and client pre-check

- The 422 body carries the structured `MissingInfoReport`, not a message. The count
  is meaningless without the locations.
- The Export page calls `useMissingInfo`, disables Send while gaps remain, and renders
  a per-tab breakdown linking back to each tab.
- On mount the Export page **invalidates and awaits** a fresh fetch of all five tabs.
  Autosave flushes on unmount when the assessor leaves the details route; without
  awaiting fresh data, a report completed seconds ago can be judged incomplete.
- A 422 that slips through anyway surfaces in the existing error banner
  (`export/page.tsx:159`) telling the assessor not everything had saved yet and to try
  again. **No automatic retry** — sending is irreversible and must follow a click the
  assessor actually made.

### Completion truth

- `completionPercentage` is recomputed and persisted inside each of the five autosave
  PATCH routes. Cost is five relation reads and one update per *debounced* save, not
  per keystroke.
- `status` flips `DRAFT → COMPLETED` when the report reaches 100%, and back to `DRAFT`
  if it drops below. It **never** touches `SENT` or `LOCKED`.
- The `REPORT_COMPLETED` notification fires only on the upward transition, or toggling
  one field spams the assessor.
- **No backfill.** Existing rows are test data and get discarded.

### Deletions

- The Update Report button goes. It called `flushNow()` and fired a hardcoded English
  toast, on three of five tabs, against data autosave had already written. It implied a
  save model the app does not have.
- Delete with it: the three call sites, the `updateReport` keys in `de.json` and
  `en.json`, the test at `testing/e2e/11-edge-cases.spec.ts:68`, and the five references
  across `testing/suites/*.md`. No deprecation, no alias.

### Schema changes

Edited directly in `prisma/schema.prisma`. **No incremental migration file:** the single
existing `prisma/migrations/20260514160136_init` is deleted and regenerated as one fresh
init, so `prisma migrate deploy` can still build a database from scratch.

**Why some columns become nullable when the point is stricter checking.** The two layers
enforce at different moments. Autosave creates a row the instant a report is created and
rewrites it on every debounce, with almost nothing filled — so a `NOT NULL` column can only
ever be satisfied by a default, and a default *is* a fabricated answer. `NOT NULL` pushes
enforcement to insert time, where autosave makes it impossible; nullable moves it to send
time, where the gate can see it. Nullable is what makes the strict check possible, because it
gives "unanswered" a representation.

The rule: **a column becomes nullable exactly when the manifest requires it and
"not answered yet" is currently unrepresentable.** Nothing becomes `NOT NULL` — the only
candidates would be the ~60 manifest-required fields, and `NOT NULL` on any of them breaks
the first autosave of every new report.

| Change | Column | Why |
|---|---|---|
| → nullable | `VehicleCondition.airbagsDeployed` | Required finding; `false` by default asserts a finding nobody made |
| → nullable | `VehicleCondition.errorMemoryRead` | Same |
| type | `Calculation.valuationDate` `String?` → `DateTime?` | Every sibling date is a `DateTime`; the BE gate turns on it |
| new model | `OldtimerDetails` (1:1 on `reportId`) | See below |

Explicitly **unchanged**: `testDrivePerformed` and `fullServiceHistory` stay `NOT NULL` — no
rule requires them, so nullability would buy null-handling in the forms and PDF for nothing.
`Tire.position`, `Invoice.feeSchedule` and `Visit.type` stay as they are; their fix is in the
manifest, below.

### Manifest changes

- **Add** the invoice recipient. The original spec required it; `manifest.ts:255` omitted it.
- **Add** at least one photo. The funnel begins at photo upload and the PDF renders them; a
  photoless Gutachten is not a defensible one.
- **Add** `airbagsDeployed` and `errorMemoryRead` for the types that inspect a vehicle.
- **Delete** the invoice `feeSchedule` rule. Defaulted to `'bvsk'` in the form
  (`form-data.ts:10`) and the DB, and BVSK is the German standard the invoice maths is built
  on — a default that is a genuine answer. The rule can never fail.
- **Delete** the tyre `position` rule. `tire-section.tsx:199` always sets it from the position
  tab the assessor is on. Position is the row's identity, not an answer.
- **Full audit of all four type manifests against what each type actually renders**, before
  the gate goes live. With no escape hatch, any rule naming a field a type does not render is
  a permanent lock on that report type. Already verified: `ConditionSection` renders
  unconditionally, so OT's four condition fields are safe.

### Oldtimer sections

`vehicle-grading-section.tsx:42` and `value-increasing-features-section.tsx:91` are pure
`useState` with no props and no columns — an OT assessor fills in grading scores and rarity
tags and loses all of it on reload. Two of the state variables are underscore-prefixed,
written and never read.

- New 1:1 `OldtimerDetails` model keyed on `reportId`, matching the pattern every other
  section uses. Flat columns: ten grading scores, an overall score, the auto-calculate flag,
  six `String[]` tag lists (`produceGroups String[]` is existing precedent), and the free-text
  originality, particulars and market-reputation fields.
- Flat, **not** JSON: `Rule<TValues>` names only top-level keys of a tab's value object
  (`types.ts:36`), so a JSON blob could only ever be required as "the blob exists". The
  manifest could never say "bodywork is graded".
- **Drop the pre-fill.** `vehicle-grading-section.tsx:45` starts all ten categories and the
  overall score at `'5'`. Persisted as-is, every OT report ships pre-graded as a perfect 5 that
  no assessor entered, and the manifest sees ten filled fields.
- OT manifest requires all ten categories plus the overall score. The value-increasing lists
  are **not** required — a car with no rare equipment is a real answer.

### Field rendering

- `airbagsDeployed` and `errorMemoryRead` stop being checkboxes and become a two-option
  Yes/No control starting unselected. A checkbox has two states; the column now has three,
  and there is no gesture on a checkbox that sets an explicit `false`.
- This is how a Gutachten records a finding anyway — *Airbags ausgelöst: ja / nein*.

## Testing Decisions

- **Unit — `getMissingInfo`.** The new server seam, against a seeded database. The pure engine
  already has coverage at `src/lib/completeness/compute.test.ts`; this covers the adapter, which
  is where the `Date`-versus-string defect lives.
- **E2E — the happy path.** Specs 12–17 all call send and none fills the manifest.
  `16-all-reports-send.spec.ts:139` fills HS with seven claimant fields and a signature, and
  never sets `accidentDay`, `accidentScene`, `claimantVehicleMake`, any opponent field, any
  visit, any expert-opinion field, any tyre set, any damage or paint marker, `taxRate` or
  `dropoutGroup`. All six are extended to fill the complete manifest for their type. This is
  the first end-to-end proof that a complete report of each type is achievable through the UI.
- **E2E — the negative path.** One new spec: an incomplete report shows Send disabled, and a
  direct `POST /api/reports/[id]/send` returns 422. Six passing happy-path specs prove nothing
  about a gate.
- **E2E — the exemption.** A locked report's PDF still downloads. This is the case that
  silently breaks a user who has already paid.
- Not given their own seam: the status flip and the percentage write are assertions inside the
  existing flow specs, not new suites.

## Out of Scope

- **Any override mechanism.** No "send anyway", no admin bypass, no test flag.
- **Gating anything else on completeness** — saving, autosave, navigation, DAT calls.
- **Changing the permissive Zod persistence schemas.** They must keep accepting partial drafts;
  completeness stays a separate concern from persistence validity.
- **Localising the 422 on the server.** The body is structured; the client localises it.
- **Backfills, grandfathering, and migration files.** See Governing Constraint.

## Further Notes

This reverses four Out of Scope entries in `.scratch/show-missing-information/spec.md`
— blocking on send, touching the export/send/PDF surfaces, persisting the Oldtimer sections,
and migrating boolean columns. The first two were deliberate product decisions the maintainer
has now reversed. The second two were declined on migration cost, and that cost evaporated with
the Governing Constraint. Those four lines have been corrected in the original spec rather than
left standing in contradiction.

The largest risk in this change is not the gate but the manifest behind it. With no escape
hatch, a single rule naming a field that a report type never renders, or that DAT never
populates, makes that report type permanently undeliverable, and the only recourse is a deploy.
The audit is what replaces the safety net; it is not optional.
