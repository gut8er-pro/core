# Deepen `reportType` into a policy module

**Status:** ready-for-agent
**Next step:** implement per the **Design (finalized)** section below.
**Strength:** Strong · **Dependency category:** in-process (no runtime deps — easiest to adopt, easiest to test)

## Problem

The report type (`HS` / `BE` / `KG` / `OT`) is a **bare nullable string** re-interpreted in 11 files. Every consumer re-derives its own `isOT` / `isBE` / `isKG` booleans and re-encodes the domain rules locally. The same rule is expressed 3–4× and the copies have **drifted** — notably the PDF ignores rules the form enforces.

There is no module that answers questions about a report type. The type identity itself is `reportType String?` (`prisma/schema.prisma:74`), so discipline exists only partially at the TS layer.

## Evidence (file:line)

Branching sites (behavioural, generated code excluded):

- `src/lib/validations/reports.ts:3-4` — the ONE real registry: `REPORT_TYPES = ['HS','BE','KG','OT']`, `type ReportType`.
- `src/hooks/use-tab-completion.ts:41-42, 50, 60, 140-175` — per-type section counts.
- `src/lib/pdf/report-template.tsx:486-490, 827-829, 836-999` — header subtitle; calc title; which calc blocks render.
- `src/app/(app)/reports/[id]/details/calculation/page.tsx:40-42, 237, 313-373` — which calc sub-form; title; correction visibility.
- `src/app/(app)/reports/[id]/details/condition/page.tsx:341-346` — OT-only sections.
- `src/app/(app)/reports/[id]/details/accident-info/page.tsx:258-260, 294-301, 311-318` — OT heading; hides Accident + Opponent for BE/OT.
- `src/app/(app)/reports/[id]/details/layout.tsx:20-24` — tab labels.
- `src/components/report/accident-info/claimant-section.tsx:26-27, 179-213` — Client vs Claimant; hides lawyer fields for OT.
- `src/components/report/accident-info/visit-section.tsx:37, 168-192` — OT-only "Present" subsection.
- Inline union **redeclared** (not imported from the canonical type): `src/hooks/use-reports.ts:17`, `:60`; `src/components/report/accident-info/types.ts:65`. Only `src/app/(app)/dashboard/page.tsx:23` imports the real `ReportType`.
- `src/app/(app)/dashboard/page.tsx:25-30` — `REPORT_TYPE_OPTIONS`, the only declarative table, but purely presentational (label + icon).

Same rule, multiple divergent copies:

- **"BE/OT have no accident/opponent section"** — form hides it (`accident-info/page.tsx:294, 311`), tab-completion counts it out (`use-tab-completion.ts:50, 60`), but the **PDF renders it unconditionally** (`report-template.tsx:1292`, self-hides only on data absence at `:575`). A BE/OT report with stray accident rows prints a section the UI claims doesn't exist.
- **"OT uses Client not Claimant"** — encoded at `accident-info/page.tsx:258`, `layout.tsx:23`, `claimant-section.tsx:27`; **PDF hard-codes `{t.claimant}`** at `report-template.tsx:591`.
- **Calc section title** — three files, three predicates: `layout.tsx:24` (BE‖OT), `calculation/page.tsx:237` (OT only), `report-template.tsx:829` (BE‖OT).
- **Calc contents** — page branches on pure type (`calculation/page.tsx:313-356`), tab-completion on type (`use-tab-completion.ts:140-175`), PDF mixes type with **field-presence** (`report-template.tsx:927, 960` render on `valuationMax != null` / `marketValue != null`).

## Why it's shallow / deletion test

`reportType` is passed as a bare `string` (`report-template.tsx:11,822`; `use-tab-completion.ts:34`). Deleting a single policy module would make the domain rules reappear across ~11 consumers — so a policy module earns its keep. Today there is **no single source of truth**; adding a 5th type touches ≥12 files, and because every site uses **negative exclusion predicates** (`!isBE && !isOT`, `!isShortReport && !isOldtimerReport`), a new type **silently falls into the HS-like `else`** everywhere with no compile-time guard.

## Design (finalized)

> Finalized via `/grilling` on 2026-08-05. Scope decision: this change **builds the policy module AND fixes the 3 divergence bugs** below (screen is the source of truth). Not a behaviour-preserving refactor.

**Module:** `src/lib/report-type/` — one config table as the single source of truth.

