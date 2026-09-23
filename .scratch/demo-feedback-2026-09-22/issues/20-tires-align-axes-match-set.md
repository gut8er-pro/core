# 20 — Tires: "Align Axes" and "Match The Set" buttons do nothing

Status: done
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

### Follow-up 2: a tyre size typed just before a tab switch was lost

Carried into wave 2 from the wave-1 report as "fast-switch during the placeholder/auto-create
window". The value was never actually lost — it was written to rows nobody reads. Two distinct
causes, both proven with instrumented probes rather than inferred.

**Cause 1 — the sync effect in `TirePositionFields` never ran.** Its dependency array was

```ts
}, [activePosition, activeTireSet.tires.find])
```

`activeTireSet.tires.find` is `Array.prototype.find`: the same function object for every array
in the realm. The dep never changed, so the effect fired only on mount, when the active set is
the id-less `PLACEHOLDER_TIRE_SET`. The local `tire` state then kept that id-less tyre forever,
and the blur posted it as-is:

```
REQ PATCH tireSets=[{"id":"5fe4…","tires":["HL::ID","HR::ID","VL:225/45 R17:NOID","VR::ID"]}]
RES PATCH 200 [["HL:","HR:","VL:","VL:225/45 R17","VR:"]]        <- FIVE tyres, two at VL
```

The PATCH treats an id-less tyre as a new row, so the set gained a second VL. Coming back,
`tires.find(tr => tr.position === activePosition)` returns the empty original.

**Cause 2 — typing during the placeholder window created a second SET.** Even with cause 1
fixed the case still failed, and the probe showed why: when the blur lands while the
placeholder is still on screen, `withoutPlaceholderId` strips the synthetic id and the PATCH's
no-id branch creates a whole new set beside the first.

```
PATCH setId=NONE ["VL:225/45 R17","VR:","HL:","HR:"]
DB sets=2 [["HL:","HR:","VL:","VR:"], ["HL:","HR:","VL:225/45 R17","VR:"]]
```

The card renders set 1, which is the empty one. The window is much wider than "the PATCH is in
flight": the row exists server-side long before React Query refetches, so on a loaded machine
the client can sit on the placeholder for many seconds.

### Fix

`src/components/report/condition/tire-section.tsx` only. `use-condition.ts` was examined and
deliberately left alone — the save path and `trackSectionSave` were both already correct, and
an id-resolving lookup tried there raced the auto-create it was supposed to follow.

- The sync effect now keys on `activePosition` and the resolved `existingTire`. It adopts the
  saved row — id *and* values — whenever the assessor is not mid-edit, tracked by an `editing`
  ref set on change and cleared on blur. That is what makes both the id reach the next save and
  the saved value reach the field on return; adopting only the id left the input rendering
  empty over correct data.
- `saveCurrentTire` re-attaches the id from the matched set row (`id: updated.id ?? tr.id`) as
  a second line of defence.
- The placeholder's fields are now **read-only until the real set lands** (`awaitingFirstSet`),
  and a save still aimed at the placeholder is re-pointed at the real set via `ontoRealSet`, or
  dropped if there is none. Ticket 20's original point stands — the card shows its four
  position tabs and its form immediately rather than an empty box — it just cannot be typed
  into for the one round-trip in which typing could not be persisted.

Result, stable across runs: one set, four tyres, the value on screen.

```
DB sets=1 [["HL:","HR:","VL:225/45 R17","VR:"]]  input="225/45 R17"
```

### The spec's tyre case was never testing this

`21-tab-switch-data-loss.spec.ts` looked the input up as `input[name$=".size"]`. The tyre
fields are `TextField`s with no `name` attribute, and the card is `defaultOpen={false}`, so the
locator matched nothing and the test died on a 15s `waitFor` without reaching the tyre logic —
red for the wrong reason, and it would have stayed red after any fix. It now opens the
accordion the way `07-condition.spec.ts` does and addresses the field by its label; the
`toBeEditable` wait doubles as the wait for the real set. 5/5 green, and faster (8-12s, against
20-30s when it was timing out).

### Follow-up 3: 2026-09-23 prod feedback — copies used stale values and showed late

Reported on production: Align/Match seemed to copy old or empty values, and the other position
tabs showed the copies (and even plain typed values after a tab switch) only seconds later.

Two causes. `copyActiveTireTo` took its source from `activeTireSet.tires`, the React Query cache,
not from `TirePositionFields`' local `tire` state, so a click before the blur save and refetch
had landed copied the stale row. And `useSaveTireSet` only invalidated, so every tab rendered the
old `tireSets` until the PATCH and the refetch both answered.

Fix: `TireSection` owns a `liveTire` ref that `TirePositionFields` keeps pointed at the tyre on
screen; the copy sources from it (falling back to the cache row), refreshes the source row in the
set, and sends one full-set PATCH that persists the source and the copies together, with each
target keeping its own id and position via `applyTireToPositions`. `useSaveTireSet` now writes
the payload into the condition cache in `onMutate` (matched by set id, else `setNumber`; only
sets already in the cache, so the placeholder never lands there; cached ids are kept) and
invalidates on settle so server truth still converges and a failed save reverts. The adoption
effect's editing guard is unchanged. New E2E in `07-condition.spec.ts` fills VL, clicks Match
The Set with no wait, and asserts VR/HL/HR within 1.5s, then one set with four matching tyres
via the API and after a reload. With the fix disabled that test fails on VR (`""`).
