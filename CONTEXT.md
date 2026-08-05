# Domain Context — Gut8erPRO

> Ubiquitous language for the domain model. Keep entries short; link to the code
> that owns each concept. Architectural decisions live in `docs/adr/`.

## Ubiquitous Language

### ReportType

The kind of appraisal a report produces — one of `HS` (Liability), `BE`
(Evaluation), `KG` (Short Report), `OT` (Oldtimer Valuation). See the
[Report Types matrix](docs/ARCHITECTURE.md) for the per-type section differences.

- **Type identity:** the canonical union and `REPORT_TYPES` tuple live in
  `src/lib/validations/reports.ts`. Import `ReportType` from there — never
  redeclare the union inline.
- **Behaviour / policy:** what each type *does* (which sections, calc variant,
  labels, PDF blocks) is a single source of truth in the policy module
  `src/lib/report-type/`:
  - `REPORT_TYPE_CONFIG` — one declarative row per type (`satisfies
    Record<ReportType, ReportTypeConfig>`, so a 5th type fails to compile until
    every capability is filled in).
  - `getReportTypeConfig(type)` — the accessor every consumer uses instead of
    re-deriving `isOT` / `isBE` / `isKG` booleans.
  - `resolveReportType(nullable)` — the **one** place the null default lives:
    null / blank / unknown → `HS`.
- **Rule:** consumers ask the config for capability **facts** (booleans,
  variant/label identifiers) and map identifiers to their own i18n keys. The
  policy holds no resolved/translated strings.
- **Adding a type:** add one `REPORT_TYPE_CONFIG` row + one
  `dashboard/page.tsx` presentational option; the compiler flags every capability
  you still owe. No multi-file `isX` hunt.
