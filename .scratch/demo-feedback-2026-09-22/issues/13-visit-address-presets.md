# 13 — Visits: address presets from the claimant when picking the visit type

Status: ready-for-agent
Type: feature
Severity: medium

Picking the visit type should prefill the visit's address fields instead of leaving them empty:

- **Claimant Residence** → copy the claimant's street / postcode / location (their private
  address).
- **Claimant Office** → the company address — for a company car ("firmin auto", company name
  filled on the claimant) the visit address should be the firm's address.
- **Other** → no prefill.
- Every prefill stays fully editable; picking a type only seeds the fields, it never locks them.
  Re-picking a type over already-typed values should ask nothing and simply overwrite only if
  the fields are still empty (do not clobber manual input).

## Direction

- `src/components/report/accident-info/visit-section.tsx` — on the type Controller's change,
  read the claimant fields via `getValues()` (claimantStreet/Postcode/Location) and `setValue`
  the visit row's fields when they are empty; the existing blur-save path then persists them.
- **Open question for Ivan:** the claimant block stores exactly ONE address. Distinguishing a
  private address (Residence) from a company address (Office) needs either a second address
  block on the claimant or an agreement that the single address means "company address whenever
  claimantCompany is filled". v1 ships with the single address feeding both presets; flag the
  ambiguity back to the client.
