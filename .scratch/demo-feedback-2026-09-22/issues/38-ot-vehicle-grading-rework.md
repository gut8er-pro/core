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
