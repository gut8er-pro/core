# 19 — Schadstoffplakette: make the group selectable, ideally with the official sticker look

Status: ready-for-agent
Type: bug + design
Severity: medium

The Condition tab renders a row labelled "Multi-hit Groups" with four coloured circles
(1 grey, 2 red, 3 orange/yellow, 4 green) — the German emission sticker groups
(Schadstoffgruppe). Two problems and one wish:

1. **They are not clickable** — pure decoration today, nothing selects or saves. Same
   dead-control class as audit 06. Wire selection → a `VehicleCondition` column (additive,
   e.g. `emissionGroup: String?`), zod, PATCH mapping, PDF line; clicking the active one
   deselects (unknown = omitted from the report, same rule as previous owners in ticket 16).
2. **The label is wrong.** "Multi-hit Groups" is a mistranslation — it should be
   "Schadstoffplakette" (DE) / "Emission sticker" (EN) in both catalogues.
3. **Official look, if possible.** The client showed the real GTÜ stickers: round Plakette with
   the big group number, red/yellow/green. Draw them as small inline SVGs styled after the real
   sticker (round badge, white number plate strip) — no licensed asset needed, it's a generic
   sticker shape. Ivan's fallback explicitly allows shipping "just clickable" first and
   upgrading the visuals after.

Group 1 has no sticker in reality (grey = none/ineligible); render it as "keine Plakette".

## Resolution

Status: done

All three parts done.

1. **Selectable and persisted.** The four circles are buttons bound to
   `VehicleCondition.emissionGroup` (the column and its migration already existed). Wired
   through `ConditionFormData`, `CONDITION_DEFAULTS`, `conditionFromApi` (with a
   `toEmissionGroup` narrowing helper so an unexpected stored string becomes `null` rather
   than a bogus selection), `conditionSchema` (`z.enum(EMISSION_GROUPS).nullable().optional()`),
   and the PATCH mapping plus the GET projection in `/api/reports/[id]/condition`.
   Clicking the active group clears it to `null`, the same "unknown stays unknown" rule as
   previous owners in ticket 16.
2. **Label fixed.** `condition.multiHitGroups` is now "Schadstoffplakette" (DE) /
   "Emission sticker" (EN). The key name was left alone so nothing else had to move.
3. **Official look.** New `emission-sticker.tsx` draws each group as an inline SVG styled after
   the real Plakette: round badge, large group number, white strip across the bottom. Group 1
   is grey and labelled "keine Plakette" / "no sticker", since no sticker exists for it in
   reality. Selection shows as a ring on the active badge; `aria-pressed` carries the state and
   each badge has an `aria-label`.

Completeness: **verified no change needed.** `conditionTab()` in `src/lib/completeness/manifest.ts`
names its condition rules explicitly and `emissionGroup` is not among them, so it is never
required. `ConditionValues` derives from `ConditionFormData`, so the new key flows through the
type without touching the manifest.

Not done — out of my file ownership: the PDF has no Schadstoffplakette line yet
(`src/lib/pdf/report-template.tsx` + `translations.ts` are owned elsewhere). The value is
stored and served by the API, so adding the row is a small follow-up. Ticket note: the report
should omit the line entirely when the group is `null`.

E2E: `07-condition.spec.ts` covers select → reload → still selected, then click-again →
reload → deselected.
