# 44 — OT PDF: Vehicle Grading section and final grade

Status: needs-info — waiting for the client to define the report PDFs
Type: feature
Severity: medium

Split out of ticket 38 (2026-10-04). The app side of the grading rework is in 38. This ticket is
the PDF half of the client's "end grade no where" complaint: the overall grade must appear in
the report PDF, not only on screen.

## Current state (verified 2026-10-04)

- `src/lib/pdf/` has **no grading code at all**. Ticket 38's handoff said it rendered "inside the
  condition block", which is wrong.
- `generate-buffer.ts` doesn't load `oldtimerDetails`, so neither the grading columns nor
  Value Increasing Features reach the template. This is new work, not a reorder: load the data,
  add the DE/EN strings in `translations.ts`, and build the sections.

## Blocked on the client

The client hasn't specified what the report PDFs should contain or how they should look. Don't
build this until they do. Questions to bring to them (via Ivan):

1. Should Vehicle Grading always print on an OT report, or get its own Export & Send toggle
   (`sectionsFromToggles`)?
2. How should grades print: `2+` / `2−` as the assessor picked them, or as numbers? Should a
   `Non` row print as "n/a" or be left out?
3. Where does the section go? The tab order (Condition → Vehicle Grading → Oldtimer Valuation)
   is the default.
4. How prominent should the final grade be (its own panel, the cover/summary page, both)?

## Constraints that hold whatever the answers are

- **Nine categories, never Paint.** Don't read `gradingPaint`: it can hold a stale pre-split
  value the assessor can no longer see or change.
- **Read `gradingOverall` from the column.** Auto-calculate writes it (and, after ticket 38's
  reopened fix, clears it when nothing is graded), so the template needs no calculation of its
  own. `computeOverallGrade` in `src/components/report/condition/grading-scale.ts` is pure if the
  PDF ever needs it.
- **Value Increasing Features** go with grading, not with condition.
