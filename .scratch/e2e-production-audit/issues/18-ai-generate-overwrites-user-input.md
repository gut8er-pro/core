# 18 — AI Generate overwrites values the assessor already typed

Status: ready-for-agent
Type: bug
Severity: medium

Documented during the exhaustive E2E runs (see `testing/reports/2026-09-15-exhaustive-full-flow.md`,
"Known races") and reproduced again on the 2026-09-15 local full-stack run: HS verified 16/21
fields in the PDFs while KG/OT verified 100% — every miss traces to one of two races.

## 1. AI writes user-owned fields after the user

The generate pipeline's calc-extractor and OCR write directly to rows the assessor edits:

- `claimantLicensePlate` — the plate OCR re-detects the visible plate from the photos and
  replaces what the assessor typed.
- `vin`, `kbaNumber` — VIN/registration OCR, same pattern.
- `repairMethod`, `risks`, `damageClass` — the damage analyzer's calc write can land after the
  assessor filled the Calculation tab.

AI output should pre-fill, never overwrite: skip the write when the column already holds a
non-empty value (or stage AI values separately and let the UI offer them), instead of last-writer-
wins against the assessor.

## 2. Debounced flush can drop one field in a large batch

`replacementValue` is not AI-written yet intermittently vanished when many fields flush in one
batch — suspicion is the flush ordering in `src/hooks/use-auto-save.ts` (queued-while-saving path).
Needs a focused reproduction; the exhaustive helper now blurs after every fill which masks it in
tests, but a fast human typist hits the same path.
