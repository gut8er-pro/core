# 25 — Invoice must carry the claimant's name and address

Status: ready-for-agent
Type: feature
Severity: medium

The rendered invoice (PDF + preview) must show the claimant — NAME and ADDRESS only, not the
full claimant block ("ne sve nego samo ime i adresa").

## Direction

- Invoice template in the PDF pipeline (`src/lib/pdf/` invoice section): recipient block =
  salutation + first/last name (or company when filled), street, postcode + location, sourced
  from `ClaimantInfo`.
- Recipient-type setting on the invoice (individual/group/document buttons) may later vary the
  addressee — for now claimant is the addressee for `individual`; leave a note where the block
  is built.
- German invoice conventions apply (addressee block top-left under the sender line); check
  against how the business/sender block already renders.
