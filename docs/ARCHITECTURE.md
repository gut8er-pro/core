# docs/ARCHITECTURE.md — Gut8erPRO Full Application Specification

> Generated from analysis of all design screens in `/design/`.
> This is the blueprint. Get it right before writing code.

---

## 1. SCREEN INVENTORY

### 1.0 Landing Page (Welcome Screen)

| Field | Value |
|-------|-------|
| **Route** | `/` |
| **Description** | Marketing landing page for unauthenticated users. Hero section with headline "Professional Vehicle Assessment Made Simple", stats badges (-35% report time, -60% less manual work, 2000+ reports), feature cards (DAT Integration, Real Time Analytics, AI Evaluation Tool, Editing Photos), FAQ accordion. |
| **Navigates to** | Login (`/login`), Signup (`/signup`) |
| **Navigates from** | Direct URL, logout redirect |
| **Data displayed** | Static marketing content |
| **User actions** | "Start Free Trial" CTA, "Sign Up for Free" CTA, Login link, expand/collapse FAQ items |
| **Form fields** | None |

---

### 1.1 Login

| Field | Value |
|-------|-------|
| **Route** | `/login` |
| **Description** | Split-screen login. Left: branding panel with illustration and stat badges. Right: login form. |
| **Navigates to** | Dashboard (`/dashboard`), Signup (`/signup`), Forgot Password (`/forgot-password`) |
| **Navigates from** | Landing, Signup, any unauthenticated redirect |
| **Data displayed** | None |
| **User actions** | Enter credentials, toggle password visibility, login, social login (Google/Apple), navigate to signup, forgot password |
| **Form fields** | |

| Field | Type | Validation |
|-------|------|-----------|
| Email address | email input | Required, valid email format |
| Password | password input (with visibility toggle) | Required, min 8 chars |

---

### 1.2 Signup — Step 1: Account

| Field | Value |
|-------|-------|
| **Route** | `/signup` or `/signup/account` |
| **Description** | First step of 5-step signup wizard. Left sidebar shows step progress with numbered stepper. Right side shows account creation form. |
| **Navigates to** | Step 2: Personal, Login |
| **Navigates from** | Login, Landing |
| **User actions** | Fill form, Continue, Cancel, navigate to Login |
| **Form fields** | |

| Field | Type | Validation |
|-------|------|-----------|
| Email address | email input | Required, valid email, unique |
| Password | password input (with toggle) | Required, min 8 characters |
| Confirm password | password input | Required, must match password |

---

### 1.3 Signup — Step 2: Personal

| Field | Value |
|-------|-------|
| **Route** | `/signup/personal` |
| **Description** | Personal details. Same stepper sidebar (step 1 shows green check). |
| **Navigates to** | Step 3: Business |
| **Navigates from** | Step 1: Account |
| **User actions** | Fill form, Continue, Back |
| **Form fields** | |

| Field | Type | Validation |
|-------|------|-----------|
| Title | select dropdown (Mr, Mrs, Dr, etc.) | Required |
| First name | text input | Required |
| Last name | text input | Required |
| Phone number | phone input (with country code +49) | Required, valid phone |
| Professional qualification | text input | Optional (placeholder: "eg. Kfz-Sachverständiger, Dipl.-Ing.") |

---

### 1.4 Signup — Step 3: Business

| Field | Value |
|-------|-------|
| **Route** | `/signup/business` |
| **Description** | Company/business information for invoices and reports. |
| **Navigates to** | Step 4: Plan |
| **Navigates from** | Step 2: Personal |
| **User actions** | Fill form, Continue, Back |
| **Form fields** | |

| Field | Type | Validation |
|-------|------|-----------|
| Company name | text input | Required |
| Street & house number | text input | Required |
| Postcode | text input | Required, German postcode format (5 digits) |
| City | text input | Required |
| Tax ID (Steuernummer) | text input | Required, German tax ID format |
| VAT ID (USt-IdNr.) | text input | Optional, DE + 9 digits format |

---

### 1.5 Signup — Step 4: Plan

| Field | Value |
|-------|-------|
| **Route** | `/signup/plan` |
| **Description** | Plan selection (Free vs Pro) with payment details. Pro card has "MOST POPULAR" badge and is pre-selected. Payment form appears below plan cards (Stripe integration). |
| **Navigates to** | Step 5: Integrations |
| **Navigates from** | Step 3: Business |
| **User actions** | Select plan, enter payment details (if Pro), Continue, Back |
| **Data displayed** | Plan comparison (features list), pricing |
| **Form fields** | |

| Field | Type | Validation |
|-------|------|-----------|
| Plan selection | radio (Free / Pro) | Required |
| Card number | Stripe card element | Required if Pro |
| Expiry date | MM/YY input | Required if Pro |
| CVC | 3-digit input | Required if Pro |
| Cardholder name | text input | Required if Pro |

**Plan Details:**
- **Free:** €0/forever — Unlimited reports, Manual data entry, PDF export, Email support. No AI, no image analysis.
- **Pro:** €49/month (14 days free) — Everything in Free + AI-powered auto-fill, Image damage analysis, VIN auto-detection, Priority support, Custom branding.

---

### 1.6 Signup — Step 5a: Integrations (Provider Selection)

| Field | Value |
|-------|-------|
| **Route** | `/signup/integrations` |
| **Description** | Connect calculation provider. Shows 3 provider cards: DAT (available), Audatex (Coming Soon), GT Motive (Coming Soon). Skippable. |
| **Navigates to** | Step 5b (credentials form) or Signup Complete |
| **Navigates from** | Step 4: Plan |
| **User actions** | Select provider, skip step, Back, Create an Account |

---

### 1.7 Signup — Step 5b: Integrations (DAT Credentials)

