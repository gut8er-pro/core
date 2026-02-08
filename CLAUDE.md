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

---

## Tech Stack (TO BE DECIDED)

> The designs are clearly a **desktop-first web application** (wide layouts, sidebars, multi-column forms, rich text editor, canvas drawing tools).
> Stack decision pending — see section below.

### Important Consideration
The designs show a **web app**, NOT a mobile app. The original suggestion of React Native CLI should be reconsidered. Options:

**Option A — Web App (recommended based on designs):**
- Next.js or Vite + React
- TypeScript strict mode
- Zustand or Redux Toolkit for state
- React Query (TanStack Query) for server state
- React Hook Form + Zod validation
- Tailwind CSS or CSS Modules
- Fabric.js / Konva.js for canvas annotation
- Signature pad library for digital signatures

**Option B — React Native (if mobile is required):**
- React Native CLI + react-native-web for cross-platform
- This would require significant adaptation of the desktop-first designs

**Option C — Both:**
- Web app first (matches designs), mobile later as separate project

### Decision needed from you:
- Is this a web app, mobile app, or both?
- If web: Next.js (SSR) or Vite+React (SPA)?

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

## File/Folder Convention (once we start coding)

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

## Coding Conventions (once we start)

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

## What NOT to Do

- Do NOT write code until the tech stack is confirmed
- Do NOT skip reading `docs/ARCHITECTURE.md` before implementing any feature
- Do NOT hardcode German text — keep strings separate for future localization
- Do NOT implement authentication from scratch — use a proven auth library/service
- Do NOT store sensitive data (DAT credentials, signatures) in plain local storage
