# 07 — Invoice line-item "Betrag" column always renders 0,00 €

Status: resolved
Type: bug
Severity: medium

Every line item shows a per-row amount of 0,00 € no matter what is entered, on an invoice the
client receives.

## Confirmed on the live app

On report `1a65cb53-b5a2-44c4-9133-17278bf8936f` with one line item at Satz **890**:

- header banner: **Rechnungsbetrag 1.059,10 €**, "Vor Steuer 890,00 €" — correct (890 × 1.19)
- the row's own **Betrag** column: **0,00 €**

So the totals are right and only the per-row column is wrong.

## Cause

`src/components/report/invoice/line-items-section.tsx:66-70`

```tsx
const amountVal =
  parseFloat(
    document.querySelector<HTMLInputElement>(`[name="lineItems.${index}.amount"]`)
      ?.value ?? '0',
  ) || 0
```

There is no `lineItems.N.amount` input in the DOM. The numeric field is registered as
`lineItems.${index}.rate` at line 120. The query always misses, `?? '0'` kicks in, and the column
is hard-zero.

Two things are wrong beyond the name mismatch:

1. **It reads the DOM during render.** `CLAUDE.md` explicitly requires the opposite — *"Form data
   read via `getValues()` (not DOM queries) for React Hook Form compatibility"*.
2. **It cannot re-render.** Even with the right selector, a `document.querySelector` read isn't
   reactive, so the column would not update as the user types.

## Fix

```tsx
const rate = useWatch({ control, name: `lineItems.${index}.rate` })
const qty  = useWatch({ control, name: `lineItems.${index}.quantity` }) ?? 1
const amountVal = (parseFloat(String(rate)) || 0) * (parseInt(String(qty), 10) || 1)
```

`invoice-banner.tsx:19` already uses `useWatch({ control, name: 'lineItems' })` correctly — which
is exactly why the banner total is right while the row is not. Follow that pattern.

## Note for whoever picks this up

I initially mis-read this as "line items never persist at all". That was wrong — they persist
fine. `GET /api/reports/<id>/invoice` returns `lineItems` at the **top level** of the response,
alongside `invoice`, not nested inside it. Only the per-row display is broken.

## Resolution (2026-09-15)

`src/components/report/invoice/line-items-section.tsx` — the row body moved into a `LineItemRow`
component so the prescribed `useWatch` on `lineItems.N.rate` and `lineItems.N.quantity` can be
called at a component's top level; a watch inside `fields.map()` would change the hook count on
every appended row. The `document.querySelector` read is gone; `quantity` was confirmed against
`InvoiceFormData` in `src/components/report/invoice/types.ts`.

`src/components/report/invoice/line-items-section.test.tsx` (new) — 5 cases covering rate-only,
rate × quantity, a missing quantity, an empty rate and two rows amounting independently.