| Field | Value |
|-------|-------|
| **Route** | `/signup/integrations` (same route, form appears on provider select) |
| **Description** | DAT SilverDAT3 credential entry. Appears when DAT card is selected. |
| **Navigates to** | Signup Complete |
| **Navigates from** | Step 5a |
| **Form fields** | |

| Field | Type | Validation |
|-------|------|-----------|
| Username | text input | Required if DAT selected |
| Password | password input | Required if DAT selected |

---

### 1.8 Signup Complete

| Field | Value |
|-------|-------|
| **Route** | `/signup/complete` |
| **Description** | Success screen. Large green checkmark, "Welcome aboard!" heading, plan badge ("Pro Plan · 14-day free trial started"), three quick-start cards (Create Report, Enjoy AI, Settings), two CTAs. |
| **Navigates to** | Create Report (`/reports/new`), Dashboard (`/dashboard`) |
| **Navigates from** | Step 5 |
| **User actions** | "Create your first report", "Go to Dashboard" |

---

### 2.1 Report — Upload Photos (Single View)

| Field | Value |
|-------|-------|
| **Route** | `/reports/:id/gallery` or `/reports/new` |
| **Description** | Initial photo upload screen. Left sidebar with instructions (good lighting, JPG/PNG, max 20 images) and suggested photo types (Vehicle Diagonals, Damage Overview, Document Shot). Main area shows single photo viewer with filmstrip thumbnails at bottom. Actions on photo: edit/annotate icon, delete icon. |
| **Navigates to** | Edit Gallery, Report Details, Export & Send |
| **Navigates from** | Dashboard, Signup Complete |
| **User actions** | Upload photos, view photo, delete photo, edit/annotate photo, add more photos (+), Generate Report button |
| **Data displayed** | Uploaded photos, instructions |

---

### 2.2 Report — Edit Gallery (Grid View)

| Field | Value |
|-------|-------|
| **Route** | `/reports/:id/gallery` (same, different view mode) |
| **Description** | Grid layout of all uploaded photos (2-column grid). Each photo has edit and delete action buttons overlaid. Thumbnail filmstrip at bottom. Same instruction sidebar. |
| **Navigates to** | Single photo view, annotation modal |
| **User actions** | View photo, edit/annotate, delete, add more, Generate Report |

---

### 2.3 Report — Gallery (Report Created, Sidebar Navigation)

| Field | Value |
|-------|-------|
| **Route** | `/reports/:id/gallery` |
| **Description** | After report generation, the left sidebar changes to report navigation (Gallery, Report Details, Export & Send). Title changes to "Create New Report" with "HQ" badge. Photo viewer still present. |
| **Navigates to** | Report Details tabs, Export & Send |
| **User actions** | Navigate sidebar sections, view/add photos |

---

### 2.4 Report — Draw / Annotate Photo (Modal)

| Field | Value |
|-------|-------|
| **Route** | Modal overlay on gallery |
| **Description** | Full-screen modal for photo annotation. Left: photo with drawing tools (pen, crop, circle, rectangle, arrow, delete). Green rectangle annotation visible on photo. Bottom: color palette (12+ colors). Right panel: "Description" with AI-generated damage description text. Top-left: photo filename and timestamp. |
| **Navigates to** | Back to gallery (close modal) |
| **User actions** | Draw shapes on photo, select colors, crop, add arrows, read/edit AI description, navigate between photos (left/right arrows), close |
| **Tools available** | Pen, Crop, Circle, Rectangle, Arrow/line, Undo, Delete. Color picker with 12+ preset colors. |

---

### 2.5 Report — Documents View (Modal)

| Field | Value |
|-------|-------|
| **Route** | Modal overlay |
| **Description** | Document viewer for scanned vehicle documents (Zulassungsbescheinigung). Shows the document with highlighted/extracted fields (green highlights on detected text). Same annotation toolbar at bottom. AI auto-extracts data from document. |
| **Navigates to** | Back to gallery |
| **User actions** | View document, annotate, navigate between photos |

---

### 2.6 Report Details — Accident Info Tab

| Field | Value |
|-------|-------|
| **Route** | `/reports/:id/details/accident-info` |
| **Description** | Longest form in the app. Horizontal tab bar at top: Accident Info (active), Vehicle, Condition, Calculation, Invoice. Toggle "Show missing information" at top. Completion percentage shown (50% Complete). Collapsible sections with chevron. |
| **Navigates to** | Other report detail tabs, Signature modal |
| **Form sections & fields** | |

**Section: Accident Information**

| Field | Type | Validation |
|-------|------|-----------|
| Accident Day | date picker (DD/MM/YYYY) | Required |
| Accident Scene | text input | Required |

**Section: Claimant Information**

| Field | Type | Validation |
|-------|------|-----------|
| Company | text input | Optional |
| Salutation | select (Mr, Mrs, etc.) | Required |
| First Name | text input | Required |
| Last Name | text input | Required |
| Street & house number or PO box | text input | Required |
| Postcode | text input | Required |
| Location | text input | Required |
| Email | email input | Required |
| BMW (vehicle make?) | text input | Auto-filled from vehicle |
| First number (Claimant) | text input | Required |
| License plate | display (styled plate: CE · N 668) | Auto-detected from photos |
| Eligible for input tax deduction | checkbox | Optional |
| Is the vehicle owner | checkbox | Optional |
| Represented by a lawyer | checkbox | Optional |
| Involved Lawyer | select dropdown | Conditional (if represented) |

**Section: Opponent in Accident**

| Field | Type | Validation |
|-------|------|-----------|
| (collapsed by default) | — | — |

**Section: Visits**