**Shape (hybrid — table + accessors):**
- `REPORT_TYPE_CONFIG` — object literal keyed by type, declared `satisfies Record<ReportType, ReportTypeConfig>`. One declarative **row per type**; a 5th type fails to compile until every field is filled in (kills the silent-`HS`-fallthrough that negative-exclusion predicates cause today).
- `getReportTypeConfig(type: ReportType): ReportTypeConfig` — the accessor every call site uses.
- `resolveReportType(type: string | null | undefined): ReportType` — normalizes the nullable DB value; **null / blank / unknown → `HS`** (matches `generate-buffer.ts:80`). This is the ONE place the null default lives.

**Returns facts, not text.** The config holds capability **booleans** and label **identifiers / variant tags** — never resolved strings. Each surface keeps mapping the identifier to its own i18n key through `next-intl`, exactly as today. i18n coupling stays out of the policy; no wording/translation changes.

**Config fields (per-type):**

| field | HS | KG | BE | OT | drives |
|---|----|----|----|----|--------|
| `hasAccidentSection` | ✓ | ✓ | – | – | accident-info form, PDF accident block, tab-completion |
| `hasOpponent` | ✓ | ✓ | – | – | opponent form, PDF, tab-completion |
| `hasLawyerFields` | ✓ | ✓ | ✓ | – | claimant-section lawyer checkbox + `involvedLawyer` field |
| `hasPresentSubsection` | – | – | – | ✓ | visit-section "Present" subsection |
| `hasConditionValuationSections` | – | – | – | ✓ | condition page: Vehicle Grading + Value-Increasing Features |
| `calculationVariant` | `standard` | `standard` | `valuation` | `oldtimer` | which calc sub-form, PDF calc block, tab-completion calc branch, section titles |
| `hasCorrection` | ✓ | – | ✓ | – | correction section render **and its completion count** |
| `customerLabel` | `claimant` | `claimant` | `claimant` | `client` | claimant-section title, page heading, first-tab label, PDF label |
| `documentSubtitle` | `damageAssessment` | `damageAssessment` | `vehicleValuation` | `oldtimerValuation` | PDF header subtitle |

**Type identity:** import the canonical `ReportType` from `src/lib/validations/reports.ts` everywhere; **delete** the 3 inline redeclarations (`use-reports.ts:17`, `:60`; `accident-info/types.ts:65`).

**Scope:** all ~11 consumer sites migrate in this change — a single source of truth is the point. Behaviour is unchanged except the 4 fixes below.

## Bug fixes that fall out (screen = source of truth)

1. PDF asks `hasAccidentSection` → BE/OT stop printing the phantom Accident section (was `report-template.tsx:1292` rendering unconditionally, self-hiding only on total data-absence at `:575`).
2. PDF resolves the claimant label from `customerLabel` → OT prints "Client" (was hard-coded `{t.claimant}` at `report-template.tsx:591`).
3. tab-completion counts the correction section when `hasCorrection` → BE meter can reach 100% (was `use-tab-completion.ts:149-157` never counting it — see **Latent bug** below).
4. PDF selects the calc block from `calculationVariant`, **not** from `valuationMax != null` / `marketValue != null` (`report-template.tsx:927, 960`) → no wrong-type block from stray data.

## Testing

- Unit-test `REPORT_TYPE_CONFIG` (per-type field values match the table above) and `resolveReportType` (incl. `null` / `''` / unknown → `HS`).
- Assert the capabilities the fixes depend on: `hasAccidentSection`/`hasOpponent` false for BE+OT, `hasCorrection` true for BE, `customerLabel === 'client'` for OT.

## Docs

Record `ReportType` as a domain concept (short note). Full `CONTEXT.md` via `/domain-modeling` is optional, not blocking this change.

## Wins

- Leverage: one interface, 11 call sites.
- Locality: per-type rules concentrate in one module; fix once.
- PDF stops diverging from the form (closes the stray-accident-section leak).
- New type = one config row + compiler-enforced exhaustiveness, not an 11-file hunt.
- Delete 3 inline union redeclarations.

## Latent bug this surfaces

For **BE**, the correction section renders in the form (`calculation/page.tsx:359`, `!isShortReport && !isOldtimerReport`) but is **not counted** by tab-completion (`use-tab-completion.ts:149-157`) — the completion meter can never reach 100%.

## Related

Feeds [06-pdf-view-model-seam](../06-pdf-view-model-seam/spec.md) (PDF should ask `calculationVariant(type)` instead of re-deriving `isBE/isOT`) and the tab-completion counts.
