# CLAUDE.md — Gut8erPRO Project Brain

> This file is the single source of truth for the Gut8erPRO project.
> Read this first before doing anything.

---

## Project Overview

**Gut8erPRO** is a professional vehicle damage assessment web application for German automotive experts (Kfz-Sachverständige). It streamlines the creation of insurance damage reports by combining photo upload, AI-powered analysis, vehicle data (via DAT integration), interactive damage diagrams, calculation, invoicing, and digital signatures into one workflow.

**Target users:** Independent vehicle assessors, appraisal firms, and insurance adjusters in Germany.

**Monetization:** Freemium — Free tier (manual data entry, PDF export) and Pro tier (€49/month, AI auto-fill, image analysis, VIN detection, priority support, custom branding). 14-day free trial for Pro.

**Language/Locale:** German market (DE). UI is in English but forms contain German-specific fields (Steuernummer, USt-IdNr, KBA numbers, Zulassungsbescheinigung). Currency is EUR (€).

---

## Design Reference

All screens are in `/design/` organized by flow:

```
design/
├── Branding Assets/         # Logo variants, color swatches
├── Welcome Screen/          # Landing/marketing page
├── Login and Sign Up/
│   └── 🟢 LOGIN/
│       ├── Gut8erPRO - Login.png              # Login screen
│       ├── 01 → 07 Signup flow                # 5-step wizard
│       └── 07 - Complete.png                  # Onboarding success
└── Main report flow/
    ├── 01 - Upload Photos V1.png              # Single photo upload view
    ├── 02 - Edit Gallery V2.png               # Multi-photo grid
    ├── 03 - Gallery / Generate calculation     # Report sidebar + photo
    ├── 04 - Draw.png                          # Photo annotation modal
    ├── 05 - Documents.png                     # Document scan viewer
    ├── 06 - Accident Overview.png             # Accident Info tab (long form)
    ├── 07 - Digital Signature.png             # Signature modal
    ├── 08 - Signature states                  # Signature added + types
    ├── 09 - Accident Overview complete         # With signature
    ├── 10 - Vehicle.png                       # Vehicle tab
    ├── 11 - Vehicle Default (Condition).png   # Condition tab
    ├── 12 - Vehicle Damages + Paint           # Damage/paint diagrams
    ├── 13 - Vehicle Paint detail              # Paint thickness measurements
    ├── 14 - Calculation.png                   # Value & repair calculation
    ├── 15 - Modal (DAT provider).png          # Repair cost calculator modal
    ├── 16 - Invoice.png                       # Invoice tab
    └── 17 - Send.png                          # Export & Send
```

**Design tokens:** See `design/DESIGN_TOKENS.md` for colors, typography, spacing, etc.

**Full architecture spec:** See `docs/ARCHITECTURE.md` for screen inventory, navigation map, components, data model.

---

## App Structure — High Level

### Authentication Flow (unauthenticated)
1. **Landing Page** → marketing, features, FAQ
2. **Login** → email/password + Google/Apple social auth
3. **Signup Wizard** (5 steps) → Account → Personal → Business → Plan → Integrations → Complete

### Main App Flow (authenticated)
The core workflow is a **Report Editor** — a multi-step form with sidebar navigation:

```
Report Editor
├── Gallery           → Upload photos, view/edit gallery, annotate/draw on photos
├── Report Details    → 5 horizontal tabs:
│   ├── Accident Info → Accident overview, claimant, opponent, visits, expert opinion, signatures
│   ├── Vehicle       → VIN/identification, specs, vehicle details (type/motor/axles/doors/seats)
│   ├── Condition     → Vehicle condition, visual damage diagram, paint thickness, tires, prior damage
│   ├── Calculation   → Vehicle value, repair costs, loss of use, DAT integration
│   └── Invoice       → Invoice generation with BVSK fee schedule, line items
└── Export & Send     → Email composition, PDF toggles, lock report, send
```

### Top Navigation Bar
- Logo (left)
- Dashboard button (center)
- Stats/chart icon
- Settings icon
- Notification bell (right)
- User avatar + name + role

