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

## Addendum from the BVSK research (ticket 27, 2026-09-22)

- Default-row starting prices anchor to JVEG (per BGH VI ZR 50/15 / VI ZR 280/22 practice):
  Fotografien 2,00 €/Stück, Druck & Versand as Schreibkosten 1,80 €/Seite + Porto/Pauschale
  15,00 €, Anfahrt 0,70 €/km. Use these as the seeded per-unit defaults (editable).
- `handleApplyBvskRate` today blindly overwrites `lineItems.0` — with default rows it must
  TARGET the Grundhonorar row explicitly.
- The embedded BVSK_RATES table matches NO published survey (synthetic values, wrong brackets)
  and BVSK's terms forbid in-software use without consent — do NOT extend or advertise the
  table as "BVSK" beyond what already exists; the auto-fee feature waits on Ivan/client
  (licensing) per ticket 27's findings. The invoice page also never passes repairCost to
  BvskRateTable (invoice/page.tsx:195), so its highlight/Apply are dead today — leave the
  table as-is in this ticket, note only.
