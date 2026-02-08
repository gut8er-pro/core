# docs/TECH_STACK.md — Gut8erPRO Technology Stack

> Recommended full stack for a desktop-first web app with complex forms,
> photo annotation, AI image analysis, PDF generation, Stripe payments,
> and German B2B market requirements. Optimized for 2026.

---

## Full Stack Summary

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Next.js 15 · TypeScript · Tailwind v4           │
│  shadcn/ui · React Hook Form · Zod              │
│  TanStack Query · Zustand · Fabric.js · Tiptap  │
├─────────────────────────────────────────────────┤
│                   BACKEND                        │
│  Next.js Server Actions + Route Handlers         │
│  Prisma ORM · Zod validation                     │
├─────────────────────────────────────────────────┤
│                   DATABASE                       │
│  PostgreSQL (Supabase) · Prisma migrations       │
├─────────────────────────────────────────────────┤
│                   AUTH                           │
│  Supabase Auth (email + Google + Apple)          │
├─────────────────────────────────────────────────┤
│                   AI                             │
│  Anthropic Claude API · Vercel AI SDK            │
├─────────────────────────────────────────────────┤
│                   STORAGE                        │
│  Supabase Storage (photos, documents, signatures)│
├─────────────────────────────────────────────────┤
│                   SERVICES                       │
│  Stripe (payments) · Resend (email)              │
│  React Email (templates) · react-pdf (PDFs)      │
├─────────────────────────────────────────────────┤
│                   DEPLOY                         │
│  Vercel (app) · Supabase (DB+storage+auth)       │
│  Cloudflare (DNS) · Sentry (monitoring)          │
└─────────────────────────────────────────────────┘
```

---

## Frontend — Next.js 15 (App Router) + TypeScript

**Why:** Next.js is the dominant React framework in 2026. App Router is fully
mature. You get SSR for the landing/SEO pages, client-side interactivity for
the heavy report editor, Server Actions for mutations, and Route Handlers for
webhooks — all in one codebase. Fastest path to production.

---

## UI Layer

| Tool | Why |
|------|-----|
| **Tailwind CSS v4** | Maps directly to design tokens. Utility-first = fast iteration. Industry standard. |
| **shadcn/ui** | Not a library — copy-paste Radix UI components you own. Dialog, Select, Tabs, Toggle, Tooltip etc. Infinitely customizable. |
| **React Hook Form + Zod** | This app is 80% forms. RHF handles large forms without performance issues. Zod gives type-safe validation. |
| **TanStack Query v5** | Server state (reports list, auto-save, refetch). Optimistic updates, caching, background refetch. |
| **Zustand** | Minimal global client state (auth session, UI preferences). Tiny API, no boilerplate. |
| **Fabric.js** | Photo annotation canvas (draw, rectangle, arrow, crop, color picker). Battle-tested for this use case. |
| **Tiptap** | Rich text editor for Export & Send email body. Headless, extensible, ProseMirror-based. |
| **react-signature-canvas** | Digital signature pad. Small, does one thing well. |
| **Lucide React** | Icons. Outlined 1.5px stroke matches designs exactly. |

---

## Backend — Next.js Server Actions + Route Handlers

**Why not a separate backend?** For the initial version, keeping everything in
Next.js means one codebase, one deployment, one language. Server Actions handle
form mutations. Route Handlers handle webhooks (Stripe, DAT callbacks).

If the app grows large enough to need a separate backend, **NestJS**
(TypeScript, modular, enterprise-grade) is the natural extraction target.

---

## Database — PostgreSQL via Supabase

| Tool | Why |
|------|-----|
| **Supabase** (managed PostgreSQL) | PostgreSQL + Auth + File Storage + Row Level Security + Realtime in one platform. Massive time saver. Free tier for dev. |
| **Prisma ORM** | Type-safe database client. Schema-first migrations. Excellent TypeScript integration. Works perfectly with Supabase's PostgreSQL. |

**Why PostgreSQL?** Data is highly relational (User → Business → Reports →
Photos → Annotations → Invoices). Postgres handles JSON fields for flexible
data (damage markers, annotation coordinates) while keeping strict relations
where needed.

---

## Authentication — Supabase Auth

**Primary: Supabase Auth** — Already included with Supabase. Handles
email/password, Google OAuth, Apple OAuth out of the box. JWT-based, works
with Row Level Security. One less service to configure.

**Alternative: Auth.js (NextAuth v5)** — If you want more control or plan to
leave Supabase later.

---

## AI — Anthropic Claude API

| Feature | How |
|---------|-----|
| **Damage photo analysis** | Claude vision — send photo, get structured damage description |
| **Document OCR** | Claude vision — extract fields from Zulassungsbescheinigung |
| **Auto-fill from photos** | Claude vision — detect VIN, license plate, vehicle details from photos |
| **Damage description generation** | Claude text — generate professional assessment text |
| **Form auto-complete** | Claude text — suggest values based on partial data |

**Tools:**
- `@anthropic-ai/sdk` — Official Anthropic TypeScript SDK
- `ai` (Vercel AI SDK) — Streaming responses, tool calling, structured output.
  Framework-agnostic, works great with Next.js.

**Why Claude?** Vision capabilities are excellent for this exact use case
(analyzing vehicle damage photos, reading German documents). Structured output
mode means you get typed JSON back, not freeform text.

---

## File Storage — Supabase Storage

**Primary: Supabase Storage** — Already part of Supabase project. Direct
upload from client, signed URLs, image transformations. Simple.

**If cost matters at scale: Cloudflare R2** — Zero egress fees. This app is
photo-heavy (20 photos per report, hundreds of reports). At scale, R2 saves
significant money vs S3/Supabase Storage.

---

## Payments — Stripe

| Component | Tool |
|-----------|------|
| Subscription management | Stripe Billing |
| Checkout | Stripe Checkout (hosted) or Stripe Elements (embedded) |
| Webhooks | Next.js Route Handler at `/api/webhooks/stripe` |
| Client SDK | `@stripe/stripe-js` + `@stripe/react-stripe-js` |

14-day trial → Stripe handles this natively with `trial_period_days`.

---

## Email — Resend + React Email

| Tool | Why |
|------|-----|
| **Resend** | Modern email API. Built for developers. Great deliverability. Free tier: 3000 emails/month. |
| **React Email** | Build email templates as React components. Type-safe, preview in browser. Perfect for report delivery emails. |

---

## PDF Generation — @react-pdf/renderer

For invoice preview and report PDF export. `@react-pdf/renderer` runs on the
server, generates PDFs from React components. If you need pixel-perfect PDF
matching your web layout, use Puppeteer/Playwright to render and print-to-PDF.

---

## Deployment

| Layer | Service | Why |
|-------|---------|-----|
| **App** | **Vercel** | Native Next.js hosting. Zero-config. Edge functions, ISR, image optimization built-in. Auto-preview deployments per PR. |
| **Database** | **Supabase** (managed) | Frankfurt region (eu-central-1) for German data residency / GDPR. |
| **File storage** | **Supabase Storage** | Same region as DB. Or Cloudflare R2 with EU bucket. |
| **AI** | **Anthropic API** | Direct API calls from server-side. |
| **Payments** | **Stripe** | SaaS, no hosting needed. |
| **Email** | **Resend** | SaaS, no hosting needed. |
| **Domain/DNS** | **Cloudflare** | Free DNS, DDoS protection, optional CDN. |

---

## Monitoring & DevOps

| Tool | Purpose |
|------|---------|
| **Sentry** | Error tracking + performance monitoring. Next.js SDK is excellent. |
| **Vercel Analytics** | Web vitals, page performance. Built-in. |
| **GitHub Actions** | CI/CD — lint, type-check, test on every PR. Vercel auto-deploys. |
| **Posthog** (optional) | Product analytics — track feature usage, onboarding completion. |

---

## Dev Tooling

| Tool | Purpose |
|------|---------|
| **pnpm** | Package manager. Fast, disk-efficient. Industry standard 2026. |
| **Biome** | Linter + formatter in one. Faster than ESLint + Prettier combo. |
| **Vitest** | Unit testing. Vite-native, fast, Jest-compatible API. |
| **Playwright** | E2E testing. Cross-browser. |
| **Storybook** | Component development. Useful for 20+ shared components. |

---

## Why This Stack Specifically

1. **Single language everywhere** — TypeScript frontend to backend to DB
   queries. No context switching.
2. **Supabase collapses 3-4 services into one** — Auth + DB + Storage +
   Realtime. Massive speed boost for the initial version.
3. **Claude vision is purpose-built for the AI features** — Vehicle damage
   analysis, document OCR, VIN detection. No need for separate ML models.
4. **shadcn/ui + Tailwind maps 1:1 to design tokens** — DESIGN_TOKENS.md
   becomes `tailwind.config.ts` directly. No translation layer.
5. **Vercel + Supabase is the most common Next.js production stack in 2026** —
   Huge ecosystem, tons of examples, easy to hire for.
6. **Everything has a generous free tier** — Build and test the entire app
   before spending money.

---

## NPM Packages — Complete List

### Core
```
next react react-dom typescript
```

### UI & Styling
```
tailwindcss @tailwindcss/postcss
lucide-react
class-variance-authority clsx tailwind-merge
```

### shadcn/ui (installed per component, not a single package)
```
@radix-ui/react-dialog
@radix-ui/react-select
@radix-ui/react-tabs
@radix-ui/react-toggle
@radix-ui/react-tooltip
@radix-ui/react-dropdown-menu
@radix-ui/react-accordion
@radix-ui/react-switch
@radix-ui/react-checkbox
@radix-ui/react-radio-group
@radix-ui/react-label
@radix-ui/react-separator
@radix-ui/react-progress
```

### State & Data Fetching
```
zustand
@tanstack/react-query
```

### Forms & Validation
```
react-hook-form
zod
@hookform/resolvers
```

### Database & Backend
```
@prisma/client prisma
@supabase/supabase-js
@supabase/ssr
```

### AI
```
@anthropic-ai/sdk
ai @ai-sdk/anthropic
```

### Canvas / Drawing / Signatures
```
fabric
react-signature-canvas
```

### Rich Text
```
@tiptap/react @tiptap/starter-kit @tiptap/extension-text-align
@tiptap/extension-underline @tiptap/extension-link
```

### Payments
```
@stripe/stripe-js @stripe/react-stripe-js stripe
```

### File Handling
```
react-dropzone
browser-image-compression
```

### Email
```
resend @react-email/components
```

### PDF
```
@react-pdf/renderer
```

### Date & Formatting
```
date-fns
```

### Dev Dependencies
```
@biomejs/biome
vitest @testing-library/react @testing-library/jest-dom
playwright @playwright/test
msw
storybook @storybook/react-vite
@sentry/nextjs
@vercel/analytics
```

---
---

# PART 2 — COSTS, DEPLOYMENT, OPERATIONS & RISKS

> Everything you need to know before writing a single line of code.

---

## 7. COST BREAKDOWN

### 7.1 Service-by-Service Pricing

#### Vercel (App Hosting)

| Plan | Cost | What You Get |
|------|------|--------------|
| **Hobby** | **$0/mo** | 1 developer, non-commercial only. 100 GB bandwidth. |
| **Pro** | **$20/mo per team member** | 1 TB bandwidth, unlimited projects, preview deployments, analytics. $20 monthly credit for usage. |
| **Enterprise** | ~$20K+/year | SSO, SLA, dedicated support. |

**Overage charges (Pro):**
- Bandwidth: $0.15/GB after 1 TB
- Serverless function execution: included in $20 credit, then usage-based
- Image optimization: 1,000 free, then $5 per 1,000

**For Gut8erPRO:** Start on **Hobby** during development, move to **Pro ($20/mo)** at launch. One developer = $20/mo. Two developers = $40/mo.

**Source:** [Vercel Pricing](https://vercel.com/pricing)

---

#### Supabase (Database + Auth + Storage)

| Plan | Cost | What You Get |
|------|------|--------------|
| **Free** | **$0/mo** | 2 projects, 500 MB DB, 1 GB storage, 50K MAUs, 2 GB egress. **Projects pause after 7 days inactivity.** |
| **Pro** | **$25/mo** | 8 GB DB, 100 GB storage, 100K MAUs, 250 GB egress. $10 compute credit included. Spend cap on by default. |
| **Team** | **$599/mo** | Pro + SOC 2, SSO, 28-day log retention. |

**Overage charges (Pro, if spend cap is off):**
- Database: $0.125/GB-month over 8 GB
- Storage: $0.021/GB-month over 100 GB
- Egress: $0.09/GB over 250 GB
- Auth MAUs: $0.00325 per MAU over 100K
- File upload limit: up to 500 GB per file (Pro), 50 MB (Free)

**For Gut8erPRO:** **Free** during development (will pause — fine for dev). **Pro ($25/mo)** at launch. 100 GB storage handles ~10,000 reports (20 photos * ~500KB avg = 10MB/report). Plenty for year 1.

**Source:** [Supabase Pricing](https://supabase.com/pricing)

---

#### Stripe (Payment Processing)

| Fee Type | Rate |
|----------|------|
| **European cards** | **1.5% + €0.25** per transaction |
| **Non-European cards** | 2.5% + €0.25 per transaction |
| **Stripe Billing** (subscriptions) | +0.5% of recurring revenue |
| **Stripe Tax** (if used) | +0.5% per transaction |
| **Chargebacks** | €15 per dispute |
| **Payouts** | Free (standard), €0.30 for instant |

**No monthly fee.** You only pay per transaction.

**For Gut8erPRO:** Pro plan is €49/mo. Per subscriber: Stripe takes ~€1.49 (1.5% + €0.25) + €0.245 (0.5% billing) = **~€1.74 per month per subscriber**. Net revenue: ~€47.26/subscriber/month.

At 100 subscribers: ~€174/mo in Stripe fees. At 1,000 subscribers: ~€1,740/mo.

**Source:** [Stripe Pricing](https://stripe.com/pricing)

---

#### Anthropic Claude API (AI Features)

| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| **Claude Haiku 4.5** | **$1/M tokens** | **$5/M tokens** | Quick VIN detection, license plate reading |
| **Claude Sonnet 4.5** | **$3/M tokens** | **$15/M tokens** | Damage descriptions, document OCR |
| **Claude Opus 4.5** | **$5/M tokens** | **$25/M tokens** | Complex multi-photo analysis (rarely needed) |

**Vision:** Same pricing as text — images are converted to tokens. A typical photo ≈ 1,000-2,000 tokens.

**Cost optimizations:**
- Prompt caching: cached input = 0.1x base rate (90% savings on repeated prompts)
- Batch API: 50% discount for non-urgent processing
- Use Haiku for simple tasks (VIN/plate detection), Sonnet for complex analysis

**For Gut8erPRO estimate per report (5 AI operations):**
- 2x photo analysis (Sonnet): ~4,000 input + 1,000 output tokens = ~$0.027
- 1x document OCR (Sonnet): ~3,000 input + 500 output tokens = ~$0.017
- 1x damage description (Sonnet): ~2,000 input + 500 output tokens = ~$0.014
- 1x auto-fill (Haiku): ~1,000 input + 500 output tokens = ~$0.004
- **Total per report: ~$0.06 (~€0.055)**

At 100 reports/month: ~€5.50/mo. At 1,000 reports/month: ~€55/mo.

**Source:** [Claude API Pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)

---

#### Resend (Email)

| Plan | Cost | Limit |
|------|------|-------|
| **Free** | **$0/mo** | 3,000 emails/month, 100/day |
| **Pro** | **$20/mo** | 50,000 emails/month |
| **Scale** | **$90/mo** | 100,000 emails/month |

**For Gut8erPRO:** Each sent report = 1 email. **Free tier** covers ~100 reports/day, 3,000/month — fine for initial launch. Move to **Pro ($20/mo)** when sending > 3K emails/month.

**Source:** [Resend Pricing](https://resend.com/pricing)

---

#### Sentry (Error Monitoring)

| Plan | Cost | What You Get |
|------|------|--------------|
| **Developer** | **$0/mo** | 5K errors, 10K transactions, 500 replays/month |
| **Team** | **$29/mo** | 50K errors, 100K transactions, 500 replays |
| **Business** | **$89/mo** | Higher limits, integrations, escalation |

**For Gut8erPRO:** **Developer (free)** during development and early launch. **Team ($29/mo)** once you have paying users and need alerts/collaboration.

**Source:** [Sentry Pricing](https://sentry.io/pricing/)

---

#### Cloudflare (DNS + CDN)

| Service | Cost |
|---------|------|
| **DNS** | **Free** forever |
| **CDN/proxy** | **Free** (included with DNS) |
| **DDoS protection** | **Free** (included) |
| **R2 Storage** (if used) | $0.015/GB-month, **zero egress**, 10 GB free |

**For Gut8erPRO:** **$0/mo.** Free DNS + CDN + DDoS protection. If you switch to R2 for photos later, still extremely cheap.

**Source:** [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)

---

#### PostHog (Product Analytics — Optional)

| Plan | Cost | What You Get |
|------|------|--------------|
| **Free** | **$0/mo** | 1M events, 5K recordings, unlimited team members |
| **Paid** | Usage-based | ~$0.00031/event after free tier |

**For Gut8erPRO:** **Free** for a long time. 1M events/month covers thousands of active users.

**Source:** [PostHog Pricing](https://posthog.com/pricing)

---

#### Domain Name

| Item | Cost |
|------|------|
| .com domain | ~€10-15/year |
| .de domain (if needed) | ~€5-10/year |

---

#### GitHub (Source Code)

| Plan | Cost |
|------|------|
| **Free** | $0/mo — unlimited private repos, 2,000 CI minutes/month |
| **Team** | $4/user/month — if you need org features |

**For Gut8erPRO:** **Free** for solo/small team.

---

### 7.2 Total Monthly Cost Scenarios

#### Development Phase (building the app)

| Service | Cost |
|---------|------|
| Vercel Hobby | $0 |
| Supabase Free | $0 |
| Stripe | $0 (no transactions) |
| Claude API (testing) | ~$2-5 |
| Resend Free | $0 |
| Sentry Developer | $0 |
| Cloudflare | $0 |
| GitHub Free | $0 |
| Domain | ~$1/mo (~$12/yr) |
| **TOTAL** | **~$3-6/month** |

#### Launch Phase (1-50 paying users)

| Service | Cost |
|---------|------|
| Vercel Pro (1 dev) | $20 |
| Supabase Pro | $25 |
| Stripe fees (~25 subs) | ~$44 |
| Claude API (~200 reports) | ~$12 |
| Resend Free | $0 |
| Sentry Developer | $0 |
| Cloudflare | $0 |
| Domain | ~$1 |
| **TOTAL** | **~$102/month** |
| **Revenue** (25 Pro subs) | **~€1,225/month** |

#### Growth Phase (200-500 paying users)

| Service | Cost |
|---------|------|
| Vercel Pro (2 devs) | $40 |
| Supabase Pro | $25 + ~$20 overages |
| Stripe fees (~350 subs) | ~$609 |
| Claude API (~3,000 reports) | ~$165 |
| Resend Pro | $20 |
| Sentry Team | $29 |
| PostHog Free | $0 |
| Cloudflare | $0 |
| Domain | ~$1 |
| **TOTAL** | **~$909/month** |
| **Revenue** (350 Pro subs) | **~€17,150/month** |

#### Scale Phase (1,000+ paying users)

| Service | Cost |
|---------|------|
| Vercel Pro (3 devs) | $60 |
| Supabase Pro/Team | $25-599 + overages |
| Stripe fees (~800 subs) | ~$1,392 |
| Claude API (~8,000 reports) | ~$440 |
| Resend Scale | $90 |
| Sentry Business | $89 |
| PostHog (may hit paid) | ~$50 |
| Cloudflare | $0 |
| **TOTAL** | **~$2,200-2,700/month** |
| **Revenue** (800 Pro subs) | **~€39,200/month** |

---

## 8. HOW DEPLOYMENT WORKS

### 8.1 Git-Based Deployment Flow

```
Developer pushes code
        │
        ▼
