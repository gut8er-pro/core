# 06 — Dead controls across Dashboard and Statistics

Status: ready-for-agent
Type: bug
Severity: medium

Twelve-plus interactive-looking controls do nothing. They have hover states and pointer cursors,
so a user will click them and conclude the app is broken.

## Statistics (`src/app/(app)/statistics/page.tsx`)

The entire file contains **one** `onClick` handler, and it only changes button styling.

| Control | Location | State |
|---|---|---|
| "Letzte 6 Monate" period selector | ~line 133 | no `onClick`; renders a ChevronDown implying a dropdown |
| Filter (SlidersHorizontal) button | invoice header | no `onClick` |
| "Bericht herunterladen" | invoice header | no `onClick` |
| Per-row download icon ×9 | invoice rows | no `onClick` |

**Chart period toggle is inert.** `chartView` is declared at line 98 and referenced only at line
191 — for the active-button class. The chart always receives `monthlyRevenue` (12 months) with
`maxValue={10000}` regardless of Wöchentlich / Monatlich / Jährlich.

**The chart's Y axis doesn't match its plot.** `Y_LABELS = [10000, 5000, 2000, 1000, 0]` is laid out
with `justify-between` — five evenly-spaced labels — while `AreaChart` plots on a *linear* scale to
`maxValue=10000`. A point at 5 000 renders at 50 % height but the "5k" label sits at 25 % from the
top. Any non-zero data will be read off the wrong gridline. Either space the labels
proportionally or make them linear (0/2.5k/5k/7.5k/10k).

## Dashboard (`src/app/(app)/page.tsx`)

| Control | Location | State |
|---|---|---|
| Year selector "2026 ▾" | lines 183-190 | no `onClick` |
| Filter button | line 262 | no `onClick`, has `aria-label={t('filterReports')}` |
| Jährlich / Monatlich / Wöchentlich | line 173 | `chartPeriod` used only at line 176, for styling |

Same inert-toggle pattern as Statistics.

## Fix

For each: wire it up, or remove it. A disabled control with a tooltip is also acceptable — an
enabled control that silently does nothing is not. The two chart-period toggles and the two filter
buttons are duplicated logic across both pages and should be solved once.