| Field | Type | Validation |
|-------|------|-----------|
| Visit type | radio chips (Claimant Residence, Claimant Office, Other) | Required |
| Street & house number or PO box | text input | Required |
| Postcode | text input | Required |
| Location | text input | Required |
| Date | date picker | Required |
| Expert | text input (pre-filled: Ketn Torres) | Required |
| Vehicle condition | select | Required |

**Section: Expert Opinion Characteristics**

| Field | Type | Validation |
|-------|------|-----------|
| Expert name | text input | Pre-filled from user profile |
| File number | text input | Required |
| Case date | date picker | Optional |
| Order was placement | select | Required |
| Issued date | date picker | Optional |
| Order by claimant | checkbox | Optional |
| Mediator | text input | Optional |

**Section: Signatures**

| Field | Type | Validation |
|-------|------|-----------|
| Permission Use | card select (Lawyer, Data Permission, Cancellation) | Required |
| Signature | draw/upload (modal) | Required |

---

### 2.7 Report Details — Digital Signature Modal

| Field | Value |
|-------|-------|
| **Route** | Modal on Accident Info |
| **Description** | "Your Signature" modal with two tabs: "Draw Signature" and "Upload Signature". Canvas area for drawing. Legal disclaimer text. Cancel/Save buttons. |
| **User actions** | Switch between draw/upload, draw signature on canvas, upload image, Cancel, Save |

---

### 2.8 Report Details — Vehicle Tab

| Field | Value |
|-------|-------|
| **Route** | `/reports/:id/details/vehicle` |
| **Description** | Vehicle identification and specification. Shows completion "10% Complete". Tab bar shows "Vehicle 3/4" with check on Accident Info. |
| **Form sections & fields** | |

**Section: Vehicle Informations**

| Field | Type | Validation |
|-------|------|-----------|
| Vehicle identification number (VIN) | text input | Required, 17 chars |
| DATSCode | text input | Optional (auto from DAT) |
| Market Index | text input | Optional |
| Manufacturer | text input | Auto-filled from VIN/DAT |
| Main Type | text input | Auto-filled |
| Subtype | text input | Auto-filled |
| Key number (KBA) | text input | Optional |

**Section: Specification**

| Field | Type | Validation |
|-------|------|-----------|
| Power (kW) | number input | Optional |
| Power (HP) | number input | Optional (auto-calc from kW) |
| Engine Design | select (Inline, V, Boxer, etc.) | Optional |
| Cylinder | number input | Optional |
| Transmission | select (Manual, Automatic, etc.) | Optional |
| Engine displacement (ccm) | number input | Optional |
| First registration | date picker | Required |
| Last registration | date picker | Optional |
| Source of technical data | text input (e.g., "KBA (Kraftfahrt-Bundesamt)") | Optional |

**Section: Vehicle Details**

| Field | Type | Validation |
|-------|------|-----------|
| Vehicle Type | icon selector (Compact, Sedan, SUV, Van, Truck, etc.) | Required |
| Motor Type | icon selector (Petrol, Diesel, Electric, Hybrid, etc.) | Required |
| Axles | number chip selector (1-5+) | Required |
| Driven by this | number chip selector (1-5+) | Required |
| Doors | number chip selector (0-5+) | Required |
| Seats | number chip selector (0-5+) | Required |
| Previous Owners | number chip selector (New, 1-4+) | Required |

---

### 2.9 Report Details — Condition Tab

| Field | Value |
|-------|-------|
| **Route** | `/reports/:id/details/condition` |
| **Description** | Vehicle condition assessment. Shows "61% Complete". Contains condition dropdowns, visual car diagram (top-down SVG), tire details, and prior damage section. |
| **Form sections & fields** | |

**Section: Vehicle Condition**

| Field | Type | Validation |
|-------|------|-----------|
| Paint type | select (Uni/2-Schicht, etc.) | Required |
| Hard | text input | Optional |
| Paint condition | text input | Optional |
| General condition | select | Optional |
| Body condition | select | Optional |
| Interior condition | select | Optional |
| Driving ability | select (Good, etc.) | Optional |
| Special features | text input | Optional |
| Parking sensors | checkbox | Optional |
| Mileage Read | number input | Required |
| Estimate mileage | number input | Optional |
| Unit(s) km | text input | Auto |
| Next MOT (optional) | date picker | Optional |
| Checkboxes | multi-select chips (Full service history, Test drive performed, Error memory read, Airbags deployed) | Optional |
| Produce Groups | multi-select with avatars/icons | Optional |
| Notes | textarea | Optional |

**Section: Visual Accident Details**

| Field | Type | Validation |
|-------|------|-----------|
| Manual Setup | toggle switch | Default off |
| Tab: Damages / Paint | tab switcher | — |
| Car diagram | interactive SVG (top-down view) | — |
| Damage markers | clickable pins on diagram with comment input | Optional |
| Add Marker | button | — |

**Damages sub-tab:** Place markers on car diagram, add comment per marker. Tooltip shows comment text.

**Paint sub-tab:** Place markers showing paint thickness (µm). Color-coded legend: Blue <70, Green ≥70, Yellow >160, Orange >300, Red >700.

**Section: Tires**

| Field | Type | Validation |
|-------|------|-----------|
| First Set of Tires / Second Set of Tires | tab switcher | — |
| Position tabs | VL, VR, HL, HR | — |
| Tire size | text input | Optional |
| Profile level | text input | Optional |
| Manufacturer | text input | Optional |
| Tires usability | rating (3 circles) | Optional |
| Match and Alloy | checkbox | Optional |
| Align Axes | button | — |
| Match Tire Set | button | — |

**Section: Prior and Existing Damage**

| Field | Type | Validation |
|-------|------|-----------|
| Tab: Damage Notes / Damage Inspection | tab switcher | — |
| Previous damage (reported) | textarea | Optional |
| Existing damage (not reported) | textarea | Optional |
| Subsequent damage | textarea | Optional |