┌─────────────────┐     ┌──────────────────┐
│  GitHub Actions  │────▶│  Automated CI     │
│  (on push/PR)    │     │  - Type check     │
│                  │     │  - Lint (Biome)   │
│                  │     │  - Unit tests     │
│                  │     │  - Build check    │
└─────────────────┘     └───────┬──────────┘
                                │ ✅ Pass
                                ▼
                    ┌───────────────────────┐
                    │  Vercel Auto-Deploy    │
                    │                       │
                    │  PR → Preview URL     │
                    │  main → Production    │
                    └───────────────────────┘
```

### 8.2 Environment Setup

You need **three environments:**

| Environment | Branch | Vercel | Supabase | Purpose |
|-------------|--------|--------|----------|---------|
| **Development** | `dev` / local | `localhost:3000` | Free project (local or remote) | Daily coding |
| **Staging** | `staging` | Preview deployment | Separate Supabase project (Free) | Testing before release |
| **Production** | `main` | Production deployment | Pro project (Frankfurt) | Live users |

### 8.3 How a Deploy Happens (Step by Step)

1. **Developer** pushes to a feature branch → creates PR
2. **GitHub Actions** runs CI: type-check → lint → test → build
3. **Vercel** auto-creates a **preview deployment** with a unique URL (e.g., `gut8erpro-feat-xyz.vercel.app`)
4. You (or QA) test the preview URL
5. PR is approved and **merged to `main`**
6. **Vercel** auto-deploys to **production** (zero-downtime, atomic deployment)
7. If something breaks: **instant rollback** to previous deployment in Vercel dashboard (one click)

### 8.4 Database Migrations

```
Developer writes Prisma schema change
        │
        ▼
  prisma migrate dev          (local — generates SQL migration file)
        │
        ▼
  Commit migration file to git
        │
        ▼
  CI/CD runs:
  prisma migrate deploy       (staging/production — applies migration)
