# Gut8erPRO

Professional vehicle damage assessment web application for German automotive experts (Kfz-Sachverständige). Streamlines the creation of insurance damage reports by combining photo upload, AI-powered analysis, vehicle data integration, interactive damage diagrams, calculation, invoicing, and digital signatures into one workflow.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript (strict)
- **Styling**: Tailwind CSS v4 + Radix UI primitives + CVA
- **Database**: PostgreSQL via Prisma ORM + Supabase
- **Auth**: Supabase Auth (email/password + Google/Apple OAuth)
- **Storage**: Supabase Storage (photo uploads)
- **State**: Zustand (client) + TanStack Query v5 (server)
- **Forms**: React Hook Form + Zod validation
- **Payments**: Stripe (subscriptions, 14-day trial)
- **AI**: Claude API (image analysis, VIN/plate detection, document OCR)
- **Email**: Resend (transactional emails)
- **PDF**: @react-pdf/renderer (report export)
- **Canvas**: Fabric.js (photo annotation)
- **Testing**: Vitest + Testing Library (unit/component), Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (or Supabase project)

### Installation

```bash
pnpm install
```

### Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `ANTHROPIC_API_KEY` | Anthropic API key (for AI features) |
| `RESEND_API_KEY` | Resend API key (for email) |
| `NEXT_PUBLIC_APP_URL` | App URL (default: `http://localhost:3000`) |

### Database Setup

```bash
pnpm prisma generate
pnpm prisma db push
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit/component tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm lint` | Lint with Biome |
| `pnpm lint:fix` | Lint and auto-fix |
| `pnpm format` | Format with Biome |
| `pnpm type-check` | TypeScript type checking |
| `pnpm analyze` | Bundle size analysis |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Authenticated routes (dashboard, reports, settings)
│   ├── (auth)/             # Auth routes (login, signup)
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Shared UI primitives (Button, Card, Modal, etc.)
│   ├── layout/             # TopNavBar, ReportSidebar
│   ├── auth/               # Signup wizard steps
│   ├── report/             # Report editor (gallery, accident-info, vehicle, condition, calculation, invoice, export)
│   └── signature/          # Digital signature pad
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
├── lib/
│   ├── ai/                 # Claude AI client + cache
│   ├── auth/               # Server actions (login, signup, logout)
│   ├── supabase/           # Supabase client/server/middleware
│   ├── stripe/             # Stripe client + subscription utils
│   ├── storage/            # Photo storage + Sharp image processing
│   ├── validations/        # Zod schemas
│   └── utils/              # Utility functions
├── types/                  # TypeScript interfaces
└── test/                   # Test utilities + MSW handlers
```

## Features

### Report Workflow

1. **Gallery** — Upload photos (max 20), view/edit grid, annotate with Fabric.js drawing tools
2. **Accident Info** — Accident details, claimant/opponent info, visit records, expert opinion, digital signatures
3. **Vehicle** — VIN identification, specs, vehicle type/motor/axles/doors/seats selectors
4. **Condition** — Interactive SVG damage diagram, paint thickness measurements (color-coded scale), tire details, prior damage
5. **Calculation** — Vehicle value, repair costs, loss of use, DAT integration modal
6. **Invoice** — BVSK fee schedule, editable line items, auto-calculation, PDF preview
7. **Export & Send** — Email composition, PDF generation with section toggles, report locking

### AI Features (Pro Plan)

- Photo damage analysis via Claude Sonnet
- VIN detection from registration photos via Claude Haiku
- License plate detection via Claude Haiku
- Document OCR (Zulassungsbescheinigung) via Claude Sonnet
- Auto-fill forms from AI results
- Results cached for 1 hour per photo

### Monetization

- **Free Plan**: Manual data entry, PDF export
- **Pro Plan** (EUR 49/month): AI auto-fill, image analysis, VIN detection, priority support
- 14-day free trial with Stripe billing

## Testing

638 unit/component tests across 69 test files. E2E tests cover auth flows, report workflow, responsive layouts, and visual regression at 3 viewport sizes (desktop 1440x900, tablet landscape 1024x768, tablet portrait 768x1024).

```bash
# Unit/component tests
pnpm test

# E2E tests
pnpm test:e2e
```

## License

Private — All rights reserved.
