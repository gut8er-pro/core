---
status: accepted
---

# Split the marketing site (Astro) from the dashboard app (Next) across two subdomains

## Context & decision

Today a single Next.js app serves the marketing landing page, the legal pages, the auth flows, and the authenticated dashboard from one origin. The public landing page is a `'use client'` React component, which is poor for SEO and performance — the two things the marketing surface exists to win at.

We are splitting into **two independent projects on two subdomains**:

- **`gut8erpro.de` (apex)** — a new, from-scratch **Astro** marketing site (landing + `/legal/*`). Fully static, German-default with English under `/en`, `hreflang` per language. Lives in its own git repo and its own Vercel project.
- **`app.gut8erpro.de`** — the existing **Next.js** app (all `(auth)`, `(app)`, and `/api/*` routes). Stays as-is structurally except the dashboard becomes the app root (`/`) and the default UI language flips to German.

`www.gut8erpro.de` 301-redirects to the apex.

## Considered options

- **Keep one app, improve SEO in place** — rejected: the marketing/dashboard concerns pull in opposite directions (static/cache-everything vs. auth-gated/dynamic), and a single Next app can't be as lean for marketing as a purpose-built static Astro site.
- **pnpm monorepo with shared packages** — rejected for now: the genuinely shared surface is tiny (design tokens, `cn()`, and 3 client components Astro can't reuse as-is anyway). A monorepo restructure is real risk/time for almost no shared code. Two independent repos instead; revisit if shared code grows.
- **Share auth sessions across subdomains** (cookie `domain = .gut8erpro.de`) — rejected: keeps the apex fully static and leaves the auth cookie security model untouched. All auth stays on `app.`; the marketing site is stateless and simply links to `app.`.

## Consequences

- **Auth is host-only on `app.`** The marketing site cannot know a visitor's login state; its nav is static ("Dashboard" → `app.`, "Start free trial" → signup). Unauthenticated visitors hitting `app.` are bounced to `/login` by existing middleware.
- **`NEXT_PUBLIC_APP_URL` → `https://app.gut8erpro.de`** drives OAuth callbacks, password-reset links, Stripe redirect URLs, and email links. A new **`NEXT_PUBLIC_MARKETING_URL`** is introduced for app→marketing links (account-delete redirect, `not-found`, in-app legal links). Astro gets **`PUBLIC_APP_URL`** for its CTAs.
- **The dashboard moves to `/`** (`(app)/dashboard/page.tsx` → `(app)/page.tsx`); ~6 hardcoded `/dashboard` redirects are updated. `/` and `/legal/*` are removed from the app and from the middleware public-routes list.
- **External dashboards need manual updates** (Google Cloud Console, Apple Developer, Stripe webhook). Supabase is updated via MCP; Vercel env/domains via MCP. DNS is managed by the owner at the registrar (not on Vercel).
- **No legacy redirects.** The app is launched-but-unofficial with no live users, so there is no SEO history to preserve — clean URLs from day one.