```

**Critical rule:** Never run `prisma migrate dev` against production. Only `prisma migrate deploy` in CI/CD.

**Rollback strategy:** Write a reverse migration SQL file for every migration. Prisma doesn't auto-rollback — you must plan rollbacks manually for destructive changes (dropping columns, etc.).

### 8.5 How Updates Work Day-to-Day

| What | How |
|------|-----|
| **Code update** | Push to GitHub → auto-deploy via Vercel. Takes ~30-60 seconds. |
| **Database schema change** | Write Prisma migration → test locally → commit → CI applies on deploy. |
| **Environment variables** | Update in Vercel dashboard (Settings → Environment Variables). Redeploy to pick up. |
| **Dependencies update** | `pnpm update` → test locally → commit → auto-deploy. |
| **Supabase config** | Supabase dashboard or CLI (`supabase` CLI for migrations, storage policies). |
| **Hotfix** | Push to `main` directly (or fast-track PR) → Vercel deploys in <60 seconds. |
| **Rollback** | Vercel dashboard → Deployments → click "Promote to Production" on any previous deployment. Instant. |

### 8.6 Domain & SSL Setup

1. Buy domain (e.g., `gut8erpro.de` or `gut8erpro.com`) from any registrar
2. Point nameservers to Cloudflare (free)
3. In Vercel: Settings → Domains → Add `gut8erpro.com`
4. In Cloudflare: Add CNAME record pointing to `cname.vercel-dns.com`
5. SSL certificate: **automatic** (Vercel provisions and renews Let's Encrypt certs)

---

## 9. RISKS & MITIGATIONS

### 9.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Vercel vendor lock-in** | Medium | Medium | Next.js can be self-hosted on any Node.js server (Railway, Fly.io, AWS). Migration takes 1-2 days. Vercel-specific features (edge middleware, image optimization) have alternatives. |
| **Supabase vendor lock-in** | Low | Medium | Supabase is open-source. You can self-host. Prisma ORM abstracts the DB layer — switching to any PostgreSQL host (Neon, RDS, Railway) means changing one connection string. Auth migration is harder — plan for it if using Supabase Auth. |
| **Supabase Free tier projects pause** | High | Low | Only affects development. Move to Pro ($25/mo) before any real users. |
| **Fabric.js complexity** | Medium | Medium | Canvas annotation is the most complex UI feature. Fabric.js has a learning curve. Alternative: Konva.js or excalidraw-based solution. Start with a simple annotation MVP (rectangle + text) and iterate. |
| **Next.js Server Actions maturity** | Low | Low | Server Actions are stable in Next.js 15. For complex backend logic, you can always add traditional API Route Handlers alongside them. |
| **Prisma performance at scale** | Low | Medium | Prisma adds slight overhead vs raw SQL. For 99% of queries this is negligible. For hot paths (report listing, search), you can drop to raw SQL via `prisma.$queryRaw`. |
| **Large form performance** | Medium | Medium | Report editor has 100+ form fields across tabs. React Hook Form handles this well with `useForm` per tab (not one massive form). Lazy-load tab content. |
| **Photo upload failures** | Medium | Medium | Implement resumable uploads with tus protocol or chunked upload. Add retry logic. Show progress per photo. Compress client-side before upload. |

### 9.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **DAT API access/changes** | Medium | High | DAT is a critical integration. Ensure you have a signed API agreement. Abstract DAT calls behind an interface so you can swap providers. Build the app to work without DAT (manual data entry as fallback). |
| **Stripe account approval (Germany)** | Low | High | Apply for Stripe account early. German businesses need KYC documents. Stripe may take 1-2 weeks to activate. Have documents ready. |
| **Claude API rate limits** | Low | Medium | Anthropic has rate limits per tier. Request a higher tier for production. Implement queue/retry logic. Cache AI results per photo (don't re-analyze the same photo). |
| **GDPR compliance** | High | High | See section 10 below. Must be addressed before launch. |
| **Payment failures / churn** | Medium | Medium | Stripe handles retry logic for failed payments (Smart Retries). Implement dunning emails via Resend. Grace period before downgrading to Free. |

### 9.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Production database loss** | Very Low | Critical | Supabase Pro includes daily automated backups (7-day retention). Additionally: set up pg_dump cron job to external storage for extra safety. |
| **Vercel outage** | Very Low | High | Vercel has 99.99% uptime SLA (Enterprise). For Pro: no SLA but historically very reliable. Keep a tested Docker deployment config as fallback (deploy to Railway/Fly.io in emergency). |
| **Supabase outage** | Very Low | High | Supabase has status page. Frankfurt region is well-provisioned. For critical uptime: consider Supabase Team plan with SOC 2 and priority support. |
| **Secret/key leak** | Low | Critical | Never commit `.env` files. Use Vercel environment variables (encrypted). Rotate keys immediately if leaked. Use Supabase Row Level Security as a second defense layer. |
| **Photo storage costs spike** | Low | Medium | Supabase spend cap (on by default) prevents surprise bills. Monitor storage usage. Implement image compression (target: <500KB per photo). Set max 20 photos per report. |

---

## 10. GDPR & DATA COMPLIANCE

This app handles personal data of German citizens. GDPR compliance is **mandatory**.

### What Personal Data We Process

| Data | Category | Retention |
|------|----------|-----------|
| User email, name, phone | Account data | Until account deletion |
| Business name, tax ID, VAT ID | Business data | Legal: 10 years (German tax law) |
| Claimant names, addresses, email | Third-party PII | Tied to report lifecycle |
| Vehicle data, license plates | Vehicle PII | Tied to report lifecycle |
| Damage photos | Evidence data | Tied to report lifecycle |
| Digital signatures | Legal documents | Tied to report lifecycle |
| Payment info | Financial | Handled by Stripe (PCI compliant) |

### Required GDPR Measures

| Requirement | Implementation |
|-------------|---------------|
| **Privacy Policy** | Must be published on the app. In German. Describe all data processing. |
| **Cookie Consent** | Banner for analytics cookies (PostHog, Vercel Analytics). Not needed for essential cookies (auth). |
| **Data Processing Agreement** | Needed with: Supabase, Vercel, Anthropic, Stripe, Resend. All provide DPAs. |
| **Right to Erasure** | Build "Delete Account" feature. Must cascade-delete all user data including photos in storage. |
| **Right to Export** | Build "Export My Data" feature. Generate ZIP of all user data. |
| **Data Residency** | Use Supabase Frankfurt region. Vercel Edge functions run in EU. Ensure Anthropic API calls route through EU (or document US processing in privacy policy). |
| **Encryption at Rest** | Supabase encrypts DB at rest (AES-256). Vercel functions are stateless. |
| **Encryption in Transit** | All connections use TLS/HTTPS. Enforced by Vercel + Supabase. |
| **Access Logging** | Supabase provides audit logs. Implement app-level audit trail for report access. |

### Hosting Regions

| Service | Region | EU-based? |
|---------|--------|-----------|
| Supabase | Frankfurt (eu-central-1) | Yes |
| Vercel | Automatic (nearest edge) | EU edge nodes available |
| Cloudflare | Global CDN (EU nodes) | Yes |
| Stripe | EU entity (Stripe Payments Europe) | Yes |
| Resend | US-based, EU DPA available | No (DPA covers it) |
| Anthropic | US-based, EU DPA available | No (DPA covers it) |

---

## 11. BACKUP & DISASTER RECOVERY

### Automated Backups

| What | How | Frequency | Retention |
|------|-----|-----------|-----------|
| Database | Supabase automatic backups | Daily | 7 days (Pro), 14 days (Team) |
| Database (extra) | `pg_dump` via cron to R2/S3 | Daily | 30 days |
| File storage | Supabase Storage (redundant) | Continuous | N/A — built-in redundancy |
| Code | GitHub | Every push | Permanent (git history) |
| Environment config | Vercel dashboard | On change | Version history in Vercel |

### Recovery Procedures

| Scenario | RTO (Recovery Time) | Procedure |
|----------|--------------------|-----------|
| **Bad deployment** | < 1 min | Vercel: instant rollback to previous deployment |
| **Bad migration** | 5-30 min | Run reverse migration SQL. Restore from backup if needed. |
| **Database corruption** | 10-60 min | Restore from Supabase daily backup (Point-in-Time Recovery on Team plan). |
| **Accidental data deletion** | 10-60 min | Restore from backup. RLS prevents unauthorized deletes. |
| **Full Supabase outage** | 1-4 hours | Spin up new PostgreSQL (Railway/Neon), restore from pg_dump, update connection string. |
| **Full Vercel outage** | 1-2 hours | Deploy to Railway/Fly.io from same Docker config. Update DNS. |

---

## 12. PERFORMANCE CONSIDERATIONS

### Expected Load Profile

| Metric | Initial | Growth | Scale |
|--------|---------|--------|-------|
| Concurrent users | 5-20 | 50-200 | 500-2,000 |
| Reports created/day | 5-20 | 50-200 | 500-2,000 |
| Photos uploaded/day | 100-400 | 1,000-4,000 | 10,000-40,000 |
| AI API calls/day | 25-100 | 250-1,000 | 2,500-10,000 |
| DB size (1 year) | < 1 GB | 2-5 GB | 10-50 GB |
| Storage size (1 year) | 5-20 GB | 50-200 GB | 500 GB - 2 TB |

### Optimization Strategy

| Area | Strategy |
|------|----------|
| **Photos** | Compress client-side to <500KB before upload. Generate thumbnails server-side. Lazy-load in gallery. Use `next/image` with Vercel optimization. |
| **Forms** | One `useForm` instance per tab (not per entire report). Debounced auto-save (2s). Only submit changed fields. |
| **AI calls** | Cache results per photo ID. Don't re-analyze unchanged photos. Use Haiku for simple tasks, Sonnet for complex. Batch API for non-urgent analysis. |
| **Database** | Index on `user_id`, `report_id`, `created_at`. Use Prisma `select` to fetch only needed fields. Paginate report lists. |
| **Bundle size** | Lazy-load heavy components (Fabric.js, Tiptap, Signature pad). Dynamic imports for route-level code splitting. |
| **Caching** | TanStack Query stale-while-revalidate. Vercel ISR for landing page. Browser cache for static assets. |

---

## 13. SECURITY CHECKLIST

| Item | How |
|------|-----|
| **Authentication** | Supabase Auth with JWT. httpOnly cookies for session. |
| **Authorization** | Supabase Row Level Security — users can only access their own reports. |
| **Input validation** | Zod schemas on both client AND server (never trust client). |
| **SQL injection** | Prisma parameterized queries (safe by default). Never use raw string interpolation. |
| **XSS** | React escapes by default. Sanitize rich text (Tiptap output) before rendering. |
| **CSRF** | Server Actions use built-in CSRF protection. |
| **File upload** | Validate file type server-side (check magic bytes, not just extension). Limit size. Scan for malware (optional: ClamAV). |
| **API keys** | All API keys in environment variables. Never in client bundle. Server-side only. |
| **DAT credentials** | Encrypt before storing in DB. Use `pgcrypto` extension or application-level encryption. |
| **Signatures** | Store as immutable. Once signed, the signature image cannot be modified. Timestamp all signatures. |
| **Rate limiting** | Add rate limiting to auth endpoints and AI endpoints. Use Vercel Edge Middleware or upstash/ratelimit. |
| **Dependency audits** | `pnpm audit` in CI. Renovate bot for automatic dependency updates. |

---

## 14. MONITORING & OBSERVABILITY

### What to Monitor

| Signal | Tool | Alert Threshold |
|--------|------|----------------|
| **JS errors** | Sentry | Any unhandled error → Slack/email alert |
| **API latency** | Sentry Performance | p95 > 2 seconds |
| **Uptime** | Vercel (or BetterStack) | Any downtime → immediate alert |
| **DB connections** | Supabase dashboard | > 80% pool usage |
| **Storage usage** | Supabase dashboard | > 80 GB (approaching Pro limit) |
| **Stripe failures** | Stripe dashboard + webhooks | Any failed payment → log + retry |
| **AI API errors** | Application logging | Any Claude API error → retry + alert |
| **Build failures** | GitHub Actions | Any CI failure → block merge |

### Logging Strategy

| Layer | What to Log |
|-------|-------------|
| **Application** | User actions (report created, photo uploaded, report sent), errors, AI call durations |
| **API** | All requests: method, path, user_id, status, duration |
| **Database** | Slow queries (via Supabase dashboard), migration events |
| **Auth** | Login attempts, failed logins, password resets |

Use structured JSON logging. In production, logs are in Vercel's log drain (can forward to Sentry, Datadog, or Axiom).

---

## 15. LOCAL DEVELOPMENT SETUP

### Prerequisites
```bash
node >= 20.x
pnpm >= 9.x
git
```

### First-Time Setup (expected flow)
```bash
git clone <repo>
cd gut8erpro
pnpm install
cp .env.example .env.local        # Fill in keys
pnpm prisma generate               # Generate Prisma client
pnpm prisma migrate dev            # Apply migrations to local DB
pnpm dev                           # Start dev server at localhost:3000
```

### Environment Variables Needed

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Prisma)
DATABASE_URL=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Anthropic
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 16. VERSION CONTROL & BRANCHING STRATEGY

### Git Flow (Simplified)

```
main (production)
  │
  ├── staging (pre-production testing)
  │
  └── feature/xxx (developer branches)
       └── PR → staging → main
