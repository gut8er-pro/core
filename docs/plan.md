# Gut8erPRO — Full Implementation Plan

## Context

Gut8erPRO is a professional vehicle damage assessment web application for German automotive experts. All documentation is complete: `CLAUDE.md` (project brain), `docs/ARCHITECTURE.md` (1,460-line spec with screens, components, data model), `docs/TECH_STACK.md` (stack, costs, deployment, image pipeline), `design/DESIGN_TOKENS.md` (colors, typography, spacing). 46 design screenshots are in `/design/`.

This plan implements the entire application in 14 incremental phases. Each phase produces working, testable code. Tests are written alongside code — never after.

**Stack**: Next.js 15 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui + Prisma + Supabase (PostgreSQL/Auth/Storage) + Zustand + TanStack Query v5 + React Hook Form + Zod + Fabric.js + Tiptap + react-signature-canvas + Stripe + Claude API + Resend + @react-pdf/renderer

---

## Phase 1: Project Setup + Design System + All 20 Shared UI Components

**Goal**: Fully configured project with all shared components built, tested, and matching designs.

### 1.1 Project Initialization
- Init Next.js 15 with App Router, TypeScript strict (`noUncheckedIndexedAccess`, path aliases `@/`)
- Install + configure: Tailwind v4, shadcn/ui (custom theme), Biome (lint/format), Vitest + Testing Library, Playwright (setup only), MSW, Sentry SDK
- Create `.env.example`, `.github/workflows/ci.yml` (type-check, lint, test, build)
- Custom test utils: `src/test/test-utils.tsx` (render with QueryClient providers)

**Files**:
```
tailwind.config.ts, next.config.ts, biome.json, vitest.config.ts, vitest.setup.ts,
playwright.config.ts, tsconfig.json, .env.example, .github/workflows/ci.yml,
sentry.client.config.ts, sentry.server.config.ts,
src/app/layout.tsx, src/app/page.tsx, src/app/globals.css,
src/lib/utils.ts (cn utility), src/types/index.ts,
src/test/msw/handlers.ts, src/test/msw/server.ts, src/test/test-utils.tsx
```

