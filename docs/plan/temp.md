# Gut8erPRO — Design Audit & AI Auto-Mode Plan

> Generated 2026-02-16 from a screen-by-screen comparison of the Figma designs
> (`/design/`) vs the current Next.js implementation.

---

## Part 1: Screen-by-Screen Design vs Implementation Audit

### Legend
- OK = Matches design
- MINOR = Small visual/text differences, functional parity
- GAP = Missing feature or significant UI difference
- CRITICAL = Fundamental architecture mismatch

---

### 1. Welcome/Landing Page
**Design**: Hero with headline, CTA, stats (-35%, -60%, 2000+), 3D car illustration, 4 feature cards (DAT Integration, Real Time Analytics, AI Evaluation Tool, Editing Photos), FAQ accordion, footer.
**Implementation**: Hero with similar headline, CTA, stats (1000+, 50+, 4.9), 4 feature cards (DAT Integration, Smart Analytics, Photo Editing, Digital Invoicing), FAQ, footer.
**Verdict**: MINOR
- Stats text differs (design: "-35% report time, -60% less manual work, 2000+ reports" vs impl: "1000+ Reports, 50+ Experts, 4.9 Rating")
- Feature card titles/descriptions slightly different
- No 3D car illustration (fine, hard to reproduce)

---

### 2. Login Page
**Design**: Split-screen. Left: branding + "Professional Vehicle Assessment Web App" + stats + 3D car illustration. Right: "Welcome back" + email/password + "Forgot password?" + "Log in" button + social (Google, Apple).
**Implementation**: Split-screen. Left: "Professional vehicle damage assessment" + stats + green background. Right: "Welcome back" + email/password + remember me + "Forgot password?" + "Sign In" + social (Google, Apple).
**Verdict**: MINOR
- Left panel has text-only, no 3D illustration (acceptable)
- "Log in" vs "Sign In" label difference
- Added "Remember me" checkbox (not in design — should remove or keep)

---

### 3. Signup Step 1 — Account
**Design**: Left stepper sidebar (5 steps with car illustration), right form: email, password, confirm password. Buttons: Cancel + Continue.
**Implementation**: Same layout. Stepper sidebar, form fields match.
**Verdict**: OK

### 4. Signup Step 2 — Personal
**Design**: Title (select), First Name, Last Name, Phone Number, Professional Qualification.
**Implementation**: Same fields.
**Verdict**: OK

### 5. Signup Step 3 — Business
**Design**: Company name, Street & house number, Postcode + City, Tax ID (Steuernummer) + VAT ID (USt-IdNr).
**Implementation**: Same fields.
**Verdict**: OK

### 6. Signup Step 4 — Plan
**Design**: Free + Pro plan cards side by side, Pro selected with "MOST POPULAR" badge, Payment Details section below (Card number, Expiry, CVC, Cardholder name via Stripe).
**Implementation**: Pro plan only (Free removed per user request), "14 Days Free" badge, info panel about Stripe payment setup after account creation.
**Verdict**: OK (Free plan intentionally removed)

### 7. Signup Step 5 — Integrations
**Design**: 3 provider cards (DAT, Audatex "Coming Soon", GT Motive "Coming Soon"), DAT credentials form when selected.
**Implementation**: Same layout with 3 providers and DAT form.
**Verdict**: OK

### 8. Signup Complete
**Design**: Checkmark, "Welcome aboard!", "Pro Plan - 14-day free trial started" badge, 3 quick-start cards (Create Report, Enjoy AI, Settings), buttons: "Create your first report" + "Go to Dashboard".
**Implementation**: Same layout, Pro badge, quick-start cards, buttons.
**Verdict**: OK

---

