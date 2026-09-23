# 38 — OT Vehicle Grading rework (own tab, working automation, no duplicate paint)

Status: ready-for-agent
Type: feature + bugs
Severity: medium-high

The Oldtimer notes are all about the grading UI:

1. **Own tab.** Vehicle Grading becomes its OWN tab in the details tab bar, between Condition
   and Valuation (today it is a subsection inside Condition). Touches the details layout/tab
   config, `useTabCompletion`, the completeness manifest's tab grouping for OT, and the PDF
   section order.
2. **Grade popup dismissal.** The per-category grade picker (Non/1–5 with +/−) must close when
   clicking anywhere outside it.
3. **"Automatically calculate grade" toggle does nothing.** Wire it: when on, the overall grade
   computes from the category grades (arithmetic mean rounded to the grading scale is the
   sensible default — confirm formula with the client via Ivan); when off, manual entry.
4. **The final grade is shown nowhere** ("end grade no where"). The computed/entered overall
   grade must render prominently in the section, and in the report PDF.
5. **Remove Paint from grading** — it duplicates the paint assessment that already lives in
   Visual Accident Details; drop the category (keep the column, stop rendering/requiring it).
6. **Overall Condition placement** — it currently sits ABOVE the categories; move it after
   them ("overall condition after category grading"), which also matches the auto-calculate
   flow.

Files: `src/components/report/condition/` grading components → move under their own tab route
alongside the calculation/condition pages; manifest `vehicle-grading` section (see ticket 35's
edits nearby); PDF OT template. Coordinate with whoever owns the tab bar that week.

Status: done (app side) — PDF section order still owed by the export agent, see below

## Resolution

All six points landed. Grading is now a first-class tab, not a subsection.

### 1. Its own tab

`grading` is a real `TabKey` in `src/lib/completeness/types.ts`, not a view trick, so every
completeness number agrees about it:

- `manifest.ts` gained `gradingTab(reportType)`, which returns the `vehicle-grading` section
  for OT and an **empty array** for HS/BE/KG. An empty tab is complete by definition, so the
  other three types are unaffected and render no tab.
- `vehicleGradingSection` moved out of `conditionTab()`.
- `compute.ts` lists `grading` in `TAB_KEYS`; `use-tab-completion.ts` maps it through.
- Both callers feed it the same condition payload they already fetch — it is its own tab and
  its own manifest grouping, not its own endpoint: `use-missing-info.ts` (browser) and
  `lib/completeness/server.ts` (the send/PDF gate).
- Route: `src/app/(app)/reports/[id]/details/grading/page.tsx`, following the sibling tab
  pages. It autosaves through `useAutoSave({ section: 'condition' })` with
  `oldtimerDetails.<field>` keys — identical to how the Condition page saved these columns
  before. A non-OT report that lands on the URL is redirected to `details/condition`.
- Tab bar: `details/layout.tsx` inserts the entry **between Condition and Valuation**, OT only.
- `Value Increasing Features` moved with it — it is the same OT valuation material and was the
  grading section's neighbour.

### 2. Popup dismissal

`ScorePopup` now closes on an outside `mousedown` and on Escape, via a listener pair keyed on
`onDismiss`. It also carries `role="dialog"` + `aria-label`, which gave the E2E a stable
handle and is an a11y improvement in its own right.

### 3. Auto-calculate actually calculates

New pure module `src/components/report/condition/grading-scale.ts`:

- `scoreOf` reads a grade as a number on the German 1–5 scale, treating `+`/`−` as
  **thirds** of a grade (2+ = 1.67, 2− = 2.33), the way a school report reads them.
- `Non` and ungraded contribute nothing — `Non` means "not applicable to this vehicle",
  not a bad score.
- `computeOverallGrade` = arithmetic mean of the graded categories, rounded back onto the
  scale by `gradeOf`. `null` while nothing is graded.

**FORMULA FOR CLIENT CONFIRMATION (Ivan):** arithmetic mean, equal weight per category,
`Non`/ungraded excluded from both numerator and denominator, result rounded to the nearest
third of a grade. If the client wants weighted categories (bodywork counting more than
chrome, say) or plain whole-number rounding, it is a one-function change in `grading-scale.ts`
and nothing else moves.

With the toggle **on**, the computed grade is written to the `gradingOverall` column via the
normal autosave, not merely displayed — the PDF and the gate read the column, so the column is
what has to follow the categories. The overall button is disabled while auto is on. With it
**off**, the button is enabled and takes a manual grade through the same picker (now with
+/− modifiers, which the overall picker previously lacked).

### 4. The final grade renders prominently

The overall grade sits in its own `bg-surface-secondary` panel at the foot of the section, on
a 56px primary disc at `text-h2` — against 32px discs for the categories.

### 5. Paint dropped from grading

`GRADED_CATEGORIES` in `condition/types.ts` is `GRADING_CATEGORIES` minus `paint`. The
**column stays** (`gradingPaint`, no schema change), so reports graded before the split keep
their value; it is simply never rendered, never required and never counted in the mean. Four
now-dead i18n keys removed from both locales (`vehicleGrading.grading`, `.paint`,
`.paintLabel`, `.paintGradingNote`) — the Grading/Paint sub-tab toggle went with them, since
its Paint pane was only a placeholder note.

### 6. Overall Condition below the categories

It now renders after the nine-category grid, with the auto-calculate toggle under it —
matching the auto-calculate flow (grade the parts, then read the whole).

## PDF — for the export agent

I did not touch `src/lib/pdf/**`. What the OT template should do, once grading is its own tab:

1. **Section order.** Render Vehicle Grading as its own section between Condition and the
   Oldtimer Valuation, mirroring the tab order. Today it renders inside the condition block.
2. **Drop the Paint row.** Nine categories, not ten. Do not read `gradingPaint` — the column
   still exists and may hold a stale pre-split value, so rendering it would print an
   assessment the assessor can no longer see or change. The paint assessment belongs to the
   existing paint-thickness/Visual Accident Details block.
3. **Print the final grade prominently** — this was the client's "end grade no where"
   complaint, and it applies to the PDF as much as the screen. `gradingOverall` is always
   populated when auto-calculate is on (it is written to the column, not computed at render
   time), so the template can read the column directly and needs no calculation of its own.
   If you want the formula anyway, `computeOverallGrade` from
   `src/components/report/condition/grading-scale.ts` is pure and import-safe.
4. **Value Increasing Features** moved to the same tab; if the template groups by tab, it
   should follow grading rather than condition.

## Verification

- `grading-scale.test.ts` — 11 tests over the scale: modifiers as thirds, `Non` excluded,
  paint excluded, clamping, and `null` on nothing graded.
- `compute.test.ts` — the oldtimer block now evaluates the `grading` tab, asserts
  `gradingPaint` is never asked for, asserts grading no longer appears in the `condition`
  tab, and asserts HS/BE/KG get a zero-section grading tab that is complete by definition.
- `15-ot-complete-flow.spec.ts` — seven new/rewritten tests: the tab exists and sits between
  Condition and Valuation, grading left the Condition tab, the tab is reachable by click and
  by URL, no Paint category, Overall Condition below the categories (bounding-box compare),
  auto-calculate computes a 2 from three 2s **and survives a reload**, the popup closes on an
  outside click, and turning auto off allows a manual grade that persists.