### 1.2 Design Tokens → Tailwind Config
- Map ALL tokens from `design/DESIGN_TOKENS.md` into `tailwind.config.ts`
- Colors (primary #16A34A, neutrals, semantic, paint scale), typography (Inter, 10 sizes), spacing (8 levels), border-radius (7 levels), shadows (5 levels), breakpoints
- Export constants in `src/lib/design-tokens.ts` for programmatic use

### 1.3 All 20 Shared Components (with tests)

Each component gets a `.tsx` + `.test.tsx` file. Validated against specific design screenshots.

| # | Component | Path | Design Reference |
|---|-----------|------|-----------------|
| 1 | Button | `src/components/ui/button.tsx` | Login "Log in", signup "Continue" |
| 2 | Input/TextField | `src/components/ui/text-field.tsx` | Login email/password, all forms |
| 3 | Select | `src/components/ui/select.tsx` | Title select, Transmission |
| 4 | Card | `src/components/ui/card.tsx` | Plan cards (04), signature cards (08) |
| 5 | StepperSidebar | `src/components/ui/stepper-sidebar.tsx` | Signup sidebar (01-07) |
| 6 | TabBar | `src/components/ui/tab-bar.tsx` | Report detail tabs |
| 7 | ReportSidebar | `src/components/layout/report-sidebar.tsx` | Report editor sidebar (03-17) |
| 8 | TopNavBar | `src/components/layout/top-nav-bar.tsx` | All authenticated screens |
| 9 | PhotoCard | `src/components/ui/photo-card.tsx` | Gallery grid (02), filmstrip (01) |
| 10 | SignaturePad | `src/components/signature/signature-pad.tsx` | Signature modal (07) |
| 11 | VehicleDiagram | `src/components/ui/vehicle-diagram.tsx` | Condition tab (12, 13) |
| 12 | NumberChipSelector | `src/components/ui/number-chip-selector.tsx` | Vehicle axles/doors/seats (10) |
| 13 | IconSelector | `src/components/ui/icon-selector.tsx` | Vehicle type/motor type (10) |
| 14 | CollapsibleSection | `src/components/ui/collapsible-section.tsx` | All form sections |
| 15 | ToggleSwitch | `src/components/ui/toggle-switch.tsx` | Export toggles (17), Manual Setup |
| 16 | LicensePlate | `src/components/ui/license-plate.tsx` | Claimant section EU plate display |
| 17 | Modal | `src/components/ui/modal.tsx` | Signature (07), annotation (04), DAT (15) |
| 18 | RichTextEditor | `src/components/ui/rich-text-editor.tsx` | Export email body (17) |
| 19 | InvoiceLineItem | `src/components/ui/invoice-line-item.tsx` | Invoice line items (16) |
| 20 | CompletionBadge | `src/components/ui/completion-badge.tsx` | "50% Complete" badges |

**Additional shadcn/ui primitives**: Checkbox, RadioGroup, Label, Separator, Progress, Tooltip, DropdownMenu, Badge, Avatar

**Tests**: ~29 test files. Each validates all variants, interactive states, accessibility (ARIA, keyboard), and visual states matching design tokens.

---

## Phase 2: Database Schema + Authentication + Signup Wizard

**Goal**: Complete Prisma schema, Supabase Auth, login page, and full 5-step signup wizard.

### 2.1 Prisma Schema
- 20+ models: User, Business, Integration, Report, Photo, Annotation, AccidentInfo, ClaimantInfo, OpponentInfo, VisitInfo, ExpertOpinion, Signature, VehicleInfo, VehicleCondition, DamageMarker, PaintMarker, TireSet, Tire, Calculation, AdditionalCost, Invoice, InvoiceLineItem, ExportConfig
- Seed data for development (`prisma/seed.ts`)

**Files**: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`, `src/lib/db.ts`

### 2.2 Supabase Auth
- Browser + server clients (`@supabase/ssr`)
- Middleware for protected routes (`src/middleware.ts`)
- Google + Apple OAuth providers
- Auth hooks + Zustand store

**Files**: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/middleware.ts`, `src/hooks/use-auth.ts`, `src/stores/auth-store.ts`, `src/lib/auth/actions.ts`, `src/lib/auth/validations.ts`

### 2.3 Login Page
- Split-screen: branding panel (left) + login form (right)
- Email/password + password visibility toggle
- Social login (Google, Apple) with "Or" separator
- "Forgot password?" link, signup link
- **Design ref**: `Gut8erPRO - Login.png`

### 2.4 Signup Wizard (5 Steps + Complete)
- Step 1 Account: email, password, confirm password
- Step 2 Personal: title, name, phone, qualification
- Step 3 Business: company, address, tax ID, VAT ID
- Step 4 Plan: Free/Pro cards, Stripe placeholder (real Stripe in Phase 12)
- Step 5 Integrations: DAT/Audatex/GT Motive cards, DAT credentials form
- Complete: checkmark, plan badge, quick-start cards
- Zustand store for wizard state persistence across steps
- Single server action on submit creates all records
- **Design ref**: `01-07` signup screenshots

**Files**: `src/app/(auth)/signup/[step]/page.tsx` (6 pages), form components, `src/stores/signup-store.ts`, `src/lib/validations/auth.ts`

**Tests**: ~15 files (schema validation, auth hooks, form validation per step, middleware, store)

---

## Phase 3: Dashboard + Report CRUD

**Goal**: Working dashboard listing reports, create/delete reports, authenticated layout.

- Authenticated layout with TopNavBar (`src/app/(app)/layout.tsx`)
- Dashboard page: report list (title, status, date, completion %), create button, empty state, pagination
- Report CRUD API routes: POST create, GET list/single, PATCH update, DELETE
- TanStack Query hooks: `useReports`, `useCreateReport`, `useDeleteReport`

**Files**: `src/app/(app)/dashboard/page.tsx`, `src/components/dashboard/report-list.tsx`, `src/app/api/reports/route.ts`, `src/app/api/reports/[id]/route.ts`, `src/hooks/use-reports.ts`

**Tests**: 6 files (page, list, card, hooks, API routes, validations)

---

## Phase 4: Gallery (Photo Upload, Grid, Annotation)

**Goal**: Complete gallery — upload, single/grid view, filmstrip, Fabric.js annotation.

### Photo Upload Pipeline
1. Client: drag-drop (react-dropzone), compress with browser-image-compression (1920px, 85% JPEG)
2. Upload compressed file to Supabase Storage
3. Server: Sharp generates variants — thumbnail (200x150, 15KB), preview (800x600, 80KB), ai (1568x1176, 250KB)
4. Storage: `reports/{id}/photos/{photoId}/[original|thumbnail|preview|ai].jpg`
5. Max 20 photos/report (enforced client + server)

### Views
- Single viewer (V1): large photo + watermark + filmstrip thumbnails
- Grid view (V2): 2-column masonry with edit/delete overlays
- Left instruction sidebar: tips, suggested photos
- **Design ref**: `01-Upload Photos V1.png`, `02-Edit Gallery V2.png`, `03-Gallery Generate calculation.png`

### Annotation Modal (fullscreen)
- Fabric.js canvas over photo
- Tools: Pen, Crop, Circle, Rectangle, Arrow, Undo, Delete
- Color palette (12+ presets)
- Description panel (right side)
- Save: serialize Fabric.js canvas JSON to database
- **Design ref**: `04-Draw.png`, `05-Documents.png`

**Files**: Report layout, gallery page, upload zone, viewer, grid, filmstrip, annotation modal/canvas/toolbar, photo hooks, storage utils, API routes

**Tests**: 9 files (upload validation, compression, viewer, grid, annotation, hooks, API)

---

## Phase 5: Accident Info Tab + Signatures

**Goal**: Complete Accident Info — the most complex form tab with 6 collapsible sections + signature modal.

### Report Details Layout
- TabBar: Accident Info | Vehicle | Condition | Calculation | Invoice
- Completion indicators per tab ("3/4", checkmark)
- "Show missing information" toggle
- Auto-save: React Hook Form + 2s debounce on blur → PATCH API → "Saving..."/"Saved" indicator

### Accident Info Sections (6 CollapsibleSections)
1. **Accident Information**: day (date picker), scene
2. **Claimant Information**: company, name, address, email, phone, license plate (LicensePlate component), checkboxes (tax deduction, owner, lawyer), conditional lawyer field
3. **Opponent**: mirrored claimant fields + insurance info
4. **Visits**: type radio chips, address, date, expert, condition
5. **Expert Opinion**: expert name, file number, dates, checkboxes
6. **Signatures**: 3 type cards (Lawyer, Data Permission, Cancellation), signature display, SignaturePad modal with draw/upload tabs

**Design ref**: `06-Accident Overview.png`, `07-Digital Signature.png`, `08-Signature states`, `09-Accident Overview complete`

**Files**: Page, 6 section components, signature modal, auto-save hook, completion hook, Zod schemas, API routes

**Tests**: 9 files (form sections, conditional fields, signature modal, auto-save debounce, completion calc, validations)

---

## Phase 6: Vehicle Tab

**Goal**: Vehicle identification, specs, and details with icon/number selectors.

### 3 CollapsibleSections
1. **Vehicle Information**: VIN (17 chars), DATSCode, Market Index, Manufacturer, Main Type, Subtype, KBA Number
2. **Specification**: Power kW/HP (auto-convert: HP = kW * 1.36), Engine Design, Cylinders, Transmission, Displacement, Registration dates
3. **Vehicle Details**: Vehicle Type (IconSelector), Motor Type (IconSelector), Axles/Driven/Doors/Seats/Owners (NumberChipSelectors)

**Design ref**: `10-Vehicle.png`

**Files**: Page, 3 section components, power conversion util, hooks, Zod schemas, API route

**Tests**: 7 files (form, sections, kW/HP conversion, icon/number selectors, validations)

---

## Phase 7: Condition Tab (Damage Diagram, Paint, Tires)

**Goal**: Most visually complex tab — interactive SVG diagram, paint color coding, tire details.

### 4 CollapsibleSections
1. **Vehicle Condition**: paint type, conditions, mileage, checkboxes, notes
2. **Visual Accident Details**: Damages/Paint tab switcher + interactive VehicleDiagram
   - **Damages**: dark circle markers on SVG car, click for tooltip, "Add Marker" button
   - **Paint**: color-coded legend (Blue/Green/Yellow/Orange/Red), thickness badges around car
3. **Tires**: 2 tire sets, 4 positions (VL/VR/HL/HR), size/profile/manufacturer, 3-circle usability rating
4. **Prior Damage**: Damage Notes/Inspection tabs, 3 textareas

**Paint color function**: `getPaintColor(thickness: number)` → Blue(<70), Green(>=70), Yellow(>160), Orange(>300), Red(>700)

**Design ref**: `11-Vehicle Default.png`, `12-01-Vehicle Damages.png`, `12-02-Damages reading comments.png`, `12-Vehicle Paint.png`, `13-Vehicle Paint.png`

**Files**: Page, 4 section components, damage/paint diagrams, marker tooltip, tire forms, paint-color utility, SVG asset, hooks, API routes

**Tests**: 9 files (diagrams, color thresholds, tire sections, marker placement, validations)

---

## Phase 8: Calculation Tab + DAT Integration

**Goal**: Vehicle value, repair costs, loss of use, and DAT calculator modal.

### Layout: two columns
- **Left — Vehicle Value**: replacement value (EUR), tax rate, residual value, diminution in value
- **Right — Repair**: wheel alignment, body measurements, paint, plastic repair, method, risks, damage class, additional costs
- **Bottom — Loss of Use**: dropout group, cost/day, rental class, repair/replacement days

### DAT Modal
- Workshop section, market value link, save
- Facade pattern: abstract `CalculationProvider` interface, DAT implementation (mocked initially)
- **Design ref**: `14-Calculation.png`, `15-Modal.png`

**Files**: Page, value/repair/loss sections, additional costs form, DAT modal, provider facade, mock client, hooks, API routes

**Tests**: 6 files (currency formatting, sections, DAT facade, validations)

---

## Phase 9: Invoice Tab (BVSK Fees)

**Goal**: Invoice with BVSK fee schedule, line items, auto-calculation, PDF preview.

### Components
- **Green gradient banner**: invoice total (net + gross)
- **Settings section**: recipient picker, invoice number (auto: "HB-XXXX-YYYY"), date, payout delay, e-invoice toggle
- **Item Details**: BVSK rate table (horizontal scroll), editable line items (description, special feature, lump sum, rate, amount), "Add Row" button
- **Auto-calculation**: net = sum(amounts), gross = net * (1 + taxRate), BVSK lookup by repair cost range
- **PDF preview**: @react-pdf/renderer invoice template in modal

**Design ref**: `16-Invoice.png`

**Files**: Page, banner, settings, BVSK rate table, line items, recipient picker, preview modal, BVSK rates data, calculation utils, number generator, PDF template, hooks, API routes

**Tests**: 10 files (BVSK rate lookup, net/tax/gross math, number format, line items, PDF render, validations)

---

## Phase 10: Export & Send (Email, PDF, Locking)

**Goal**: Email composition, full report PDF, section toggles, report locking.

### Components
- **Left toggles**: Vehicle valuation, Commission, Invoice, Lock Report (with eye icons)
- **Email composer**: recipient picker, subject, Tiptap rich text body
- **"Send Report" button** (green)

### Send Flow
1. Generate PDF with @react-pdf/renderer (sections per toggle states)
2. Send email via Resend + React Email template
3. If Lock Report on: set status "locked", all forms become read-only

### Report Locking
- Server-side enforcement: PATCH rejected on locked reports
- Client-side: disabled form fields, visual lock icon

**Design ref**: `17-Send.png`

**Files**: Page, toggles, email composer, PDF templates (gallery, accident, vehicle, condition, calculation, invoice sections), email template, send utility, lock API, hooks

**Tests**: 6 files (toggles affect PDF, email sending with MSW mock, lock enforcement)

---

## Phase 11: AI Features (Pro Tier)

**Goal**: Claude API for image analysis, VIN/plate detection, document OCR, form auto-fill. Gated behind Pro plan.

### Features
- **Photo analysis**: send `ai` variant to Claude Sonnet 4.5 → structured damage description
- **VIN detection**: Claude Haiku 4.5 → extract VIN from registration photo → auto-fill Vehicle tab
- **License plate detection**: Claude Haiku 4.5 → extract plate → display as LicensePlate component
- **Document OCR**: Claude Sonnet 4.5 → extract all fields from Zulassungsbescheinigung → auto-fill Vehicle tab
- **Auto-fill calculation**: extract repair-relevant data from photos

### Implementation
- Vercel AI SDK with streaming + structured output (Zod schemas)
- Pro feature gate component + server middleware
- Result caching per photo ID

**Files**: AI client, 5 prompt files, 4 Zod result schemas, cache, hooks, ProFeatureGate component, 5 API routes

**Tests**: 8 files (prompt format, schema validation, cache, feature gate, API routes with mocked responses)

---

## Phase 12: Stripe Integration

**Goal**: Subscriptions, 14-day trial, webhook handling, billing settings.

- Replace signup Step 4 placeholder with real Stripe CardElement
- Create Stripe customer + subscription with `trial_period_days: 14`
- Webhook handler: `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded/failed`
- Settings billing page: plan display, trial remaining, manage subscription (Customer Portal)
- Server-side plan enforcement on AI routes

**Files**: Webhook route, checkout route, portal route, Stripe client, webhook handlers, subscription utils, card element, billing section, subscription hook

**Tests**: 5 files (all webhook events, subscription CRUD, plan enforcement)

---

## Phase 13: Landing Page + Settings + Polish

**Goal**: Marketing landing page, settings page, loading states, error handling.

### Landing Page (rewrite `src/app/page.tsx`)
- Hero: headline, subtitle, CTA, stats badges, car image
- Features: 4 cards (DAT, Analytics, AI, Photo Editing)
- FAQ: accordion with 5 items
- Footer
- **Design ref**: `WELCOME SCREEN.png`

### Settings Page
- Profile (name, email, phone, avatar)
- Business (company, address, tax)
- Integrations (DAT connect/disconnect)
- Billing (from Phase 12)
- Notifications

### Polish
- Loading skeletons for all pages
- Error boundaries at route level
- 404 page, toast notifications
- Accessibility audit (keyboard nav, ARIA, focus management)

**Tests**: 5 files (landing page, FAQ, settings forms)

---

## Phase 14: E2E Tests + Performance + Deployment

**Goal**: Full E2E coverage, visual regression, optimization, production deployment.

### E2E Tests (Playwright) — ~20 spec files
- **Auth flows**: signup wizard, login, social login, forgot password
- **Report flow**: create → upload photos → annotate → fill all 5 tabs → send → lock
- **Full journey**: end-to-end complete report creation
- **Dashboard**: list, search, delete
- **Settings**: profile update, billing

### Visual Regression Tests
- Playwright screenshots compared against design PNGs
- Covers: login, signup steps, gallery, all 5 report tabs, export

### Performance
- Bundle analysis (`@next/bundle-analyzer`)
- Dynamic imports for heavy libs (Fabric.js, Tiptap, Stripe, @react-pdf/renderer, react-signature-canvas)
- next/font for Inter, next/image lazy loading
- Database indexes on userId, reportId, createdAt
- Rate limiting on auth + AI endpoints

### Deployment
- Vercel project + environment variables
- Supabase production (Frankfurt, RLS policies for all tables)
- Sentry production config
- GitHub Actions: CI → type-check → lint → test → build → deploy
- E2E on staging after deploy

---

## File Count Summary

| Phase | Description | Files | Tests |
|-------|-------------|-------|-------|
| 1 | Setup + UI Components | ~45 | ~29 |
| 2 | DB + Auth + Signup | ~25 | ~15 |
| 3 | Dashboard + Reports | ~10 | ~6 |
| 4 | Gallery + Annotation | ~18 | ~9 |
| 5 | Accident Info + Signatures | ~18 | ~9 |
| 6 | Vehicle Tab | ~10 | ~7 |
| 7 | Condition Tab | ~16 | ~9 |
| 8 | Calculation + DAT | ~16 | ~6 |
| 9 | Invoice + BVSK | ~16 | ~10 |
| 10 | Export + Send | ~16 | ~6 |
| 11 | AI Features | ~16 | ~8 |
| 12 | Stripe | ~10 | ~5 |
| 13 | Landing + Settings + Polish | ~16 | ~5 |
| 14 | E2E + Performance + Deploy | ~30 | ~25 |
| **Total** | | **~262** | **~149** |

---

## Critical Reference Files

1. `docs/ARCHITECTURE.md` — Screen inventory, all 20 components with props, full data model, navigation map
2. `design/DESIGN_TOKENS.md` — All visual tokens (colors, typography, spacing, shadows, component-specific)
3. `docs/TECH_STACK.md` — NPM packages, image pipeline, deployment, costs, security
4. `CLAUDE.md` — Business rules, domain concepts, coding conventions, folder structure

---

## Verification Strategy

**Per phase**:
- Unit tests validate logic (utils, hooks, stores, Zod schemas, API routes)
- Component tests validate rendering against design tokens (correct classes, states, accessibility)
- Snapshot tests catch regressions

**End-to-end (Phase 14)**:
- Playwright tests cover all critical user journeys
- Visual regression compares rendered pages against design screenshots
- Lighthouse audit targets >90 on all metrics

**Continuous**: GitHub Actions CI runs type-check + lint + test + build on every PR