### 9. Gallery — Single Photo View (V1)
**Design**: Title "Upload Images" + HD badge, left sidebar (Instruction + Suggested Photos), large photo with watermark + edit/delete overlays, filmstrip below, "+" button to add, **GREEN "Generate Report" BUTTON** top-right with sparkles icon.
**Implementation**: Title "Gallery", view toggle (single/grid), upload zone, photo viewer with overlays, filmstrip, **4 SEPARATE AI TOOL BUTTONS** in toolbar below photo (Analyze Damage, Detect VIN, Detect Plate, Scan Document).
**Verdict**: CRITICAL
- **Missing "Generate Report" button** — design has ONE auto-mode button, implementation has 4 manual per-photo buttons
- Title says "Gallery" not "Upload Images"
- No HD badge
- Left sidebar exists but hidden on smaller screens

### 10. Gallery — Grid View (V2)
**Design**: Same header with "Upload Images" + "Generate Report" button, photos in masonry grid with edit/delete overlays, left sidebar with Instruction + Suggested Photos.
**Implementation**: Grid view exists but with AI toolbar instead of Generate Report button.
**Verdict**: CRITICAL (same issue as V1)

### 11. Gallery — After AI Processing (Screen 03)
**Design**: Title changes to "Create New Report" + HD badge, report sidebar appears (Gallery, Report Details, Export & Send), single photo view with filmstrip.
**Implementation**: Report sidebar always present (defined in parent layout), no state change after AI processing.
**Verdict**: GAP
- No transition from "Upload Images" → "Create New Report" after AI processes photos
- The report sidebar is always shown (minor difference)

---

### 12. Annotation/Draw Modal (Screen 04)
**Design**: Full-screen modal with photo, Fabric.js drawing tools (pen, crop, circle, rectangle, arrow, undo, delete), color palette, **AI-GENERATED "Description" PANEL on the right side** showing damage analysis text with green edit button.
**Implementation**: Full-screen modal with photo, drawing tools, color palette. **NO description panel**.
**Verdict**: GAP
- Missing AI-generated description panel on the right side of annotation modal
- Description shows detailed damage analysis (e.g., "The rear driver's side of the vehicle sustained impact damage. The taillight assembly is cracked and partially detached from the body...")

### 13. Document Viewer (Screen 05)
**Design**: Full-screen modal showing vehicle registration document (Zulassungsbescheinigung) with drawing tools and green checkmark icon (indicating AI extracted data).
**Implementation**: Same annotation modal opens for document photos.
**Verdict**: MINOR (functional parity)

---

### 14. Accident Overview (Screen 06)
**Design**: Long form with sections: Accident Information (day, scene), Claimant Information (company, name, address, email, phone, license plate display, checkboxes, lawyer), Opponent, Visits, Expert Opinion, Signatures (3 types: Lawyer, Data Permission, Cancellation).
**Implementation**: Same sections with same fields.
**Verdict**: OK

### 15. Digital Signature Modal (Screen 07)
**Design**: "Your Signature" modal with Draw Signature / Upload Signature tabs, canvas area, legal text, Cancel + Save buttons.
**Implementation**: Same modal with draw/upload tabs.
**Verdict**: OK

### 16. Signature Added (Screen 08)
**Design**: Shows drawn signature in the Signatures section with "Remove" + "Update Signature" buttons.
**Implementation**: Same display.
**Verdict**: OK

---

### 17. Vehicle Tab (Screen 10)
**Design**: Vehicle Information (VIN, DATSCode, Market Index, Manufacturer, Main Type, Subtype, KBA), Specification (Power kW/HP, Engine Design, Cylinders, Transmission, Displacement, Registration dates), Vehicle Details (type, motor, axles, driven, doors, seats, previous owners with NumberChipSelectors), "Update Report" button. "Compact Car" icon selected in Vehicle Type.
**Implementation**: Same 3 sections with same fields, NumberChipSelectors, IconSelectors.
**Verdict**: OK