---

### 2.10 Report Details — Calculation Tab

| Field | Value |
|-------|-------|
| **Route** | `/reports/:id/details/calculation` |
| **Description** | Value and repair calculation. "Upload Image to Auto-fill" button (AI Pro feature). Shows "30% Complete". Link to "Repair and Valuation Providers" settings. |
| **Form sections & fields** | |

**Section: Vehicle Value**

| Field | Type | Validation |
|-------|------|-----------|
| Replacement value | currency input (€) | Required |
| Choose tax rate | select | Required |
| Residual value | currency input | Optional |
| Diminution in value | currency input | Optional |

**Section: Repair**

| Field | Type | Validation |
|-------|------|-----------|
| Wheel alignment | select | Optional |
| Body measurements | select | Optional |
| Body paint (optional) | select | Optional |
| Plastic Repair | checkbox | Optional |
| Repair Method | text input | Optional |
| Risks | text input | Optional |
| Damage class | text input | Optional |
| Additional Costs | button (opens sub-form) | Optional |

**Section: Loss of Use**

| Field | Type | Validation |
|-------|------|-----------|
| Dropout group | select | Optional |
| Cost per Day (€) | currency input | Optional |
| Rental Car Class | select | Optional |
| Repair time (days) | number input | Optional |
| Replacement time (days) | number input | Optional |

---

### 2.11 Report Details — Repair Cost Calculator Modal (DAT)

| Field | Value |
|-------|-------|
| **Route** | Modal on Calculation tab |
| **Description** | DAT integration modal. Shows DAT logo. Workshop settings and Market Value lookup. |
| **Form fields** | |

| Field | Type | Validation |
|-------|------|-----------|
| Location | select | Optional |
| DEKRA set are used | checkbox | Optional |
| Mechanics | text input | Optional |
| Body | text input | Optional |
| Paintwork | text input | Optional |
| Market Value (DAT nesto) | link/button to external | — |

---

### 2.12 Report Details — Invoice Tab

| Field | Value |
|-------|-------|
| **Route** | `/reports/:id/details/invoice` |
| **Description** | Invoice generation. Green banner at top shows total "Invoice Amount: 234,00 €" with "Before tax 277,00€" and "Preview Invoice" button. |
| **Form sections & fields** | |

**Section: Settings**

| Field | Type | Validation |
|-------|------|-----------|
| Recipient | contact picker (avatar + buttons) | Required |
| Invoice number | text input (auto-generated: HB-3552-2026) | Required |
| Date | date picker | Required |
| Payout delay (optional) | number input (days) | Optional |
| E-invoice | toggle switch | Default on |

**Section: Item Details**

| Field | Type | Validation |
|-------|------|-----------|
| Fee schedule | select with tabs (BVSK selected) | Required |
| BVSK rate table | horizontal scroll of rate columns | Display |
| Line items (repeating): | | |
| — Description | text input | Required |
| — Special Feature | text input | Optional |
| — Rate | currency input | Required |
| — Amount | currency (calculated) | Display |
| — Lump sum checkbox | checkbox | Toggle |

**Default line items:**
- Basic Fees (124,00 €)
- 10 Photos / Per Photo 1.5€ (20,00 €)
- Travel Expenses (40,00 €)
- Writing Costs (25,00 €)
- Postage & Telephone (25,00 €)

"Add Row" button to add custom line items.

---

### 2.13 Report — Export & Send

| Field | Value |
|-------|-------|
| **Route** | `/reports/:id/export` |
| **Description** | Final step. Email composition with rich text editor. Left sidebar toggles for what to include. Lock report option. |
| **Form sections & fields** | |

**Section: Email**

| Field | Type | Validation |
|-------|------|-----------|
| Recipient | contact picker (from claimant/lawyer data) | Required |
| Subject | text input (placeholder: DD/MM/YYYY) | Required |
| Body | rich text editor (bold, italic, lists, alignment, bookmark) | Optional |

**Section: Left Sidebar Toggles**

| Field | Type | Default |
|-------|------|---------|
| Vehicle valuation | toggle with eye icon | Off |
| Commission | toggle with eye icon | On |
| The Invoice | toggle with eye icon | On |
| Lock Report | toggle | On |

**Actions:** "Send Report" button (green with send icon, top right)

---

## 2. NAVIGATION MAP

```
Root
├── / (Landing Page)                          [public]
├── /login                                    [public]
├── /forgot-password                          [public]
├── /signup                                   [public]
│   ├── /signup/account        (Step 1)
│   ├── /signup/personal       (Step 2)
│   ├── /signup/business       (Step 3)
│   ├── /signup/plan           (Step 4)
│   ├── /signup/integrations   (Step 5)
│   └── /signup/complete       (Step Complete)
│
├── /dashboard                                [auth required]
│
├── /reports/:id                              [auth required]
│   ├── /reports/:id/gallery
│   │   ├── [Modal] Photo Annotation/Draw
│   │   └── [Modal] Document Viewer
│   ├── /reports/:id/details
│   │   ├── /reports/:id/details/accident-info
│   │   │   └── [Modal] Digital Signature
│   │   ├── /reports/:id/details/vehicle
│   │   ├── /reports/:id/details/condition
│   │   ├── /reports/:id/details/calculation
│   │   │   └── [Modal] Repair Cost Calculator (DAT)
│   │   └── /reports/:id/details/invoice
│   └── /reports/:id/export
│
└── /settings                                 [auth required]
    └── (integrations, profile, billing — inferred, not shown in designs)
```

### Route Params (TypeScript)

```typescript
type ReportRouteParams = {
  id: string; // report UUID
};

type SignupStep = 'account' | 'personal' | 'business' | 'plan' | 'integrations' | 'complete';

type ReportDetailTab = 'accident-info' | 'vehicle' | 'condition' | 'calculation' | 'invoice';
```