---

## Key Domain Concepts

| Term | Meaning |
|------|---------|
| Gutachten | Expert appraisal/report (the core document this app produces) |
| Sachverständiger | Vehicle assessor/appraiser (the user) |
| DAT / SilverDAT3 | Deutsche Automobil Treuhand — vehicle data & valuation provider |
| BVSK | Bundesverband der freiberuflichen und unabhängigen Sachverständigen — fee schedule standard |
| Zulassungsbescheinigung | Vehicle registration certificate (the document scanned in the app) |
| KBA | Kraftfahrt-Bundesamt — Federal Motor Transport Authority |
| Steuernummer | German tax ID |
| USt-IdNr | German VAT ID |
| VIN | Vehicle Identification Number |
| DATSCode | DAT-specific vehicle code |
| Diminution in Value | Merkantiler Minderwert — loss in market value after repair |

### Report Types

| Code | Label | UI Differences |
|------|-------|---------------|
| `HS` | Liability (Haftpflichtschaden) | Standard calculation: Value + Repair + Loss + Correction |
| `BE` | Evaluation (Bewertung) | Valuation tab: DAT Valuation + Manual Valuation + Correction. No Accident Info section, no Opponent. |
| `KG` | Short Report (Kurzgutachten) | Same as HS but NO Correction Calculation and NO result cards |
| `OT` | Oldtimer Valuation | Tab "Customer" (not "Accident Info"), "Valuation" (not "Calculation"). No Accident/Opponent sections. Client section (not Claimant), 2 checkboxes only. Present subsection in Visits. Vehicle Grading + Value Increasing Features in Condition. Oldtimer Valuation: Market value + Replacement value + Restoration Value + Total Cost. |

Each type has distinct sections — see `docs/ARCHITECTURE.md` for the full matrix.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, Turbopack dev)
- **Language:** TypeScript strict mode
- **Styling:** Tailwind CSS v4 with `@theme inline` design tokens
- **Forms:** React Hook Form + Zod validation
- **Server state:** TanStack Query (React Query)
- **Database:** Supabase PostgreSQL + Prisma ORM
- **Auth:** Supabase Auth (email/password + Google/Apple OAuth)
- **Storage:** Supabase Storage (photo uploads)
- **Canvas:** Fabric.js for photo annotation
- **PDF:** @react-pdf/renderer for report generation
- **Email:** Resend for transactional emails
- **Payments:** Stripe (Pro plan subscriptions)
- **Linting:** Biome v2.4
- **Testing:** Vitest (unit) + Playwright (E2E)

See `docs/TECH_STACK.md` for full details.

---

## Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| DAT SilverDAT3 | Vehicle data, valuation, repair cost calculation | Primary — credentials stored per user |
| Audatex | Alternative calculation provider | Coming Soon |
| GT Motive | Alternative calculation provider | Coming Soon |
| Stripe | Payment processing for Pro plan subscriptions | Required |
| Google OAuth | Social login | Required |
| Apple OAuth | Social login | Required |
| Email (SMTP/API) | Send reports to recipients | Required |
| AI/ML Service | Image analysis, damage detection, auto-fill from photos, VIN detection | Pro feature |

---

## Important Business Rules

1. **Report locking:** Reports can be locked after sending (toggle on Export & Send screen). Locked reports should be read-only.
2. **Signature types:** Three distinct signature purposes — Lawyer, Data Permission, Cancellation. Each can be drawn or uploaded.
3. **BVSK fee schedule:** Invoice auto-calculates based on BVSK standard rates. Users can customize line items.
4. **E-Invoice toggle:** Supports electronic invoice format (likely ZUGFeRD for German market).
5. **Paint thickness scale:** Color-coded: Blue (<70µm) → Green (≥70µm) → Yellow (>160µm) → Orange (>300µm) → Red (>700µm).
6. **Photo limit:** Maximum 20 images per report.
7. **Photo requirements:** Good lighting, no flash, JPG/PNG format.
8. **14-day free trial:** Pro plan starts with trial. Payment details collected upfront but not charged until trial ends.
9. **Completion tracking:** Each report section shows completion percentage (e.g., "50% Complete", "3/4 fields").

