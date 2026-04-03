# Suite 07: Condition Tab

## Prerequisites
- Logged in, report created

---

## 7.1 Condition Page Layout
- [ ] Tab label: "Condition" with completion badge (e.g. "0/12")
- [ ] "Show missing information" toggle

## 7.2 Vehicle Condition Section (collapsible)
- [ ] Section title: "Vehicle Condition" with info icon
- [ ] Row: **Paint type** (dropdown: Uni 2 Schicht/Metallic/Pearl/Matte), **Hard** (dropdown: Original/Repainted/Mixed), **Paint condition** (dropdown)
- [ ] Row: **General condition** (dropdown: Well maintained/Average/Poor), **Body condition** (dropdown), **Interior condition** (dropdown)
- [ ] Row: **Driving ability** (dropdown: Roadworthy/Limited/Not roadworthy), **Special features** (text)
- [ ] Checkbox pills (toggle-style): **Parking sensors**, **Full service history**, **Test drive performed**, **Error memory read**, **Airbags deployed**
- [ ] Row: **Mileage Read** (number), **Estimate mileage** (number), **Unit** (dropdown: km/miles)
- [ ] **Next MOT**: date picker
- [ ] **Produce Groups**: multi-select or tag input
- [ ] **Notes**: textarea (multiline)
- [ ] All save on blur
- **Figma:** `design/Main report flow/12-Gut8erPRO - Edit  _ Vehicle Paint.png` (top section)

## 7.3 Visual Accident Details — Damage Tab
- [ ] Section title: "Visual Accident Details" with info icon
- [ ] **Damage Manual Setup** toggle (right side)
- [ ] Segmented tab: **Damage** (active, black bg) | **Paint**
- [ ] Car silhouette image (portrait, front facing up)
- [ ] Click on car → damage marker dot appears at click position
- [ ] Click marker → comment popover appears with:
  - "Damage comment" label
  - Text input for comment
  - "Delete marker" link (red)
  - "Save" button (green)
- [ ] Multiple markers can be placed
- [ ] Marker list below diagram: numbered items with comment, Edit/Delete buttons
- [ ] "Add Marker" green button at bottom
- **Figma:** `design/Main report flow/12-01-Vehicle Damages.png`, `12-02-Vehicle Dmages - reading comments.png`, `13-Vehicle Damages diagram.png`

## 7.4 Visual Accident Details — Paint Tab
- [ ] Switch to "Paint" tab
- [ ] **Paint Manual Setup** toggle
- [ ] Legend bar: "Standard View" + 5 color bars with labels:
  - Cyan bar `<70`, Green bar `>=70`, Yellow bar `>160`, Orange bar `>300`, Red bar `>700`
- [ ] Car silhouette centered
- [ ] 11 floating call-out input cards positioned around car:
  - **Center**: Hood (top), Roof (middle), Trunk (bottom)
  - **Left column**: Front Left Fender, Left Front Door, Left Rear Door, Left Rear Fender
  - **Right column**: Front Right Fender, Right Front Door, Right Rear Door, Right Rear Fender
- [ ] Each call-out: white card with shadow, rounded-xl, "μm" placeholder
- [ ] Type value (e.g. "154") → card border turns color-coded:
  - Enter 50 → border cyan (#49DCF2)
  - Enter 100 → border green (#52D57B)
  - Enter 200 → border yellow (#F4CA14)
  - Enter 400 → border orange (#F47514)
  - Enter 800 → border red (#F41414)
- [ ] Value displays as "154μm" after blur
- [ ] Left and right columns equidistant from car (symmetric)
- [ ] "Add Marker" green button at bottom
- **Figma:** `design/Main report flow/13-Vehicle Paint.png`

## 7.5 Tires Section (collapsible)
- [ ] Section title: "Tires" with info icon
- [ ] Segmented tab: **First Set of Tires** | **Second Set of Tires**
- [ ] Position tabs within set: **VL** | **VR** | **HL** | **HR**
- [ ] Per tire position:
  - **Tire size**: text input
  - **Profile Level**: text/number input
  - **Manufacturer**: text input
  - **Tire usability**: rating selector (1-5 icons, click to select)
  - **Tire type**: button group (Summer ☀️, Winter ❄️, All-Season 🌡️)
- [ ] Set-level controls:
  - "Match and Alloy" checkbox
  - "Major Area" button
  - "Match the Set" green button
- [ ] Switch between VL/VR/HL/HR → different tire data per position
- [ ] Switch to Second Set → fresh fields
- [ ] All tire data saves on blur

## 7.6 Prior and Existing Damage Section (collapsible)
- [ ] Section title: "Prior and Existing Damage" with info icon
- [ ] Tab: **Damage Notes** | **Damage Description**
- [ ] Damage Notes tab:
  - **Previous damage reported**: textarea
  - **Existing damage (not reported)**: textarea
  - **Subsequent damage**: textarea (full width)
- [ ] Damage Description tab:
  - Textarea for free-form description

## 7.7 OT-Specific Condition Sections
- [ ] **Value Increasing Features** section (OT only):
  - Originality dropdown
  - Tag input fields: Rare equipment, Condition, Technical features, Mileage, History & documentation, Rarity & market demand
  - Particulars/notes text
  - Market Reputation dropdown
- [ ] **Vehicle Grading** section (OT only):
  - Grading/Paint toggle tabs
  - Overall Condition score selector (Non/1/2/3/4/5 with +/-)
  - 10-category grid with scores: Bodywork, Tires, Paint, Interior, Chrome, Engine bay, Seals, Engine, Glass, Trunk
  - "Automatically calculate grade" toggle

## 7.8 Save & Reload
- [ ] Fill condition fields → save
- [ ] Place 2+ damage markers with comments → save
- [ ] Enter paint thickness values → save
- [ ] Fill tire data → save
- [ ] Fill prior damage text → save
- [ ] **RELOAD** → ALL persists: condition selects, damage markers, paint values, tire data, damage text
- [ ] Tab badge updates correctly