---

## 3. SHARED COMPONENTS

### 3.1 Button

| Prop | Type | Notes |
|------|------|-------|
| variant | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | Primary: green filled. Secondary: white filled. Outline: border only. Ghost: no border. Danger: for remove/delete. |
| size | `'sm' \| 'md' \| 'lg'` | sm: 32px, md: 40px, lg: 48px |
| icon | `ReactNode` | Optional leading icon |
| iconPosition | `'left' \| 'right'` | — |
| loading | `boolean` | Shows spinner |
| disabled | `boolean` | Greyed out |
| fullWidth | `boolean` | 100% width |

**States:** default, hover, active, disabled, loading
**Used on:** Every screen

---

### 3.2 Input / TextField

| Prop | Type | Notes |
|------|------|-------|
| label | `string` | Above input |
| placeholder | `string` | — |
| type | `'text' \| 'email' \| 'password' \| 'number' \| 'tel' \| 'date'` | — |
| error | `string` | Error message below |
| hint | `string` | Helper text below |
| icon | `ReactNode` | Trailing icon (e.g., eye for password, calendar for date) |
| disabled | `boolean` | — |
| prefix | `string` | For currency inputs (€) |

**States:** default, focused (green border), error (red border), disabled
**Used on:** Every form screen

---

### 3.3 Select / Dropdown

| Prop | Type | Notes |
|------|------|-------|
| label | `string` | — |
| options | `Array<{value, label}>` | — |
| placeholder | `string` | — |
| error | `string` | — |
| multiple | `boolean` | For multi-select |

**Used on:** Personal, Business, Vehicle, Condition, Calculation

---

### 3.4 Card

| Prop | Type | Notes |
|------|------|-------|
| variant | `'default' \| 'selectable' \| 'selected' \| 'elevated'` | selectable has radio/check, selected has green border + light green bg |
| padding | `'sm' \| 'md' \| 'lg'` | — |
| onClick | `function` | For selectable cards |

**Used on:** Plan selection, Integration provider cards, Signature type cards, Quick-start cards (signup complete), Feature cards (landing)

---

### 3.5 StepperSidebar (Signup Wizard)

| Prop | Type | Notes |
|------|------|-------|
| steps | `Array<{number, title, subtitle}>` | — |
| currentStep | `number` | — |
| completedSteps | `number[]` | Shows green check |

**States per step:** pending (grey circle), active (green circle with number), completed (green check)
**Used on:** All signup screens (Steps 1-5)

---

### 3.6 TabBar (Report Section Tabs)

| Prop | Type | Notes |
|------|------|-------|
| tabs | `Array<{key, label, completion?, isComplete?}>` | completion shows "3/4" etc. |
| activeTab | `string` | — |
| onChange | `function` | — |

**Active style:** Dark filled pill. **Inactive:** plain text. **Completed:** green checkmark.
**Used on:** Report Details (Accident Info / Vehicle / Condition / Calculation / Invoice)

---

### 3.7 ReportSidebar (Left Navigation)

| Prop | Type | Notes |
|------|------|-------|
| sections | `Array<{key, label, icon}>` | Gallery, Report Details, Export & Send |
| activeSection | `string` | Green text + bold |

**Used on:** All report editor screens (screens 2.3+)

---

### 3.8 TopNavBar

| Prop | Type | Notes |
|------|------|-------|
| user | `{name, role, avatarUrl}` | Right side |

**Elements:** Logo (left), Dashboard pill button (center), Stats icon, Settings icon, Notification bell, User avatar+name+role (right)
**Used on:** All authenticated screens

---

### 3.9 PhotoCard / PhotoThumbnail

| Prop | Type | Notes |
|------|------|-------|
| src | `string` | Image URL |
| variant | `'grid' \| 'viewer' \| 'thumbnail'` | Grid: in gallery. Viewer: large. Thumbnail: filmstrip. |
| onEdit | `function` | — |
| onDelete | `function` | — |
| selected | `boolean` | — |
| watermark | `boolean` | Shows "Gut8erPRO" watermark |

**Used on:** Upload Photos, Edit Gallery, Gallery viewer

---

### 3.10 SignaturePad

| Prop | Type | Notes |
|------|------|-------|
| mode | `'draw' \| 'upload'` | Tab-switched |
| value | `string (base64/URL)` | — |
| onChange | `function` | — |

**Used on:** Signature modal (screen 2.7)

---

### 3.11 VehicleDiagram (Interactive SVG)

| Prop | Type | Notes |
|------|------|-------|
| mode | `'damages' \| 'paint'` | Tab-switched |
| markers | `Array<{x, y, comment?, value?, color?}>` | Placed on diagram |
| onAddMarker | `function` | — |
| onMarkerClick | `function` | Shows tooltip |
| editable | `boolean` | — |

**Used on:** Condition tab — damages and paint sub-tabs

---

### 3.12 NumberChipSelector

| Prop | Type | Notes |
|------|------|-------|
| options | `Array<{value, label}>` | e.g., [New, 1, 2, 3, 4, +] |
| selected | `number \| string` | — |
| onChange | `function` | — |

**Selected style:** Green circle. **Default:** Grey/white circle.
**Used on:** Vehicle tab (Axles, Driven by, Doors, Seats, Previous Owners)

---

### 3.13 IconSelector

| Prop | Type | Notes |
|------|------|-------|
| options | `Array<{value, icon, label?}>` | Vehicle type icons, motor type icons |
| selected | `string` | — |
| onChange | `function` | — |

**Selected style:** Blue/dark filled background. **Default:** outlined.
**Used on:** Vehicle tab (Vehicle Type, Motor Type)

---

### 3.14 CollapsibleSection