```

### Rules
- `main` is always deployable (Vercel auto-deploys)
- All changes go through PRs with CI checks
- Squash merge to keep history clean
- Tag releases: `v1.0.0`, `v1.1.0`, etc.
- Never push directly to `main`

---

## 17. WHAT FREE TIERS COVER vs WHEN TO UPGRADE

| Service | Free Until... | Upgrade Trigger | Cost After |
|---------|--------------|-----------------|------------|
| Vercel | Commercial use | First paying customer | $20/mo |
| Supabase | 7 days idle / 500 MB DB | First paying customer | $25/mo |
| Stripe | N/A (always pay-per-use) | First transaction | ~1.75% + €0.25 |
| Claude API | N/A (always pay-per-use) | First AI feature used | ~$0.06/report |
| Resend | 3,000 emails/month | > 3K emails/month | $20/mo |
| Sentry | 5K errors/month | Need team alerts | $29/mo |
| Cloudflare | Forever (DNS/CDN) | Need Workers/R2 | $0.015/GB |
| PostHog | 1M events/month | > 1M events/month | Usage-based |
| GitHub | Forever (private repos) | Need org features | $4/user/mo |

**Bottom line:** You can build the entire app, test it, and soft-launch for under **$10/month**. Real costs only kick in when you have real revenue.

---

## 18. IMAGE STORAGE & OPTIMIZATION STRATEGY

Images are the biggest cost driver in Gut8erPRO — they affect **storage**,
**AI token costs**, and **bandwidth** simultaneously. This section defines the
complete image pipeline.

### 18.1 The Problem: Raw Photos Are Expensive Everywhere

A modern phone photo is typically 4000x3000px, ~5-12MB. For a report with 20 photos:

| Without optimization | Cost impact |
|---------------------|-------------|
| **Storage**: 20 x 8MB = 160MB/report | 100 GB Supabase limit hit at ~625 reports |
| **AI tokens**: 4000x3000 / 750 = 16,000 tokens/image | ~$0.048/image = **$0.96/report** with Sonnet (16x more than needed) |
| **Bandwidth**: user loads gallery = 160MB download | Slow UX, egress costs blow up |

### 18.2 Claude Vision Token Formula

```
tokens = (width × height) / 750
```

Claude auto-resizes any image with long edge > **1568px** before processing.
You're paying for pixels that get discarded if you send raw photos.

Optimal size for Claude: **max 1568px on longest edge** (~1.15 megapixels).
Below 200px degrades analysis quality.

**Source:** [Claude Vision Docs](https://docs.anthropic.com/en/docs/build-with-claude/vision)

### 18.3 The Solution: Process Once, Store Multiple Variants

```
User takes photo (4000x3000, 8MB)
         │
         ▼
