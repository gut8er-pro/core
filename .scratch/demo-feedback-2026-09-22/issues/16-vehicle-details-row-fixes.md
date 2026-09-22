# 16 — Vehicle Details rows: ranges, defaults, dead plus buttons

Status: ready-for-agent
Type: bug + polish
Severity: medium

The client likes the Vehicle Details pill rows as such; three fixes:

1. **Doors and Seats start at 1, not 0.** Drop the `0` pill from both rows (a car with zero
   doors/seats is nonsense in a Gutachten).
2. **Previous Owners has no default and is omitted when unknown.** Nothing pre-selected; the
   assessor picks a value only when they know it. When nothing is selected the field must not
   appear in the report at all — PDF renders no "Previous owners" line (and completeness must
   not require it). Selecting must also be UNDOABLE back to "unknown" (clicking the active pill
   deselects it), otherwise one stray click can never be cleared.
3. **The "+" pills do nothing.** Every row (vehicle type, motor type, axles, driven-by, doors,
   seats, previous owners) ends in a "+" that is currently dead — same dead-control class as
   audit ticket 06. Wire it as "custom value": clicking "+" turns into a small inline input
   (numeric rows: any number, e.g. 6 axles; type rows: free label) that becomes the selected
   pill. If a row realistically has no custom case, remove its "+" instead of faking one.

## Direction

- `src/components/report/vehicle/` details/specification sections hold the pill rows; values
  already flow through the vehicle PATCH as plain ints/strings, so custom values need UI work
  only. Check the zod ranges in `src/lib/validations/` (doors/seats min) and the PDF template's
  vehicle block for the omit-when-null behaviour.
- Mind audit ticket 06's precedent: dead controls are either wired or removed, never left.
