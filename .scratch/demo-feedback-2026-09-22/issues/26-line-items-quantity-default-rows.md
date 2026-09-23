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

## Resolution

Status: fixed

### Row identity, with a frozen schema

Default rows need an identity that survives the replace-all save, reordering and deletion,
and there is no column for one. `specialFeature` carries it: an unused free-text column no
input ever wrote to and the PDF never reads. The four keys are `grundhonorar`, `anfahrt`,
`druck_versand`, `fotografien`.

`src/lib/invoice/default-line-items.ts` is the single table both sides read — the API route
seeds from it, the row component asks it whether a row is Pauschale-only and what unit hint
to show.

### Per-unit pricing

Lump sum unchecked → a quantity input appears next to the rate and `Betrag = Satz × Menge`,
recomputed live from `useWatch`. Lump sum checked → the quantity is hidden and the amount is
the rate. Grundhonorar and Druck & Versand are Pauschale-only, so they render **no** lump-sum
checkbox at all rather than a checkbox that cannot be unticked.

One deliberate semantic change: a per-unit row with an **empty** quantity now bills **zero**,
not one. Quantity is a real input now, and silently charging for one unit of something the
assessor left blank is worse than showing 0,00 €. The corresponding unit test was rewritten
to assert the new rule.

### Seed prices (JVEG, per the addendum)

| Row             | Seeded      | Mode              |
|-----------------|-------------|-------------------|
| Grundhonorar    | 0,00 €      | Pauschale only    |
| Anfahrt         | 0,70 €/km   | Pauschale or /km  |
| Druck & Versand | 15,00 €     | Pauschale only    |
| Fotografien     | 2,00 €/Stück| Pauschale or /Stk |

Druck & Versand: one sane seed was asked for, so it is the 15,00 € Porto/Pauschale rather
than 1,80 €/Seite — a page count is not knowable when the invoice is created, a postage lump
sum is.

Per-unit rows seed with **quantity 0**, so a fresh invoice bills nothing until the assessor
fills it in. Nobody gets an invoice that silently charged for one kilometre.

### Seeding, and staying deleted

Server-side, at the moment the `Invoice` record is **created** — in the GET (which now
creates it) and in the PATCH fallback. Seeding at creation rather than "whenever there are no
rows" is what makes it idempotent: delete all four and they stay deleted, because the record
already exists. Covered by a regression test.

Consequence worth knowing: a GET on the invoice tab now creates the `Invoice` row, so
`invoice != null` for any report whose invoice tab was ever opened, and the
`{ kind: 'rows', path: 'lineItems' }` completeness rule (which only asserts "at least one
row") is satisfied from the start. That follows directly from "four default rows exist on
every invoice", but it does weaken that one gate — flagging it rather than burying it.

### Photo count

`usePhotos(reportId)` feeds the Fotografien row's quantity while it is untouched; the first
manual edit to that row's quantity sets `photoRowTouchedRef` and the sync stops for the rest
of the session. The sync persists through the normal line-items save rather than only moving
the input (the `setValue`-without-`shouldDirty` trap from wave 1).

### Per-row delete

Every row, defaults included, has a trash button. Removal persists immediately via the
replace-all path, deferred by a microtask so `getValues` sees the post-remove array.

### handleApplyBvskRate

No longer overwrites `lineItems.0`. It finds the row keyed `grundhonorar` and writes that;
if the assessor deleted it, the fee is **appended** rather than clobbering whatever now sits
at index 0. It also saves after applying, which it never did.

The BVSK table itself is untouched, per the licensing note — not extended, not advertised,
and its Apply is still dead because `invoice/page.tsx` still passes no `repairCost`.

### Totals (added mid-task by the coordinator, from the payments agent's finding)

`Invoice.totalNet`/`totalGross` were never written — 70 local invoices stored 0 while their
rows summed to ~€22k, so stats and the PDF each carried a compute-from-line-items fallback.
The invoice route now derives both from the rows it just wrote, on any `lineItems`,
`deleteLineItemIds` or `taxRate` change, reading the rows back from the database so the
stored totals always match what is persisted. Reuses the payments agent's
`src/lib/invoice/amount.ts` — `invoiceNet` and `grossFromNet` were extracted there additively
and `invoiceGross` now composes them, so its two existing callers are unchanged.

### Verification

- `src/lib/invoice/default-line-items.test.ts` — 8 tests (order, JVEG prices, zero-unit
  seeds, Pauschale-only flags, unit hints, non-default rows).
- `src/components/report/invoice/line-items-section.test.tsx` — 11 tests, including the
  quantity input appearing/hiding, Pauschale-only rows having no checkbox, and per-row
  delete.
- `src/test/integration/invoice-totals.integration.test.ts` — 6 tests against the real
  database: totals stored, totals following a removal, re-grossing on a tax-rate change,
  zeroing on delete-all, the four rows seeding on first GET, and deleted rows **not** coming
  back.