### 18. Condition Tab (Screen 11)
**Design**: Vehicle Condition section (paint type, paint condition, general/body/interior condition, driving ability, special features, parking sensors, mileage, MOT, checkboxes, notes), Visual Accident Details (Damages/Paint tab switcher, interactive car SVG with markers), Tires section, Prior and Existing Damage.
**Implementation**: Same sections with same features.
**Verdict**: OK

### 19. Vehicle Damages Detail (Screen 12)
**Design**: SVG car diagram with numbered dark circle markers, clicking shows comment popup.
**Implementation**: Same diagram with markers and comments.
**Verdict**: OK

### 20. Vehicle Paint Detail (Screen 13)
**Design**: SVG car with color-coded paint thickness badges around it, legend (Blue <70, Green >=70, Yellow >160, Orange >300, Red >700), "Paint Manual Setup" toggle.
**Implementation**: Same paint diagram with color-coded legend.
**Verdict**: OK

---

### 21. Calculation Tab (Screen 14)
**Design**: Two-column layout. Left: Vehicle Value (replacement value, tax rate, residual, diminution). Right: Repair (wheel alignment, body measurements, paint, plastic repair, method, risks, damage class, additional costs). Bottom: Loss of Use. **GREEN "Upload Image to Auto-fill" BUTTON** top-right. "Repair and Valuation Providers" expandable row at top.
**Implementation**: Same two-column layout with same fields. **NO "Upload Image to Auto-fill" button**. Has DAT modal.
**Verdict**: GAP
- Missing "Upload Image to Auto-fill" button for AI auto-fill on calculation page
- "Repair and Valuation Providers" expandable row present

### 22. DAT Modal (Screen 15)
**Design**: "Repair Cost Calculator" modal with DAT logo, Workshop section (Location, DEKRA checkbox, Mechanics name), Body + Paintwork fields, Market Value link.
**Implementation**: Same modal structure.
**Verdict**: OK

### 23. Invoice Tab (Screen 16)
**Design**: Green gradient banner (Invoice Amount + "Preview Invoice" button), Invoice Details with Settings (recipient, invoice number, date, payout delay, E-invoice toggle), Item Details with BVSK rate table (horizontal scroll), line items (description, special feature, lump sum, rate, amount), "Add Row" button.
**Implementation**: Same structure — banner, settings, BVSK table, line items.
**Verdict**: OK

### 24. Export & Send (Screen 17)
**Design**: Left sidebar with toggles (Vehicle valuation, Commission, The Invoice, Lock Report with eye icons), Email section (Recipient avatar, Subject, Rich text body), "Send Report" green button top-right.
**Implementation**: Same structure with toggles, email composer, send button.
**Verdict**: OK

---

## Part 2: Summary of All Gaps

### CRITICAL (Architecture Mismatch)
| # | Gap | Design | Current Implementation |
|---|-----|--------|----------------------|
| 1 | **AI "Generate Report" button** | ONE green button processes ALL photos automatically | 4 separate per-photo manual AI buttons |
| 2 | **AI auto-mode pipeline** | Upload photos → click Generate Report → AI does everything (classify, detect, annotate, extract, order) | User must manually select each AI tool per photo |

### GAP (Missing Features)
| # | Gap | Design | Current Implementation |
|---|-----|--------|----------------------|
| 3 | **Annotation description panel** | Right-side panel in draw modal showing AI-generated damage description | No description panel in annotation modal |
| 4 | **Calculation auto-fill** | "Upload Image to Auto-fill" button on Calculation page | No AI auto-fill on calculation page |
| 5 | **Photo auto-ordering** | Photos ordered logically (around car) | No auto-ordering |
| 6 | **AI damage annotation** | AI draws bounding boxes on damage areas | Only manual annotation |
| 7 | **Gallery title transition** | "Upload Images" → "Create New Report" after AI processing | Always shows "Gallery" |
| 8 | **Suggested photos tracking** | Shows which suggested categories are fulfilled | Static labels only |

