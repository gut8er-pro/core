# 20 — Tires: "Align Axes" and "Match The Set" buttons do nothing

Status: ready-for-agent
Type: bug
Severity: medium

The Tires card renders both buttons but neither works. Expected behaviour (client's words):

- **Align Axes** — copy the CURRENT tire's properties to its axle partner: from VL apply to VR
  (front axle), from HL apply to HR (rear axle) — and vice versa from the right-side tabs.
- **Match The Set** — copy the current tire's properties to ALL FOUR positions of the active
  set.
- Properties covered: size, profile, manufacturer, usability rating, tire type — everything on
  the per-tire form.

## Direction

- `src/components/report/condition/` tires component: both handlers read the active position's
  values from form state, `setValue` onto the target positions, then trigger the existing
  tire-set save so the copies persist (the condition PATCH already accepts full `tireSets` with
  per-tire ids — see the tire update path in `/api/reports/[id]/condition`).
- Copies are prefills, not locks — editing an individual tire afterwards must stay possible.
- While in there: the per-tire "usability" dots row also ends in a dead "+" (same as ticket 16's
  rows) — wire or remove it in the same pass.
