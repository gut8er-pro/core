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