### MINOR (Visual Polish)
| # | Gap | Design | Current Implementation |
|---|-----|--------|----------------------|
| 9 | Landing page stats | "-35%, -60%, 2000+" | "1000+, 50+, 4.9" |
| 10 | Login "Log in" vs "Sign In" | "Log in" | "Sign In" |
| 11 | Gallery "HD" badge | Present next to title | Missing |
| 12 | Watermark on photos | "Gut8erPRO" watermark on viewed photos | Present in implementation |

---

## Part 3: AI Auto-Mode "Generate Report" Pipeline

### Overview

Replace the current manual per-photo AI toolbar with a **single "Generate Report" button** that processes ALL uploaded photos through an automated AI pipeline. The user's workflow becomes:

1. Upload photos (damage shots, VIN plate, license plate, registration document)
2. Click **"Generate Report"**
3. AI automatically:
   - Classifies each photo (damage / VIN / plate / document / overview)
   - Runs the appropriate detection on each (damage analysis, VIN extraction, plate detection, OCR)
   - Auto-annotates damage areas with bounding boxes
   - Extracts all fields and auto-fills report sections
   - Orders photos logically (around-car sequence)
   - Shows progress and results

### Pipeline Architecture

```
User clicks "Generate Report"
         │
         ▼
┌─────────────────────────────┐
│  Step 1: CLASSIFY (fast)    │  Haiku 4.5 — classify all photos in parallel
│  For each photo:            │  Returns: { type: "damage" | "vin" | "plate" | "document" | "overview" }
│  - What type of photo?      │  + confidence score + suggested order position
│  - Where on the car?        │
│  - Suggested order?         │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Step 2: ROUTE & PROCESS    │  Run in parallel per photo type:
│                             │
│  damage → Sonnet 4.5        │  → damage description + severity + location
│           + bounding box    │  → annotation coordinates for Fabric.js
│                             │
│  vin → Haiku 4.5            │  → extracted VIN string (17 chars)
│                             │
│  plate → Haiku 4.5          │  → extracted license plate
│                             │
│  document → Sonnet 4.5      │  → full OCR (manufacturer, VIN, plate, dates, specs)
│                             │
│  overview → Sonnet 4.5      │  → general vehicle description + color + make + model
│                             │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Step 3: AUTO-FILL          │  Server-side:
│                             │
│  - Write VIN → Vehicle tab  │  PATCH /api/reports/:id/vehicle
│  - Write plate → Claimant   │  PATCH /api/reports/:id/accident-info
│  - Write OCR → Vehicle tab  │  PATCH /api/reports/:id/vehicle (manufacturer, specs, etc.)
│  - Write damage descriptions│  Update photo.aiDescription in DB
│  - Save annotations         │  Save bounding box coordinates per photo
│  - Reorder photos           │  Update photo.order in DB
│                             │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Step 4: RETURN RESULTS     │  Client receives:
│                             │
│  - Classified & reordered   │  Gallery updates with ordered photos
│    photo list               │
│  - Per-photo AI results     │  Each photo shows its detected info
│  - Auto-filled field count  │  "12 fields auto-filled"
│  - Any warnings/conflicts   │  "Multiple VINs detected — please verify"
│                             │
└─────────────────────────────┘
```

### New API Endpoint

**`POST /api/reports/:id/generate`** — Single endpoint that orchestrates the entire pipeline.

```typescript
// Request
{ reportId: string }

// Response (streamed via SSE for progress updates)
{
  status: "classifying" | "processing" | "filling" | "complete" | "error",
  progress: { current: number, total: number, step: string },
  results: {
    photos: Array<{
      photoId: string,
      classification: "damage" | "vin" | "plate" | "document" | "overview",
      confidence: number,
      suggestedOrder: number,
      aiResult: DamageResult | VinResult | PlateResult | OcrResult | OverviewResult,
      annotations?: FabricJsAnnotation[], // bounding boxes for damage photos
    }>,
    autoFilled: {
      vehicleFields: string[],   // e.g., ["vin", "manufacturer", "powerKw"]
      accidentFields: string[],  // e.g., ["claimantLicensePlate"]
      totalFields: number,
    },
    warnings: string[],          // e.g., "Multiple VINs detected"
  }
}
```