---

## File/Folder Convention

```
src/
├── app/                    # Routes / pages
├── components/
│   ├── ui/                 # Shared primitives (Button, Input, Card, etc.)
│   ├── layout/             # Header, Sidebar, PageContainer
│   ├── auth/               # Login, signup wizard components
│   ├── report/             # Report editor components
│   │   ├── gallery/        # Photo upload, grid, annotation
│   │   ├── accident-info/  # Accident overview form sections
│   │   ├── vehicle/        # Vehicle details & specs
│   │   ├── condition/      # Condition, damage diagram, paint, tires
│   │   ├── calculation/    # Value & repair calculation
│   │   ├── invoice/        # Invoice builder
│   │   └── export/         # Export & send
│   └── signature/          # Signature pad, signature types
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, API client, validators
├── stores/                 # Zustand stores (or Redux slices)
├── types/                  # TypeScript interfaces & types
├── styles/                 # Global styles, theme config
└── assets/                 # Static assets, icons, images
```

---

## Design Token Rules — MANDATORY

All styles MUST use Tailwind design tokens from `src/app/globals.css`. **Never hardcode hex colors, rgba values, or arbitrary px sizes when a token exists or can be created.**

### Token → Utility class mapping (Tailwind v4 `@theme inline`)
| Token | Utility | Value |
|-------|---------|-------|
| `--color-primary` | `bg-primary` / `text-primary` / `border-primary` | `#019447` |
| `--color-primary-hover` | `bg-primary-hover` | `#017A3C` |
| `--color-black` | `text-black` | `#121312` |
| `--color-grey-100` | `text-grey-100` | `#6B7280` |
| `--color-danger` | `text-danger` / `border-danger` | `#DF0808` |
| `--color-text-secondary` | `text-text-secondary` | `#3E4541` |
| `--color-border` | `border-border` | `#E5E7EB` |
| `--color-border-card` | `border-border-card` | `#EAEAEA` |
| `--color-border-subtle` | `border-border-subtle` | `#EEF0F3` |
| `--color-success-dark` | `text-success-dark` | `#126147` |
| `--color-warning-dark` | `text-warning-dark` | `#A78700` |
| `--color-warning-border` | `border-warning-border` | `#EEC200` |
| `--color-negative` | `text-negative` | `#FF383C` |
| `--color-overlay` | `bg-overlay` | `#202020` |
| `--color-surface-secondary` | `bg-surface-secondary` | `#F6F6F6` |
| `--radius-md` | `rounded-md` | 8px |
| `--radius-lg` | `rounded-lg` | 12px |
| `--radius-xl` | `rounded-xl` | 16px |
| `--radius-btn` | `rounded-btn` | 15px |
| `--radius-card` | `rounded-card` | 20px |
| `--radius-2xl` | `rounded-2xl` | 24px |
| `--radius-section` | `rounded-section` | 32px |
| `--text-caption` | `text-caption` | 12px |
| `--text-body-sm` | `text-body-sm` | 14px |
| `--text-body` | `text-body` | 16px |
| `--text-input` | `text-input` | 18px |
| `--text-h3` | `text-h3` | 20px |
| `--text-section-title` | `text-section-title` | 21px |
| `--text-subsection` | `text-subsection` | 22px |
| `--text-plan-label` | `text-plan-label` | 23px |
| `--text-h2` | `text-h2` | 24px |
| `--text-page-title` | `text-page-title` | 32px |
| `--text-hero` | `text-hero` | 44px |

