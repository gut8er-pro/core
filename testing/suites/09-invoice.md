# Suite 09: Invoice Tab

## Prerequisites
- Logged in, report created (any type — Invoice is same for all)

---

## 9.1 Invoice Page Layout
- [ ] Tab label: "Invoice"
- [ ] **Invoice banner** (top): green background, shows "Invoice Amount: 234,00 €" and "Before tax 277,00 €"
- [ ] "Preview Invoice" button on banner
- **Figma:** `design/Main report flow/16-Gut8erPRO - Edit  _ Invoice.png`

## 9.2 Invoice Details Section (collapsible)
- [ ] Section title: "Invoice Details" with info icon
- [ ] **Settings** subsection:
  - **Recipient**: contact picker (Individual/Group/Document icon buttons)
  - **Invoice Number**: auto-generated (format: HB-XXXX-YYYY), editable
  - **Date**: date picker
  - **Payout delay (optional)**: number input
  - **E-Invoice**: toggle switch (default: on)
- [ ] **Fee Schedule**: dropdown (BVSK selected by default)

## 9.3 Item Details Section
- [ ] BVSK rate table displayed
- [ ] Default line items pre-filled:
  - Basic Fees: 124,00 €
  - 10 Photos / Per Photo: calculated from photo count × 1.50 €
  - Travel Expenses: 40,00 €
  - Writing Costs: 25,00 €
  - Postage & Telephone: 25,00 €
- [ ] Each line item row:
  - Description (text)
  - Special Feature (text, optional)
  - Is Lump Sum (checkbox)
  - Rate (€, numeric)
  - Amount (€, auto-calculated: rate × quantity)
  - Quantity (number, hidden when lump sum)
- [ ] **Lump sum toggle**: check → quantity hidden, amount = rate
- [ ] **Edit rate** → amount recalculates
- [ ] **Edit quantity** → amount recalculates
- [ ] **"Add Row"** green button → adds empty line item
- [ ] Delete row (trash icon) → removes line item
- [ ] Totals at bottom:
  - Net total
  - VAT amount (based on tax rate)
  - Gross total

## 9.4 BVSK Rate Application
- [ ] Click "Apply Rate" or BVSK selector → rates auto-applied
- [ ] Pre-filled amounts match standard BVSK schedule
- [ ] Custom modifications preserved after applying rate

## 9.5 Save & Reload
- [ ] Fill invoice number, date, toggle E-Invoice
- [ ] Modify line item rates
- [ ] Add custom line item
- [ ] **RELOAD** → invoice settings + all line items persist
- [ ] Totals still calculated correctly
