# Suite 05: Accident Info / Customer Tab

## Prerequisites
- Logged in, report created with photos generated

---

## 5.1 Common Elements (all report types)
- [ ] Tab bar: 5 tabs with completion badges
- [ ] "Show missing information" toggle with section count text
- [ ] Completion percentage in header area
- [ ] "Update Report" button at bottom (green)

## 5.2 HS Report — Full Accident Info

### Page Header
- [ ] Tab label: "Accident Info" (active, black bg)
- [ ] Page heading: "Accident Overview"
- [ ] Completion: shows percentage or section count

### Accident Information Section (collapsible)
- [ ] Section title with chevron + info icon
- [ ] **Accident Day**: date input (calendar picker)
- [ ] **Accident Scene**: text input
- [ ] Both fields save on blur

### Claimant Information Section (collapsible)
- [ ] Section title: "Claimant Information" with info icon
- [ ] **Company**: text input (full width)
- [ ] Row: **Salutation** (dropdown: Mr/Mrs/Dr/Prof/Company), **First Name**, **Last Name**
- [ ] Row: **Street & house number or PO box**, **Postcode**, **Location**
- [ ] Row: **Email**, **IBAN**, **First number (Claimant)**
- [ ] **License Plate**: text input + formatted plate preview (blue badge: "CE : N 668")
- [ ] 3 Checkboxes (green filled with white check):
  - **Eligible for input tax deduction** → toggling shows/hides VAT ID field
  - **Is the vehicle owner**
  - **Represented by lawyer** → toggling shows lawyer name dropdown
- [ ] **VAT ID field** (conditional): appears when tax deduction checked
- [ ] **Involved Lawyer dropdown** (conditional): appears when lawyer checked
- [ ] All fields save on blur
- **Figma:** `design/Main report flow/06-Gut8erPRO - Edit  _ Accident Overview.png`, `06b-*.png`, `06c-*.png`

### Opponent in Accident Section (collapsible)
- [ ] Section title: "Opponent in Accident" with info icon
- [ ] Same field layout as Claimant (Company, Salutation, Name, Address, Contact)
- [ ] Additional: **Insurance Company**, **Insurance Number**, **Claim Number**
- [ ] All fields save on blur
- **Figma:** `design/Main report flow/06d-Accident Overview - Opponent.png`

### Visits Section (collapsible)
- [ ] Section title: "Visits" with info icon
- [ ] Visit type radio chips: "Claimant Residence", "Claimant Office", "Other"
- [ ] Address fields: Street, Postcode, Location
- [ ] Row: **Date** (date picker), **Expert** (text), **Vehicle condition** (dropdown: drivable/conditionally drivable/not drivable/total loss)
- [ ] Add visit button → adds another visit row
- [ ] Fill visit → save on blur → **RELOAD** → visit data persists

### Expert Opinion Characteristics (collapsible)
- [ ] Section title with info icon
- [ ] **Expert name**: text (pre-filled from user profile)
- [ ] Row: **File number**, **Case date** (date picker)
- [ ] **Order was placement**: dropdown (direct/via lawyer/via insurance)
- [ ] **Issued date**: date picker
- [ ] **Order by claimant**: checkbox
- [ ] **Mediator**: text

### Signatures Section (collapsible)
- [ ] Section title: "Signatures" with info icon
- [ ] "Permission type" label
- [ ] 3 signature type cards: **Lawyer**, **Data Permission**, **Cancellation**
- [ ] Each shows icon + label, click to select
- [ ] Active type highlighted with green border
- [ ] Signature area below: shows existing signature or "Click to sign"
- [ ] "Remove" and "Update Signature" buttons
- [ ] **Click to sign** → opens signature modal
- **Figma:** `design/Main report flow/08-Signature-default-selected.png`, `08-01-Signature added.png`

### Signature Modal
- [ ] "Your Signature" heading
- [ ] Two tabs: "Draw Signature" (active) and "Upload Signature"
- [ ] Canvas area for freehand drawing
- [ ] Legal text: "By signing this, you agree to..."
- [ ] "Cancel" and "Save" buttons (green)
- [ ] Draw on canvas → save → signature appears in section
- [ ] Signature persists after reload
- **Figma:** `design/Main report flow/07-Gut8erPRO - Edit  _ Digital Signature.png`

### Save & Reload
- [ ] Click "Update Report" → toast "Report updated"
- [ ] **RELOAD PAGE** → ALL fields persist (accident, claimant, opponent, visits, expert, signature)
- **Figma:** `design/Main report flow/09-Gut8erPRO - Edit  _ Accident Overview-1.png`

---

## 5.3 BE Report — Accident Info Differences
- [ ] Tab label: "Accident Info" (same as HS)
- [ ] Heading: "Accident Overview" (same)
- [ ] **NO Accident Information section** (Day/Scene hidden)
- [ ] Claimant Information: present with all fields + 3 checkboxes
- [ ] **NO Opponent in Accident section** (hidden)
- [ ] Visits: present
- [ ] Expert Opinion: present
- [ ] Signatures: present with 3 types

## 5.4 KG Report — Accident Info (same as HS)
- [ ] Tab label: "Accident Info"
- [ ] ALL sections present (identical to HS)
- [ ] Accident Information ✓
- [ ] Claimant with 3 checkboxes ✓
- [ ] Opponent ✓
- [ ] Visits ✓
- [ ] Expert ✓
- [ ] Signatures ✓

## 5.5 OT Report — Customer Tab Differences
- [ ] Tab label: **"Customer"** (not "Accident Info")
- [ ] Heading: **"Client Information"** (not "Accident Overview")
- [ ] **NO Accident Information section**
- [ ] Section title: **"Client"** (not "Claimant Information")
- [ ] Only **2 checkboxes**: "Eligible for input tax deduction" + "Is the vehicle owner"
- [ ] **NO "Represented by lawyer"** checkbox
- [ ] **NO Opponent in Accident section**
- [ ] Visits section: includes **"Present" subsection** with checkboxes:
  - "Expert [name]"
  - "Client"
  - "Workshop Employee"
- [ ] Expert Opinion: present
- [ ] Signatures: present
