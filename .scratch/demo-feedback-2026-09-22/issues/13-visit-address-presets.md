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

## Resolution (2026-09-22)

Status: done as v1. The open question above still needs Ivan.

`src/components/report/accident-info/visit-section.tsx` — picking Claimant Residence or Claimant
Office seeds that visit row's street / postcode / location from the claimant via
`getValues`/`setValue` (both passed down from the details page, which already holds them from
`useForm`). Three rules, all unit-tested in `visit-section.test.tsx`:

- only fields that are still empty are written, so re-picking a type never clobbers an address
  the assessor typed by hand;
- "Other" seeds nothing;
- a claimant with no address yet seeds nothing.

A seeded row fires the existing blur-save path once, so the prefill persists like any manual
edit, and every seeded field stays fully editable.

v1 ships with the single claimant address feeding BOTH presets, exactly as the open question
above anticipated — Residence and Office produce identical values until Ivan decides.