### AI Prompt Design

**Step 1 — Classifier (Haiku 4.5, ~$0.001/photo)**
```
Classify this vehicle assessment photo into one category:
- "damage": Shows vehicle damage (dents, scratches, cracks, deformation)
- "vin": Shows a VIN plate or VIN number
- "plate": Shows a license plate
- "document": Shows a vehicle registration document (Zulassungsbescheinigung)
- "overview": General vehicle photo (full body, interior, features)

Also determine:
- position: Where on the vehicle this was taken (front-left, front-right, rear-left, rear-right, front, rear, left, right, interior, engine, other)
- suggestedOrder: A number 1-20 for logical ordering (1=front-left diagonal, 2=front, 3=front-right diagonal, 4=right side, ... 8=rear-right diagonal, 9-12=damage close-ups, 13-16=interior, 17-20=documents)

Return JSON: { type, position, suggestedOrder, confidence }
```

**Step 2a — Damage Analyzer (Sonnet 4.5, ~$0.01/photo)**
```
Analyze this vehicle damage photo. Provide:
1. description: Detailed damage description for the expert report
2. severity: "minor" | "moderate" | "severe"
3. damageType: Array of types ("dent", "scratch", "crack", "deformation", "paint_damage", "broken_part")
4. affectedParts: Array of affected car parts
5. repairApproach: Suggested repair method
6. boundingBoxes: Array of damage areas as normalized coordinates [{ x, y, width, height, label }]
   where x,y are top-left corner, all values 0-1 relative to image dimensions

Return JSON only.
```

**Step 2b — Overview Analyzer (Sonnet 4.5)**
```
Describe this vehicle photo for an expert assessment report.
Extract: color, approximate make/model, body type, visible condition.
Return JSON: { description, color, make, model, bodyType, generalCondition }
```

### UI Changes Required

#### Gallery Page — Replace AI Toolbar with "Generate Report" Button

**Before (current):**
```
[Header: "Gallery" | view toggle buttons]
[Upload Zone]
[Photo Viewer]
[AI Tools: Analyze | VIN | Plate | Scan] ← REMOVE THIS
[Filmstrip]
```

**After (design-matching):**
```
[Header: "Upload Images" | HD badge | ............. | ✨ Generate Report] ← ADD THIS
[Upload Zone (or photo viewer if photos exist)]
[Left sidebar: Instruction + Suggested Photos with tracking]
[Photo grid or single view]
[Filmstrip]
```

When "Generate Report" is clicked:
1. Button shows progress: "Classifying photos... (3/7)" → "Analyzing damage... (5/7)" → "Filling report..."
2. Each photo in the grid/filmstrip gets a small badge showing its classification
3. On completion: toast "Report generated — 14 fields auto-filled"
4. Title transitions to "Create New Report"
5. Photo order updates to the AI-suggested sequence

#### Annotation Modal — Add Description Panel

Add a right-side panel to the annotation modal:
- Shows AI-generated description for the current photo
- Green edit button to modify the description
- For damage photos: shows damage analysis text
- For document photos: shows extracted fields
- For VIN/plate photos: shows detected value

#### Calculation Page — Add "Upload Image to Auto-fill"

Add green button top-right that:
- Opens a file picker or photo selector from existing gallery
- Sends the image to AI for calculation-relevant data extraction
- Auto-fills repair cost estimates, damage class, etc.

### Photo Auto-Ordering Logic

After classification, photos are reordered by `suggestedOrder`:

