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