┌──────────────────────────────────┐
│  STEP 1: CLIENT-SIDE COMPRESSION │
│  (browser-image-compression)     │
│                                  │
│  → Resize long edge to 1920px   │
│  → JPEG quality 85%             │
│  → Convert PNG → JPEG           │
│  → useWebWorker: true           │
│  → Output: ~300-600KB           │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  STEP 2: UPLOAD TO SUPABASE     │
│  (stores as "original")          │
│  Single upload, ~400KB average   │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  STEP 3: SERVER-SIDE VARIANTS    │
│  (Sharp in Next.js API route     │
│   or Supabase Edge Function)     │
│                                  │
│  thumbnail: 200×150   ~15KB     │
│  preview:   800×600   ~80KB     │
│  full:      1920×1440 ~400KB    │
│  ai:        1568×1176 ~250KB    │
│                                  │
│  All JPEG, quality 70-85%        │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  STEP 4: STORE ALL VARIANTS      │
│  Supabase Storage bucket:        │
│                                  │
│  reports/{report_id}/photos/     │
│    {photo_id}/                   │
│      original.jpg   (~400KB)     │
│      thumbnail.jpg  (~15KB)      │
│      preview.jpg    (~80KB)      │
│      ai.jpg         (~250KB)     │
└──────────────────────────────────┘
```

### 18.4 Cost Savings With Optimization

| Metric | Raw (no optimization) | With optimization | Savings |
|--------|-----------------------|-------------------|---------|
| **Storage per report** (20 photos) | ~160 MB | ~15 MB (all variants) | **90%** |
| **AI tokens per image** | 16,000 | 2,450 | **85%** |
| **AI cost per report** (Sonnet, 20 photos) | $0.96 | $0.15 | **84%** |
| **Gallery page load** | ~160 MB | ~1.6 MB (previews only) | **99%** |
| **Reports before 100GB limit** | ~625 | ~6,600 | **10x more** |

### 18.5 Which Variant Is Used Where

| Context | Variant used | Size | Why |
|---------|-------------|------|-----|
| Gallery filmstrip (thumbnails at bottom) | `thumbnail` | 200×150, ~15KB | Fast load, many visible at once |
| Gallery grid view (2-column) | `preview` | 800×600, ~80KB | Good enough for grid cards |
| Photo viewer (single large photo) | `full` | 1920×1440, ~400KB | Full detail for inspection |
| Annotation canvas (Fabric.js) | `full` | 1920×1440, ~400KB | Drawing needs good resolution |
| Claude AI analysis | `ai` | 1568×1176, ~250KB | Max size before Claude auto-resizes anyway |
| PDF report generation | `full` | 1920×1440, ~400KB | Print-quality for reports |
| next/image display (all views) | `preview` or `full` | varies | next/image further converts to WebP/AVIF on the fly |

### 18.6 Storage Choice: Supabase Storage

**Recommended for v1:** Supabase Storage (included in your Supabase Pro plan).

| Feature | Supabase Storage | Cloudflare R2 | AWS S3 |
|---------|-----------------|---------------|--------|
| **Cost** | Included in $25/mo Pro (100 GB) | $0.015/GB-month, 10 GB free | $0.023/GB-month |
| **Egress** | 250 GB free, then $0.09/GB | **Free (zero egress)** | $0.09/GB |
| **Built-in transforms** | Yes (Pro), $5/1K transforms | No | No |
| **Auth integration** | Native (RLS, signed URLs) | Manual | Manual |
| **Region** | Frankfurt (eu-central-1) | EU bucket available | eu-central-1 |
| **Complexity** | Zero — same dashboard as DB | Separate service | Separate service |

**Why Supabase wins for v1:**
- Already paying for it. No extra service, no extra credentials.
- Native signed URLs mean photos are private by default — only authenticated users see their reports.
- Same Frankfurt region as the DB. Fast uploads.
- 100 GB handles ~6,600 optimized reports. Enough for year 1+.

**When to migrate to Cloudflare R2:**
- When storage exceeds ~200 GB (or egress exceeds 250 GB/month)
- R2's zero egress fees save significant money at scale
- Migration: change upload/download URLs. Photos are just files — easy to move.

### 18.7 Built-in Image Transforms vs Pre-generated Variants

Supabase offers on-the-fly image transformations (Pro plan) via URL params:
```
https://project.supabase.co/storage/v1/object/public/photos/img.jpg?width=800&quality=80
```

**Pricing:** 100 free/month, then $5 per 1,000 transformations.

**Our approach: pre-generate variants with Sharp instead.** Why:
- 20 photos × 3 variants = 60 transforms per report
- At 100 reports/month = 6,000 transforms = $25/month in Supabase transform fees
- Sharp on the server: $0 (runs in your Next.js API route or Supabase Edge Function)
- Pre-generated variants are also **faster** — no on-demand processing on each view

**Use Supabase transforms only** for edge cases (e.g., user requests an unusual crop size).

### 18.8 Client-Side Compression Config

```
browser-image-compression options:
{
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  fileType: "image/jpeg",
  useWebWorker: true,
  initialQuality: 0.85,
  alwaysKeepResolution: false
}
```

**What this does:**
- A 12MB, 4000×3000 phone photo → ~400-600KB, 1920×1440 JPEG
- A 3MB, 3000×2000 photo → ~250-400KB, 1920×1280 JPEG
- A 500KB photo already under limits → passed through unchanged
- PNG screenshots → converted to JPEG (smaller for photos)
- Runs in a Web Worker — doesn't block the UI during upload

### 18.9 Server-Side Sharp Pipeline

Sharp operations for each uploaded photo (~200-500ms total):

```
Pipeline for each upload:
  1. Read the uploaded original from Supabase Storage
  2. Generate thumbnail:
     sharp(buffer).resize(200, 150, { fit: 'cover' }).jpeg({ quality: 70 })
  3. Generate preview:
     sharp(buffer).resize(800, null, { withoutEnlargement: true }).jpeg({ quality: 80 })
  4. Generate AI variant:
     sharp(buffer).resize(1568, null, { withoutEnlargement: true }).jpeg({ quality: 80 })
  5. Upload all variants back to Supabase Storage
  6. Save variant URLs in the Photo database record