| Prop | Type | Notes |
|------|------|-------|
| title | `string` | — |
| info | `boolean` | Shows (i) icon |
| defaultOpen | `boolean` | — |
| children | `ReactNode` | — |

**Used on:** Accident Info (all sections), Condition, Invoice

---

### 3.15 ToggleSwitch

| Prop | Type | Notes |
|------|------|-------|
| label | `string` | — |
| checked | `boolean` | — |
| onChange | `function` | — |
| eyeIcon | `boolean` | Shows visibility eye icon (Export & Send) |

**Used on:** E-invoice toggle, Manual Setup toggle, Export toggles

---

### 3.16 LicensePlate (Display)

| Prop | Type | Notes |
|------|------|-------|
| plate | `string` | e.g., "CE · N 668" |
| country | `string` | Default "D" (German flag + EU stars) |

**Styled component** — blue EU strip on left, black border, German plate typography.
**Used on:** Accident Info (claimant section), Gallery (detected from photo)

---

### 3.17 Modal

| Prop | Type | Notes |
|------|------|-------|
| title | `string` | — |
| open | `boolean` | — |
| onClose | `function` | — |
| size | `'sm' \| 'md' \| 'lg' \| 'fullscreen'` | Annotation uses fullscreen |
| children | `ReactNode` | — |
| footer | `ReactNode` | Cancel/Save buttons |

**Used on:** Signature, Annotation/Draw, Documents, DAT Calculator

---

### 3.18 RichTextEditor

| Prop | Type | Notes |
|------|------|-------|
| value | `string (HTML)` | — |
| onChange | `function` | — |
| toolbar | Font, Bold, Italic, Ordered list, Unordered list, Align (left/center/right/justify), Bookmark | — |

**Used on:** Export & Send (email body)

---

### 3.19 InvoiceLineItem (Repeating Row)

| Prop | Type | Notes |
|------|------|-------|
| description | `string` | — |
| specialFeature | `string` | — |
| rate | `number` | — |
| amount | `number` | Calculated |
| isLumpSum | `boolean` | — |
| onDelete | `function` | — |

**Used on:** Invoice tab

---

### 3.20 CompletionBadge

| Prop | Type | Notes |
|------|------|-------|
| percentage | `number` | e.g., 50 |
| label | `string` | e.g., "50% Complete" |

**Used on:** Accident Info, Vehicle, Condition, Calculation sections

---

## 4. DATA MODEL

