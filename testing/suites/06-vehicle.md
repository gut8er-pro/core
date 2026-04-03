# Suite 06: Vehicle Tab

## Prerequisites
- Logged in, report created (any type — Vehicle is same for all)

---

## 6.1 Vehicle Page Layout
- [ ] Tab label: "Vehicle" with completion badge (e.g. "0/4")
- [ ] "Show missing information" toggle
- [ ] Completion percentage in header

## 6.2 Vehicle Informations Section (collapsible)
- [ ] Section title: "Vehicle Informations" with info icon
- [ ] **VIN**: text input (max 17 characters)
- [ ] **Vehicle identification number or DATSCode**: text
- [ ] Row: **Market Index**
- [ ] Row: **Manufacturer**, **Main Type**, **Subtype**
- [ ] **KBA Number**: text (max 10 chars)
- [ ] Fill VIN → auto-fills other fields if DAT integration connected
- [ ] All fields save on blur
- **Figma:** `design/Main report flow/10-Gut8erPRO - Edit  _ Vehicle.png`

## 6.3 Specification Section (collapsible)
- [ ] Section title: "Specification" with info icon
- [ ] Row: **Power (kW)**, **Power (HP)** — auto-calculates (kW × 1.36 = HP)
- [ ] Row: **Engine Design** (dropdown: Inline/V-Type/Boxer/Rotary/Other), **Engine Displacement** (number, ccm)
- [ ] Row: **Cylinders** (number), **Transmission** (dropdown: Manual 5/6-speed, Automatic, CVT, DCT)
- [ ] Row: **First registration** (date), **Last registration** (date)
- [ ] **Source of technical data**: text
- [ ] kW→HP conversion: enter 110 kW → HP shows 150
- [ ] All fields save on blur

## 6.4 Vehicle Details Section (collapsible)
- [ ] Section title: "Vehicle Details" with info icon
- [ ] **Vehicle Type**: icon selector grid (Sedan, Compact, SUV, Wagon, Coupe, Convertible, Van)
  - Click icon → highlighted with green border
- [ ] **Motor Type**: icon selector grid (Petrol, Diesel, Electric, Hybrid, Gas)
  - Click icon → highlighted
- [ ] **Axles**: number chip selector (1-5), green highlight on selected
- [ ] **Driven Axles**: number chip selector (1-5)
- [ ] **Doors**: number chip selector (0-4)
- [ ] **Seats**: number chip selector (0-4)
- [ ] **Previous Owners**: number chip selector (0-4, first = "New")
- [ ] Each chip click saves immediately
- **Figma:** `design/Main report flow/11-Gut8erPRO - Edit  _ Vehicle Default.png`

## 6.5 Save & Reload
- [ ] Fill all sections → click "Update Report" → toast
- [ ] **RELOAD** → all data persists:
  - VIN, manufacturer, type, subtype ✓
  - Power kW/HP, engine, cylinders, transmission ✓
  - Registration dates ✓
  - Vehicle type icon selection ✓
  - Motor type icon selection ✓
  - Axles/doors/seats/owners chip selections ✓
- [ ] Tab completion badge updates (e.g. "3/4" → "4/4" → green checkmark)
