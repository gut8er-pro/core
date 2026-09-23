# 35 — Completeness gate demands fields the client considers optional

Status: ready-for-agent
Type: feature (manifest tuning)
Severity: high

The client hit the send gate as a wall: "only able to send report if every field is filled
out." The gate itself stays (it is the audit-11 fix and it is right) — but the MANIFEST marks
too many fields as required. Concrete relaxations from the meeting notes:

1. **Opponent (KG notes, applies everywhere the opponent exists):** company name must NOT be
   required (the opponent can be a private person) and insurance NUMBER must not be required.
   The yellow-marked required set on the call was lastName + insuranceCompany + insuranceNumber
   — after this change: lastName + insuranceCompany stay, the other two never block.
2. **Second tire set is fully optional.** Today opening/having a second set demands its 10
   fields ("Bug/10 required fields missing"). Only the FIRST set counts toward completeness; a
   second set validates only if the user actually filled part of it (all-or-nothing per set is
   fine, empty second set is fine).
3. **Paint markers should not be required** ("Paint should not be required and if yes marked")
   — drop the paint-marker requirement from the manifest (HS/KG/OT), keep the section visibly
   optional; if the client later wants it required for a type, it comes back per type.

Files: `src/lib/completeness/manifest.ts` (opponent section, tires rule, paint rule) + unit
tests in `src/lib/completeness/` + the E2E manifest helpers keep passing (they overfill, so no
break expected). Update `19-send-gate` expectations where counts are asserted.

Broader review (needs Ivan + client): walk the remaining required set per type once these three
land — the notes suggest the client wants "minimum viable Gutachten" gating, not every field.

Status: done

## Resolution

All three relaxations landed in `src/lib/completeness/manifest.ts`. The gate itself is
untouched — it still refuses an incomplete Gutachten server-side, it just asks for less.

1. **Opponent.** `opponentInsuranceNumber` is gone from the rule set entirely, on every type
   that renders an opponent (HS and KG). The remaining rules are the
   `either(opponentLastName, opponentCompany)` that was already there — so a private-person
   opponent with no company satisfies it, and the company is never demanded on its own — plus
   `opponentInsuranceCompany`. Net: HS/KG each ask for one opponent field less than before.
2. **Second tyre set.** The `tireSets` rule gained `where: { setNumber: 1 }`, so only the
   first set is evaluated. A second set is ignored whether it is empty, half-filled or
   complete. `setNumber` is a non-nullable `Int` column and both the UI's create paths set it,
   so every real row carries it.
3. **Paint markers.** The `paintMarkers` rows rule is removed from the diagram section on all
   four types. Only `damageMarkers` remains, and only on HS/KG. The paint layer still renders
   and still saves — it is simply never a reason to refuse a send.

### Verification

- `src/lib/completeness/compute.test.ts` — new `what the gate deliberately stops asking for`
  block pins all three: the insurance number never appears for HS or KG, a company-less
  opponent passes, paint markers are unrequired on all four types, and a second set is ignored
  both empty and blank-but-present while the first set is still fully checked. The old
  `requires a paint marker everywhere except an evaluation report` test is deleted rather than
  inverted, since the new block covers it. **83 tests green.**
- The E2E manifest-fill helper overfills (it still writes an insurance number and a paint
  marker), so it needed no change and keeps passing — confirmed on `14-kg`, `15-ot` and
  `19-send-gate`.
- `19-send-gate` asserts no hardcoded counts, only `missingCount > 0` on an empty report and
  `isComplete` on a filled one, so no count assertions needed updating.

### Still open (the ticket's own broader question)

The "minimum viable Gutachten" review of the remaining required set per type is untouched —
that still needs Ivan and the client. These three were the only concrete asks in the notes.