| Order | Position | Description |
|-------|----------|-------------|
| 1 | front-left | Front-left diagonal (3/4 view) |
| 2 | front | Front straight |
| 3 | front-right | Front-right diagonal |
| 4 | right | Right side |
| 5 | rear-right | Rear-right diagonal |
| 6 | rear | Rear straight |
| 7 | rear-left | Rear-left diagonal |
| 8 | left | Left side |
| 9-12 | damage | Damage close-up photos |
| 13-14 | interior | Interior shots |
| 15-16 | engine/other | Engine bay, wheels, etc. |
| 17-18 | vin/plate | VIN plate, license plate |
| 19-20 | document | Registration documents |

### Suggested Photos Tracking

The instruction sidebar should track which categories are fulfilled:

```
Suggested Photos
  ✅ Vehicle Diagonals (4/4)    ← all 4 diagonal photos uploaded
  ⚠️ Damage Overview (2/?)     ← some damage photos, unknown total
  ❌ Document Shot (0/1)        ← no registration doc yet
```

After "Generate Report" classifies all photos, update these counts.

### Cost Estimation (per report, ~7 photos average)

| Step | Model | Photos | Est. Cost |
|------|-------|--------|-----------|
| Classify | Haiku 4.5 | 7 | ~$0.007 |
| Damage analysis | Sonnet 4.5 | 3 | ~$0.030 |
| VIN detection | Haiku 4.5 | 1 | ~$0.001 |
| Plate detection | Haiku 4.5 | 1 | ~$0.001 |
| Document OCR | Sonnet 4.5 | 1 | ~$0.010 |
| Overview | Sonnet 4.5 | 1 | ~$0.010 |
| **Total** | | **7** | **~$0.06** |

At 100 reports/month = ~$6/month in AI costs. Well within margin for €49/month subscription.

---

## Part 4: Implementation Plan

### Phase A: New Generate Report API (Backend)

**Files to create/modify:**
1. `src/app/api/reports/[id]/generate/route.ts` — Main orchestration endpoint (SSE streaming)
2. `src/lib/ai/classifier.ts` — Photo classification prompt + logic
3. `src/lib/ai/damage-analyzer.ts` — Damage analysis with bounding boxes
4. `src/lib/ai/overview-analyzer.ts` — General vehicle description
5. `src/lib/ai/prompts.ts` — All AI prompt templates centralized
6. `src/lib/ai/pipeline.ts` — Pipeline orchestration logic (classify → route → process → fill)
7. Update `src/lib/ai/fetch-image.ts` — Already exists, reuse for base64 conversion

**Keep existing routes** (`analyze-photo`, `detect-vin`, `detect-plate`, `ocr`) as individual fallback endpoints but mark them as secondary. The new `/generate` endpoint is primary.

### Phase B: Frontend — Gallery UI Overhaul

**Files to modify:**
1. `src/app/(app)/reports/[id]/gallery/page.tsx` — Replace AI toolbar with "Generate Report" button, add progress UI, photo classification badges
2. `src/components/report/gallery/instruction-sidebar.tsx` — Add suggested photo tracking with completion indicators
3. `src/hooks/use-generate-report.ts` — New hook for the generate pipeline (SSE streaming)
4. `src/components/report/gallery/generate-progress.tsx` — New: progress overlay/modal during generation
5. `src/components/report/gallery/photo-classification-badge.tsx` — New: small badge on each photo showing its AI classification

### Phase C: Annotation Description Panel

**Files to modify:**
1. `src/components/report/gallery/annotation-modal.tsx` — Add right-side description panel
2. `src/components/report/gallery/annotation-description.tsx` — New: description panel component
3. Database: Ensure `Photo.aiDescription` field is populated by the pipeline

### Phase D: AI Auto-Annotation (Bounding Boxes)

**Files to create/modify:**
1. `src/lib/ai/damage-analyzer.ts` — Already returns bounding boxes from Phase A
2. `src/components/report/gallery/annotation-canvas.tsx` — Add function to render AI bounding boxes as Fabric.js rectangles
3. `src/app/api/reports/[id]/photos/[photoId]/route.ts` — Update to save AI annotations

