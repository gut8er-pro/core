# 07 — Vercel projects, env vars, domain assignment + DNS records

Status: ready-for-agent
Type: task
Blocked by: 02

## Goal
Two Vercel projects mapped to the two subdomains, with the right env vars, and a clear DNS record list for the owner (owner manages DNS at the registrar — not on Vercel).

## Changes (Vercel — agent does via MCP)
- Inventory existing projects. Reuse the existing `core` project for `app.gut8erpro.de` if present, else create it. Create a new `website` project for the Astro site (apex + `www`).
- **Env — core project:** `NEXT_PUBLIC_APP_URL=https://app.gut8erpro.de`; add `NEXT_PUBLIC_MARKETING_URL=https://gut8erpro.de`. (Stripe checkout/portal return URLs follow `APP_URL` automatically — see `src/lib/stripe/subscription.ts`, `src/app/api/stripe/checkout/route.ts`.)
- **Env — website project:** `PUBLIC_APP_URL=https://app.gut8erpro.de`.
- Assign domains in Vercel: `app.gut8erpro.de` → core; `gut8erpro.de` + `www.gut8erpro.de` → website; configure `www`→apex 301.

## Deliverable to owner
The exact DNS records to set at the registrar (apex A/ALIAS + `www` CNAME → website; `app` CNAME → core), per whatever Vercel returns for each project's domain verification.

## Acceptance criteria
- Both projects build and serve on their subdomains.
- Env vars present in the correct project/environment (production + preview as needed).
- Owner has a copy-pasteable DNS record list.

## Comments

**2026-09-01 — status.** **Blocked by 02** (no website project to deploy) and awaiting the owner's explicit go-ahead for outward-facing Vercel changes.

One env var is already needed by merged code regardless of when the rest happens: `NEXT_PUBLIC_MARKETING_URL` must be set on the app's Vercel project. Until it is, `marketingUrl()` falls back to `https://gut8erpro.de` — correct for production by luck, but it should be explicit.

**2026-09-01 — unblocked.** Ticket 02 is resolved: the marketing site exists at
`gut8er/website`, builds clean, and is ready for a Vercel project. This ticket now waits only
on the owner's go-ahead for the outward-facing Vercel/DNS changes. Note the website project
also needs `PUBLIC_APP_URL=https://app.gut8erpro.de`.
