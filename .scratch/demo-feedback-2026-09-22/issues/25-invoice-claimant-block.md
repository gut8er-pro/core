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

## Resolution — data side

Status: verified, no change needed (render is the export agent's)

Checked the whole path from the column to the template. `src/lib/pdf/generate-buffer.ts`
already includes `claimantInfo: true` in the report query and already maps every field the
addressee block needs into `pdfData.claimantInfo`:

    company, salutation, firstName, lastName, street, postcode, location, email, phone

So the PDF renderer has name and address in hand today — nothing was missing on the data
side, and the invoice GET route needs no new fields either (the invoice tab reads the
claimant through the accident-info API, which is unchanged).

### One thing the render will need that is NOT there yet

`pdfData` does **not** carry `invoice.recipientId`. If the invoice block is to vary its
addressee by the recipient setting, `generate-buffer.ts` must add `recipientId` to the
`invoice` mapping. Flagged for the export agent — `generate-buffer.ts` is their file, not
touched here.

### Recipient model (implemented here)

The three buttons (`individual` / `group` / `document`) were meaningless labels with no
downstream effect. Reduced to **two** modes, stored in the existing `Invoice.recipientId`:

| Stored value      | Meaning                     |
|-------------------|-----------------------------|
| `claimant`        | claimant is the addressee   |
| `claimant_lawyer` | claimant and their lawyer   |

Those exact strings are the agreed contract with the export agent's composer. The e2e
manifest helper was updated from `'individual'` to `'claimant'` to match; completeness only
checks the field is non-empty, so nothing else depended on the old vocabulary.

## PDF part (2026-09-23) — done

The invoice section of the report PDF now carries the claimant as its addressee.

`InvoiceAddressee` in `src/lib/pdf/report-template.tsx` prints, under a small "Rechnung an" /
"Invoice to" label and above the invoice number: company (when filled), salutation + first +
last name, street, then postcode + location. **Name and address only** — no email, no phone, no
IBAN, no tax fields, per "ne sve nego samo ime i adresa". German convention holds: the addressee
block sits under the sender line, which is the business letterhead added for ticket 34.

The note the ticket asked for is on the component: it is the one place that decides who the
invoice is addressed to, so a future recipient-type variation lands there. The addressee is
currently always the claimant.

Verified on a live invoice-only PDF:

```
Rechnung
Rechnung an
Müller
Bahnhofstraße 12
28195 Bremen
```

Note for the invoice agent: this is the PDF's invoice section. The on-screen invoice preview is
yours; the two should agree.