### Phase E: Calculation Auto-Fill

**Files to modify:**
1. `src/app/(app)/reports/[id]/details/calculation/page.tsx` — Add "Upload Image to Auto-fill" button
2. `src/lib/ai/calculation-extractor.ts` — New: AI prompt for extracting calculation-relevant data from photos
3. `src/app/api/reports/[id]/calculation/auto-fill/route.ts` — New: endpoint for calculation AI auto-fill

### Phase F: Minor UI Polish

1. Gallery title: "Upload Images" → "Create New Report" transition
2. HD badge next to title
3. Login button text: "Sign In" → "Log in"
4. Landing page stats alignment with design
5. Remove "Remember me" checkbox from login (not in design)

---

## Part 5: Implementation Priority

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | **Phase A** — Generate Report API | HIGH | CRITICAL — Core AI pipeline |
| 2 | **Phase B** — Gallery UI overhaul | HIGH | CRITICAL — Main user-facing change |
| 3 | **Phase C** — Annotation description | MEDIUM | GAP — Design fidelity |
| 4 | **Phase D** — AI auto-annotation | MEDIUM | GAP — User requested |
| 5 | **Phase E** — Calculation auto-fill | LOW | GAP — Design feature |
| 6 | **Phase F** — UI polish | LOW | MINOR — Visual alignment |

### Suggested Execution Order

Start with **Phase A + B together** (they're tightly coupled — the API and the UI for it). Then Phase C + D (annotation improvements). Then E + F (lower priority).

---

## Part 6: Figma MCP Integration

The Figma MCP is now connected via the local server:
- **Authenticated as**: `cerovicpetar1998@gmail.com` (Pro plan, 200 calls/day)
- **File key**: `sh4eXjPxpDydgmoXIYv0cP`
- **Access**: Confirmed working via `mcp__figma__whoami` and `mcp__figma__get_metadata`

Use the Figma MCP during implementation to:
- Get pixel-perfect screenshots of specific components (`get_screenshot`)
- Extract design context for code generation (`get_design_context`)
- Verify component spacing, colors, and typography

**Note**: The file access was intermittently failing — may need to ensure the file is shared with `cerovicpetar1998@gmail.com` or retry if 500 errors occur.

---

## Part 7: Files Changed in Previous Session (Free → Pro Migration)

For reference, these files were already modified to remove the Free plan and make everything Pro with 14-day trial:

- `src/stores/pro-store.ts` — `isPro` defaults to `true`
- `src/components/ui/pro-feature-gate.tsx` — Always passes through
- `src/lib/validations/auth.ts` — Plan enum is `['pro']` only
- `src/hooks/use-subscription.ts` — Default plan `'PRO'`
- `prisma/schema.prisma` — Default plan `PRO`
- `src/components/auth/plan-step.tsx` — Pro only with trial info
- `src/lib/auth/actions.ts` — Always creates Pro + trial
- `src/components/auth/integrations-step.tsx` — Always `plan: 'pro'`
- `src/components/auth/complete-step.tsx` — Always shows Pro content
- `src/app/api/ai/*.ts` — Removed plan checks from all 4 AI routes
- `src/app/api/stripe/webhook/route.ts` — Always `plan: 'PRO'`
- `src/app/(app)/reports/[id]/gallery/page.tsx` — Removed Pro gate from AI
- `src/app/(app)/settings/page.tsx` — Always shows Pro plan

AI routes were also updated to:
- Use base64 image encoding (not URL) to fix Supabase Storage accessibility
- Use latest model names (`claude-sonnet-4-5-20250929`, `claude-haiku-4-5-20251001`)
- Show real error messages instead of generic failures
- Prefer `aiUrl` photo variant for AI operations