### Rules
1. **Always use tokens.** Before writing `text-[#fff]` or `rounded-[12px]`, check this table.
2. **Create tokens when missing.** If the Figma uses a value not in the table above, add it to `src/app/globals.css` under the appropriate section (`@theme inline`), then use the generated utility class.
3. **Opacity modifiers are fine** — `bg-primary/10`, `bg-overlay/50`, `bg-grey-25/50` etc. are all valid.
4. **SVG attributes are exempt** — `stroke="#019447"` and `stopColor="#019447"` inside `<svg>` cannot use Tailwind classes.
5. **Never edit base components** (`input.tsx`, `label.tsx`, `button.tsx`) to match one screen's design. Instead use `className` prop overrides or create a variant.

---

## Coding Conventions

- TypeScript strict mode — no `any`
- Functional components only
- Named exports (no default exports)
- Co-locate tests next to source files (`Component.test.tsx`)
- Form validation with Zod schemas
- All API calls through a centralized client with interceptors
- Error boundaries at route level
- Consistent naming: PascalCase components, camelCase functions/variables, SCREAMING_SNAKE constants
- All strings that could be localized should be extractable (prepare for i18n even if not implementing now)

---

## Git Rules — STRICT

- **NEVER commit or push without explicit user approval.** Always show what will be committed and wait for the user to say "commit" or "push" before running those commands.
- Never add `Co-Authored-By: Claude` to commit messages.

---

## What NOT to Do

- Do NOT skip reading `docs/ARCHITECTURE.md` before implementing any feature
- Do NOT hardcode German text — keep strings separate for future localization
- Do NOT implement authentication from scratch — Supabase Auth is already set up
- Do NOT store sensitive data (DAT credentials, signatures) in plain local storage

---

## Current Implementation Status (April 2026)

The app is **feature-complete** with all 4 report types working end-to-end.

### What's Built
- Auth: login, signup (5-step wizard), forgot/reset password, Google/Apple OAuth
- Dashboard: revenue chart, report list with pagination, create/delete reports
- Gallery: photo upload (max 20), grid/single view, Fabric.js annotation canvas, AI generation
- Report Details: 5 tabs with auto-save, dynamic tab completion badges
- All 4 report types (HS/BE/KG/OT) with correct conditional sections
- PDF export with report-type-specific templates
- Email send via Resend with PDF attachment
- Report locking (read-only after send, unlockable from Export)
- Settings: Profile, Business, Integrations (DAT), Billing (Stripe), Templates
- Notifications with click-to-navigate
- Statistics with revenue chart and invoice history

### Key Architecture Decisions
- **Auto-save** via `useAutoSave` hook — debounced, silent, queued, flush-on-unmount
- **Form data** read via `getValues()` (not DOM queries) for React Hook Form compatibility
- **Array fields** (visits, line items) — save entire array on blur, API replaces all when no IDs
- **Tab completion** — dynamic `useTabCompletion` hook counts filled sections per report type
- **PDF template** — conditionally renders sections based on `reportType` (hides HS fields for BE/OT)
- **Gallery sidebar** — shows report nav when photos exist (not just after AI generation)

### Documentation
| Document | Location | Purpose |
|----------|----------|---------|
| This file (CLAUDE.md) | `/CLAUDE.md` | Project brain — conventions, tokens, rules |
| Architecture spec | `docs/ARCHITECTURE.md` | Full screen inventory, data model, auto-save, PDF, testing |
| Tech stack | `docs/TECH_STACK.md` | Technology decisions |
| Figma registry | `docs/figma-registry.md` | Figma node IDs |
| Design screenshots | `design/` | 58 Figma references by flow |
| Email templates | `supabase/email-templates/` | 5 branded Supabase email templates |

### E2E Testing
16 Playwright test specs in `testing/e2e/` covering all flows. Reference PDFs in `testing/reference-pdfs/`.

```bash
npm run test:e2e              # All tests
npm run test:e2e:hs           # Full HS Liability flow
npm run test:e2e:be           # Full BE Valuation flow
npm run test:e2e:kg           # Full KG Short Report flow
npm run test:e2e:ot           # Full OT Oldtimer flow
npm run test:e2e:flows        # All 4 flows
npm run test:e2e:all-reports  # Create + fill + send all 4 via email
```

See `testing/README.md` for full testing documentation.
