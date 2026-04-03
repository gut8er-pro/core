# Suite 08: Calculation / Valuation Tab

## Prerequisites
- Logged in, report created

---

## 8.1 HS Report — Calculation Tab

### Page Layout
- [ ] Tab label: "Calculation" with completion badge
- [ ] "Upload Image to Auto-fill" button (top right, green outline)
- [ ] "Repair and Valuation Providers" banner with settings link

### Vehicle Value Section (left column)
- [ ] **Replacement Value**: currency input (€ prefix)
- [ ] **Tax Rate**: dropdown (0%, 7%, 19%)
- [ ] **Residual Value**: currency input
- [ ] **Diminution in Value**: currency input
- [ ] **Additional Costs**: "+ Add" button → adds description + amount row
- [ ] **Damage Class**: text input

### Repair Section (right column)
- [ ] **Wheel Alignment**: dropdown (not required/required/completed)
- [ ] **Body Measurements**: dropdown
- [ ] **Body Paint**: dropdown (not required/partial/full)
- [ ] **Plastic Repair**: checkbox
- [ ] **Repair Method**: text
- [ ] **Risks**: text

### Loss of Use Section
- [ ] **Dropout Group**: dropdown (Groups A-N)
- [ ] **Cost per Day**: currency input (€)
- [ ] **Rental Car Class**: dropdown (Class 1-7)
- [ ] **Repair Time (Days)**: number
- [ ] **Replacement Time (Days)**: number

### Correction Calculation Section (HS only)
- [ ] Tabs: DAT | Manual | AI
- [ ] Result display area
- [ ] Correction cards at bottom: green gradient cards showing values

### Result Cards (HS only)
- [ ] "Result without repair" green card with € value + edit icon
- [ ] "Result with repair" green card with € value + edit icon

### Save & Reload
- [ ] Fill all fields → "Update Report" → toast
- [ ] **RELOAD** → all values persist
- **Figma:** `design/Main report flow/14-Gut8erPRO - Edit  _ Calculation.png`

---

## 8.2 DAT Modal
- [ ] Click "Repair and Valuation Providers" banner → opens modal
- [ ] Modal: "Repair Cost Calculation" heading
- [ ] DAT logo + provider info
- [ ] Fields: Location, DEKRA Used checkbox, Mechanics, Body, Paintwork
- [ ] "Verification result" label
- [ ] "Additional Costs" label
- [ ] Close/Save buttons
- **Figma:** `design/Main report flow/15-Modal.png`

---

## 8.3 BE Report — Valuation Tab

### Page Layout
- [ ] Tab label: **"Valuation"** (not "Calculation")
- [ ] "Value and Repair Calculation" heading

### DAT Valuation (left side)
- [ ] DAT logo
- [ ] **General condition**: dropdown (well maintained/good/fair/poor)
- [ ] **Taxation**: button group chips (0% / 2.4% / 19%)
- [ ] "Quick Valuation" green button
- [ ] "Detail Valuation" green button

### Manual Valuation (right side)
- [ ] **Data source**: dropdown with logo (mobile.de, AutoScout24, DAT)
- [ ] Results: **Max** (€), **Avg** (€), **Min** (€)
- [ ] **Date**: MM/YYYY input
- [ ] "Calculate" green button → "Remove Calculation" after calc

### Correction Calculation (BE has this)
- [ ] Tabs: DAT | Manual | AI
- [ ] Present for BE

### Result Cards (BE - different labels)
- [ ] "Valuation Results" card (not "Result without repair")
- [ ] "Valuation after Correction" card

### Save & Reload
- [ ] Fill BE fields: generalCondition, taxation, valuationMax/Avg/Min, valuationDate
- [ ] **RELOAD** → all persist
- **Figma:** `design/Main report flow/14b-Calculation - Manual.png`

---

## 8.4 KG Report — Calculation Tab
- [ ] Tab label: "Calculation"
- [ ] Vehicle Value + Repair sections: same as HS ✓
- [ ] Loss of Use: same as HS ✓
- [ ] **NO Correction Calculation section** (hidden)
- [ ] **NO Result cards** (hidden)

---

## 8.5 OT Report — Valuation Tab
- [ ] Tab label: **"Valuation"**
- [ ] Heading: "Vehicle Value"
- [ ] Simple layout:
  - **Market Value**: currency input (€)
  - **Replacement Value**: currency input (€)
- [ ] "Restoration Value" expandable green button → expands to show:
  - **Base Vehicle Value**: currency input (€)
  - **Restoration Value**: currency input (€)
- [ ] "Remove Additional Value" button (after expanding)
- [ ] **Total Cost** card: green gradient showing calculated total
- [ ] **NO Correction Calculation** (hidden)
- [ ] **NO Loss of Use** (hidden)
- [ ] **NO Vehicle Value + Repair 2-column** layout

### Save & Reload
- [ ] Fill marketValue, replacementValue
- [ ] Expand restoration → fill baseVehicleValue, restorationValue
- [ ] **RELOAD** → all OT fields persist
