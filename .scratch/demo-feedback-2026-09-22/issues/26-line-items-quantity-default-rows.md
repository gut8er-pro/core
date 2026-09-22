# 26 — Line items: per-unit pricing, default rows, auto photo count, row delete

Status: ready-for-agent
Type: feature
Severity: high

Lump sum = Pauschale. The client's invoicing model, dictated on the call:

1. **Lump sum unchecked → per-unit pricing.** The row shows a QUANTITY field next to the price;
   price is per piece, amount = price × quantity, computed live. (The data model already has
   `quantity` and the Betrag column already multiplies — the UI just never exposes the quantity
   input.) Lump sum checked → quantity hidden, amount = price.
2. **Four default rows exist on every invoice** from the start:
   - Grundhonorar — always Pauschale (no per-unit option)
   - Anfahrt — Pauschale OR per-unit (per km)
   - Druck & Versand — always Pauschale
   - Fotografien — Pauschale OR per-photo
3. **The photo row counts itself.** Quantity for Fotografien is auto-detected from the gallery
   (photo count of the report), kept in sync when photos are added/removed; the assessor edits
   only the per-photo price (e.g. 1,50 € × 30 photos → 45,00 €). Manual override of the count
   stays possible.
4. **Rows need a delete affordance** — client: "koliko vidim nema ni brisanja reda?" Per-row
   remove (default rows removable too, they are defaults not shackles), plus the existing add
   row.

## Direction

- `line-items-section.tsx` + `form-data.ts` + invoice page save mapping (the lineItems
  replace-all path); seed the four defaults when an invoice has no items yet (server-side on
  first GET or client-side before first save — pick one, keep idempotent).
- Per-row `isLumpSum` already exists; add `quantity` input UI gated on `!isLumpSum`, and a
  `unit` hint per default row (km / Stück) purely as placeholder text.
- Photo count: the invoice page already has access to the report's photos via the photos query;
  wire `quantity` for the Fotografien row from `photos.length` while the row is untouched.
- BVSK auto-fee interplay: ticket 27; the BVSK apply-rate path writes the Grundhonorar row — it
  must target the default row rather than inserting a duplicate.
- Both locales for the default row descriptions.