```typescript
// ─── User & Auth ───

interface User {
  id: string;
  email: string;
  title: string;               // Mr, Mrs, Dr, etc.
  firstName: string;
  lastName: string;
  phone: string;
  professionalQualification?: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
  plan: 'free' | 'pro';
  trialEndsAt?: string;        // ISO date
  createdAt: string;
}

interface Business {
  id: string;
  userId: string;
  companyName: string;
  street: string;
  postcode: string;
  city: string;
  taxId: string;               // Steuernummer
  vatId?: string;              // USt-IdNr
}

interface Integration {
  id: string;
  userId: string;
  provider: 'dat' | 'audatex' | 'gt_motive';
  credentials: {
    username: string;
    // password stored securely server-side
  };
  isActive: boolean;
}

// ─── Report (Core Entity) ───

interface Report {
  id: string;
  userId: string;
  status: 'draft' | 'completed' | 'sent' | 'locked';
  createdAt: string;
  updatedAt: string;
  completionPercentage: number;
  isLocked: boolean;

  // Sub-sections
  gallery: ReportGallery;
  accidentInfo: AccidentInfo;
  vehicle: VehicleInfo;
  condition: VehicleCondition;
  calculation: Calculation;
  invoice: Invoice;
  export: ExportConfig;
}

// ─── Gallery ───

interface ReportGallery {
  photos: Photo[];
}

interface Photo {
  id: string;
  reportId: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  uploadedAt: string;
  annotations: Annotation[];
  aiDescription?: string;
  type?: 'vehicle_diagonal' | 'damage_overview' | 'document' | 'other';
}

interface Annotation {
  id: string;
  photoId: string;
  type: 'rectangle' | 'circle' | 'arrow' | 'freehand' | 'crop';
  color: string;
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: Array<{x: number; y: number}>;
  };
}

// ─── Accident Info ───

interface AccidentInfo {
  // Accident
  accidentDay?: string;        // ISO date
  accidentScene?: string;

  // Claimant
  claimant: ClaimantInfo;

  // Opponent
  opponent?: OpponentInfo;

  // Visit
  visits: VisitInfo[];

  // Expert Opinion
  expertOpinion: ExpertOpinion;

  // Signatures
  signatures: Signature[];
}

interface ClaimantInfo {
  company?: string;
  salutation: string;
  firstName: string;
  lastName: string;
  street: string;
  postcode: string;
  location: string;
  email: string;
  phone: string;
  vehicleMake?: string;
  licensePlate?: string;       // Auto-detected from photos
  eligibleForInputTaxDeduction: boolean;
  isVehicleOwner: boolean;
  representedByLawyer: boolean;
  involvedLawyer?: string;
}

interface OpponentInfo {
  // Mirror of ClaimantInfo fields
  company?: string;
  salutation?: string;
  firstName?: string;
  lastName?: string;
  street?: string;
  postcode?: string;
  location?: string;
  email?: string;
  phone?: string;
  insuranceCompany?: string;
  insuranceNumber?: string;
}

interface VisitInfo {
  id: string;
  type: 'claimant_residence' | 'claimant_office' | 'other';
  street: string;
  postcode: string;
  location: string;
  date: string;
  expert: string;
  vehicleCondition: string;
}

interface ExpertOpinion {
  expertName: string;
  fileNumber: string;
  caseDate?: string;
  orderWasPlacement: string;
  issuedDate?: string;
  orderByClaimant: boolean;
  mediator?: string;
}

interface Signature {
  id: string;
  type: 'lawyer' | 'data_permission' | 'cancellation';
  imageUrl?: string;           // base64 or uploaded URL
  signedAt?: string;
}

// ─── Vehicle ───

interface VehicleInfo {
  vin: string;
  datsCode?: string;
  marketIndex?: string;
  manufacturer: string;
  mainType: string;
  subtype: string;
  kbaNumber?: string;

  // Specification
  powerKw?: number;
  powerHp?: number;
  engineDesign?: string;
  cylinders?: number;
  transmission?: string;
  engineDisplacementCcm?: number;
  firstRegistration: string;
  lastRegistration?: string;
  sourceOfTechnicalData?: string;

  // Vehicle Details
  vehicleType: string;         // compact, sedan, suv, van, truck...
  motorType: string;           // petrol, diesel, electric, hybrid...
  axles: number;
  drivenAxles: number;
  doors: number;
  seats: number;
  previousOwners: number | 'new';
}

// ─── Condition ───

interface VehicleCondition {
  // Vehicle Condition
  paintType?: string;
  hard?: string;
  paintCondition?: string;
  generalCondition?: string;
  bodyCondition?: string;
  interiorCondition?: string;
  drivingAbility?: string;
  specialFeatures?: string;
  parkingSensors: boolean;
  mileageRead: number;
  estimateMileage?: number;
  unit: 'km' | 'miles';
  nextMot?: string;
  fullServiceHistory: boolean;
  testDrivePerformed: boolean;
  errorMemoryRead: boolean;
  airbagsDeployed: boolean;
  produceGroups?: string[];
  notes?: string;

  // Visual Accident Details
  manualSetup: boolean;
  damageMarkers: DamageMarker[];
  paintMarkers: PaintMarker[];

  // Tires
  tires: TireSet[];

  // Prior and Existing Damage
  previousDamageReported?: string;
  existingDamageNotReported?: string;
  subsequentDamage?: string;
}

interface DamageMarker {
  id: string;
  x: number;                   // percentage position on diagram
  y: number;
  comment: string;
}

interface PaintMarker {
  id: string;
  x: number;
  y: number;
  thickness: number;           // in µm
  color: string;               // auto-calculated from thickness
  position: string;            // e.g., "front_left_fender", "roof", etc.
}

interface TireSet {
  setNumber: 1 | 2;
  tires: {
    position: 'VL' | 'VR' | 'HL' | 'HR';
    size?: string;
    profileLevel?: string;
    manufacturer?: string;
    usability?: 1 | 2 | 3;
  }[];
  matchAndAlloy: boolean;
}

// ─── Calculation ───

interface Calculation {
  // Vehicle Value
  replacementValue?: number;
  taxRate?: string;
  residualValue?: number;
  diminutionInValue?: number;

  // Repair
  wheelAlignment?: string;
  bodyMeasurements?: string;
  bodyPaint?: string;
  plasticRepair: boolean;
  repairMethod?: string;
  risks?: string;
  damageClass?: string;
  additionalCosts?: AdditionalCost[];

  // Loss of Use
  dropoutGroup?: string;
  costPerDay?: number;
  rentalCarClass?: string;
  repairTimeDays?: number;
  replacementTimeDays?: number;

  // DAT Integration
  datCalculation?: DatCalculationResult;
}

interface AdditionalCost {
  id: string;
  description: string;
  amount: number;
}

interface DatCalculationResult {
  workshop?: {
    location?: string;
    dekraUsed: boolean;
    mechanics?: string;
    body?: string;
    paintwork?: string;
  };
  marketValue?: number;
  repairCost?: number;
}

// ─── Invoice ───

interface Invoice {
  invoiceNumber: string;       // auto-generated: HB-XXXX-YYYY
  recipientId: string;         // reference to claimant/lawyer
  date?: string;
  payoutDelay?: number;        // days
  eInvoice: boolean;
  feeSchedule: 'bvsk' | 'custom';
  lineItems: InvoiceLineItem[];
  totalNet: number;
  totalGross: number;
  taxRate: number;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  specialFeature?: string;
  rate: number;
  amount: number;
  isLumpSum: boolean;
  quantity?: number;
  perUnit?: number;
}

// ─── Export ───

interface ExportConfig {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;                // HTML from rich text editor
  includeVehicleValuation: boolean;
  includeCommission: boolean;
  includeInvoice: boolean;
  lockReport: boolean;
}

// ─── API Response Shapes (estimated) ───

interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Login
interface LoginRequest { email: string; password: string; }
interface LoginResponse { token: string; refreshToken: string; user: User; }

// Signup
interface SignupRequest {
  account: { email: string; password: string; };
  personal: { title: string; firstName: string; lastName: string; phone: string; qualification?: string; };
  business: { companyName: string; street: string; postcode: string; city: string; taxId: string; vatId?: string; };
  plan: 'free' | 'pro';
  paymentMethodId?: string;    // Stripe
  integration?: { provider: string; username: string; password: string; };
}

// Reports
interface CreateReportRequest { /* initially empty, just creates draft */ }
interface UpdateReportRequest { [section: string]: Partial<any>; }  // per-section updates
interface UploadPhotoRequest { file: File; type?: string; }
interface SendReportRequest { recipientEmail: string; subject: string; body: string; attachments: string[]; }
```

---

## 5. STATE MANAGEMENT PLAN

### Global State (persisted across sessions)
| State | Store | Notes |
|-------|-------|-------|
| Auth token | Secure storage (httpOnly cookie or encrypted) | Never in localStorage |
| Current user | `useAuthStore` | User profile, plan, role |
| Theme | `useThemeStore` | Light/dark (if implemented) |

