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

## Addendum from the meeting-notes PDFs

- German labels confirmed: "Achsen ausrichten" / "Satz abgleichen" — both reported dead.
- Also from the KG notes: tire DATA "not saved when changed" — coordinate with ticket 22 (the
  autosave data-loss class); verify tire edits persist through a quick tab switch after the 22
  fix lands, don't fix it twice.

## Resolution

Status: done

Both buttons work, and the dead "+" is wired.

- **Achsen ausrichten / Align Axes** copies the active tyre's properties to its axle partner
  via an `AXLE_PARTNER` map (VL↔VR, HL↔HR), so it works from either side of an axle.
- **Satz abgleichen / Match The Set** copies to the other three positions of the active set.
  Note this replaces the old handler, which toggled `matchAndAlloy` — a boolean nobody read.
  That was the whole reason the button looked dead.
- Both go through one `applyTireToPositions` helper. It copies size, profile, manufacturer,
  usability, DOT code and tyre type, and deliberately preserves each target's own `id` and
  `position` so the existing PATCH updates the tyre rows in place rather than replacing them.
  Copies are prefills: editing an individual tyre afterwards still works.
- Persistence goes through the existing `onSaveTireSet` → `useSaveTireSet` → condition PATCH
  path. No new save route, and `use-auto-save.ts` was not touched.
- The per-tyre usability "+" now increments the rating, capped at 5 and disabled at the cap,
  with an `aria-label` from the new `tires.usabilityIncrease` key (both locales).

Addendum, tyre data "not saved when changed": re-checked after the ticket-22 autosave rework
landed in the tree. See the caveat in the agent's final report — the two persistence E2E tests
that were failing before the rework need to be read against that change, not against this one.

E2E: `07-condition.spec.ts` gained two tests — align copies VL→VR and leaves the rear axle
alone, and match copies to all four positions. Both open the Tires accordion through a helper
that waits for the fields to become editable, since the section is collapsed by default.

### Follow-up: the Tires card rendered no inputs on a fresh report

Probed on a fresh HS report (instrumented spec, since the symptom is timing):

```
BEFORE OPEN tire-size count: 0      (card collapsed)
trigger state: closed
AFTER OPEN +1s tire-size count: 0
AFTER OPEN +5s tire-size count: 1
API tireSets: {"tireSets":1,"tires":4}
```

Two causes stacked:

1. `CollapsibleSection` wraps children in a Radix `AccordionContent` with no
   `forceMount`, so while the Tires card is collapsed (`defaultOpen={false}`) its children are
   unmounted and `TireSection`'s auto-create effect never runs at all.
2. Once opened, the effect PATCHes to create set 1 and the fields render only after that
   round-trip returns — several seconds on a loaded dev server. Until then the card is empty,
   because both the set tabs and the position tabs derive from the `tireSets` array.

Fixed on the UI side, which is what the client screenshot shows (inputs visible with an empty
set): `TireSection` now renders `PLACEHOLDER_TIRE_SET` — set 1 with the four positions and
blank fields — whenever `tireSets` is empty. The four position tabs and the form appear on the
first render; the auto-create PATCH still runs and swaps in the real row when it answers.
A `withoutPlaceholderId` wrapper around `onSaveTireSet` strips the synthetic id so it can never
reach the API (it is not a UUID and the PATCH would reject it); saves match on position, so
typing before the round-trip lands still writes to the right tyre.

This also removes the race that made `align axes` flaky: the test no longer has to wait for a
round-trip before its first fill.
