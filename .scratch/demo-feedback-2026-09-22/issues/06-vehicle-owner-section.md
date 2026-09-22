# 06 — Vehicle owner section when claimant is not the owner

Status: ready-for-agent
Type: feature
Severity: medium

"Is the vehicle owner" stays checked by default (claimant owns the car — unchanged). When the
assessor UNCHECKS it, a new "Fahrzeughalter" section must appear below with the same shape of
information as the claimant block (Ivan said "dropdown sa istim informacijama kao claimant
information" — an expanding section with the claimant field set, not a select).

## Direction

- Fields mirroring the claimant block: company, salutation, first/last name, street, postcode,
  location, email, phone (skip IBAN/tax fields unless Ivan says otherwise — they are payment
  properties of the CLAIMANT).
- Additive storage: either columns on `ClaimantInfo` prefixed `owner*` or a small `OwnerInfo`
  table keyed by reportId like `OpponentInfo` — prefer the table, it is the same pattern the
  codebase already has for opponent.
- Zod + PATCH mapping in `/api/reports/[id]/accident-info`, form section in
  `src/components/report/accident-info/claimant-section.tsx` (conditional on
  `!claimantIsVehicleOwner`), `*FromApi` mapping, PDF block, and completeness: owner fields
  required only while the checkbox is unchecked (`when`-rule in the manifest, same mechanism as
  the lawyer signature).
- Applies to all four report types (the checkbox exists on HS/BE/KG; OT has it too).