### Server State (cached, refetched)
| State | Approach | Notes |
|-------|----------|-------|
| Reports list | React Query / TanStack Query | Dashboard list, paginated |
| Single report | React Query with `queryKey: ['report', id]` | Auto-refetch on focus |
| Photo upload | React Query mutation | Optimistic update |
| DAT integration calls | React Query mutation | External API |
| User profile | React Query | Refetch on settings change |
| Invoice preview | React Query | Generated on demand |

### Local State (component-level, not persisted)
| State | Approach | Notes |
|-------|----------|-------|
| Form inputs | React Hook Form | All forms use RHF + Zod |
| Signup wizard step | URL param or local state | Current step tracked in URL |
| Active report tab | URL param | `/details/vehicle` etc. |
| Photo annotation canvas | Local ref + state | Fabric.js/Konva internal state |
| Signature canvas | Local ref | Drawing state |
| Modal open/close | `useState` | Per-modal |
| Sidebar collapsed | `useState` | UI toggle |
| Damage/paint markers (editing) | `useState` → save to server | Optimistic |

### Auto-Save Strategy
Reports should auto-save on field blur or after 2-second debounce. Show a subtle "Saving..." / "Saved" indicator. This prevents data loss on long forms.

---

## 6. THIRD-PARTY DEPENDENCIES

### Core Framework
| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `react-dom` | DOM rendering |
| `typescript` | Type safety |

### Routing & Navigation
| Package | Purpose |
|---------|---------|
| `react-router-dom` | Client-side routing (if SPA) |
| — OR `next` | Framework with SSR (if Next.js) |

### State & Data Fetching
| Package | Purpose |
|---------|---------|
| `zustand` | Lightweight global state (auth, UI preferences) |
| `@tanstack/react-query` | Server state, caching, mutations, optimistic updates |
| `axios` | HTTP client with interceptors for auth tokens |

### Forms & Validation
| Package | Purpose |
|---------|---------|
| `react-hook-form` | Performant form management (critical — many large forms) |
| `zod` | Schema validation, TypeScript-first |
| `@hookform/resolvers` | Connect Zod schemas to React Hook Form |

### UI & Styling
| Package | Purpose |
|---------|---------|
| `tailwindcss` | Utility-first CSS (matches design token system) |
| `class-variance-authority` | Component variant management (Button variants etc.) |
| `clsx` or `tailwind-merge` | Conditional class merging |
| `lucide-react` | Icon library (outlined style matches designs) |
| `@radix-ui/react-*` | Headless UI primitives (Select, Dialog, Toggle, Tooltip, Tabs) |

### Canvas / Drawing
| Package | Purpose |
|---------|---------|
| `fabric` (Fabric.js) | Photo annotation — drawing, shapes, arrows, crop on canvas |
| `react-signature-canvas` | Digital signature drawing pad |

### Rich Text
| Package | Purpose |
|---------|---------|
| `tiptap` (@tiptap/react) | Rich text editor for email body (Export & Send screen) |

### Payments
| Package | Purpose |
|---------|---------|
| `@stripe/stripe-js` | Stripe client-side SDK |
| `@stripe/react-stripe-js` | Stripe React components (card element) |

### File Handling
| Package | Purpose |
|---------|---------|
| `react-dropzone` | Drag-and-drop photo upload |
| `browser-image-compression` | Client-side image compression before upload |

### Date & Formatting
| Package | Purpose |
|---------|---------|
| `date-fns` | Date formatting/parsing (lightweight, tree-shakeable) |
| `intl` (native) | Currency formatting (€) |

### Authentication
| Package | Purpose |
|---------|---------|
| `@auth0/auth0-react` OR custom JWT | Auth provider (TBD based on backend choice) |
| `js-cookie` | Cookie management for auth tokens |

### PDF Generation (if client-side)
| Package | Purpose |
|---------|---------|
| `@react-pdf/renderer` | Generate invoice PDF preview |

### Dev Dependencies
| Package | Purpose |
|---------|---------|
| `eslint` + `@typescript-eslint/*` | Linting |
| `prettier` | Code formatting |
| `vitest` | Unit testing |
| `@testing-library/react` | Component testing |
| `msw` | API mocking for tests |
| `storybook` | Component development & documentation |

---

## APPENDIX: Screen Flow Diagram

```
                    ┌──────────┐
                    │ Landing  │
                    │ Page  /  │
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
        ┌─────▼─────┐       ┌──────▼──────┐
        │   Login    │       │   Signup    │
        │  /login    │◄─────►│  Wizard     │
        └─────┬──────┘       │  /signup/*  │
              │              └──────┬──────┘
              │                     │
              │    ┌────────────────┘
              │    │
        ┌─────▼────▼─┐
        │  Dashboard  │
        │ /dashboard  │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │   Report    │
        │  /reports/  │
        │    :id      │
        └──────┬──────┘
               │
    ┌──────────┼───────────────┐
    │          │               │
┌───▼───┐ ┌───▼────────┐ ┌────▼────┐
│Gallery│ │Report      │ │Export   │
│       │ │Details     │ │& Send   │
└───┬───┘ └───┬────────┘ └─────────┘
    │         │
    │    ┌────┼────┬──────┬──────┐
    │    │    │    │      │      │
    │  ┌─▼─┐┌▼──┐┌▼───┐┌─▼──┐┌──▼───┐
    │  │Acc││Veh││Cond││Calc││Invoic│
    │  │Inf││icl││itio││ulat││e     │
    │  └───┘└───┘└────┘└────┘└──────┘
    │
  [Modals]
  - Photo Annotation
  - Document Viewer
  - Digital Signature
  - DAT Calculator
```

---

*This document is the single source of truth for implementation. Update it as decisions are made.*