```

**Where this runs:**
- **Option A (recommended):** Next.js API Route Handler — triggered after upload completes. Sharp is already the default image processor in Next.js.
- **Option B:** Supabase Edge Function — triggered by a database webhook when a new photo record is inserted. Keeps processing decoupled from the upload request.

### 18.10 Serving Images: next/image Integration

Use the Next.js `<Image>` component for all photo display. It adds:
- **Automatic WebP/AVIF conversion** (25-35% further size reduction)
- **Responsive `srcset`** generation (browser picks best size for viewport)
- **Lazy loading** by default (photos below the fold don't load until scrolled)
- **Edge caching** on Vercel's CDN (subsequent loads are instant)

Configure `next.config.js` to allow Supabase Storage as an image source:
```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/**',
    },
  ],
}
```

### 18.11 AI Analysis: Sending Optimized Images

When a user triggers "Analyze Photo" or "Auto-fill from Photo":

1. Fetch the `ai` variant URL (1568px max, ~250KB)
2. Send to Claude API as a base64 image or URL
3. Token cost: 1568×1176 / 750 = **~2,450 tokens per image**
4. At Sonnet pricing ($3/M input): **~$0.007 per image**
5. Cache the AI result keyed by `photo_id` — if the photo hasn't changed, serve cached analysis

**Model selection per task:**
| Task | Model | Tokens/image | Cost/image |
|------|-------|-------------|------------|
| License plate detection | Haiku 4.5 | ~2,450 | ~$0.002 |
| VIN detection | Haiku 4.5 | ~2,450 | ~$0.002 |
| Damage description | Sonnet 4.5 | ~2,450 | ~$0.007 |
| Document OCR (Zulassungsbescheinigung) | Sonnet 4.5 | ~2,450 | ~$0.007 |
| Full multi-photo analysis | Sonnet 4.5 | ~12,250 (5 images) | ~$0.037 |

### 18.12 Original Quality for Legal Purposes

The client-compressed 1920px JPEG at 85% quality is sufficient for German
insurance/legal reports. Insurance companies accept digital photos — they
do not require raw sensor output.

If a "keep original" option is ever needed:
- Add a toggle in upload settings
- Store the raw file as `original_raw.jpg` alongside the compressed version
- Only store raw for users who opt in (to control storage costs)
- Skip this for v1 — add later if requested by users.

### 18.13 Storage Bucket Structure

```
supabase-storage/
└── reports/                          (private bucket, RLS-protected)
    └── {report_id}/
        ├── photos/
        │   ├── {photo_id}/
        │   │   ├── original.jpg      (~400KB — client-compressed upload)
        │   │   ├── thumbnail.jpg     (~15KB)
        │   │   ├── preview.jpg       (~80KB)
        │   │   └── ai.jpg            (~250KB)
        │   └── {photo_id}/
        │       └── ...
        ├── annotations/
        │   └── {photo_id}.json       (Fabric.js canvas state)
        ├── signatures/
        │   └── {signature_id}.png    (~20-50KB, transparent background)
        └── exports/
            └── {export_id}.pdf       (generated report PDF)
```

All files accessed via **signed URLs** (time-limited, authenticated).
Supabase RLS ensures users can only access their own reports' files.

### 18.14 Upload UX Flow

1. User drops/selects photos (up to 20)
2. **Immediately:** each photo is compressed client-side (progress bar per photo)
3. **Upload:** compressed files upload to Supabase (progress bar per photo)
4. **Background:** server generates variants (user sees photos in gallery instantly with the original)
5. **When variants are ready:** swap `src` to use `preview` variant in gallery grid
6. **If upload fails:** retry automatically (3 attempts), show error with manual retry button

**Maximum 20 photos per report** (enforced client and server-side).
**Accepted formats:** JPEG, PNG (converted to JPEG on compression). Reject others.
**Max file size before compression:** 20MB (reject with error if larger).
**Max file size after compression:** ~1MB (browser-image-compression guarantees this).

---

*Sources:*
- *[Vercel Pricing](https://vercel.com/pricing)*
- *[Supabase Pricing](https://supabase.com/pricing)*
- *[Stripe Pricing](https://stripe.com/pricing)*
- *[Claude API Pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)*
- *[Resend Pricing](https://resend.com/pricing)*
- *[Sentry Pricing](https://sentry.io/pricing/)*
- *[Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)*
- *[PostHog Pricing](https://posthog.com/pricing)*
