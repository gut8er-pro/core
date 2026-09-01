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

**2026-09-01 — Vercel inventory (via MCP).** Team `Gut8er Pro` (`team_3s7QvFLr84UC3SgMbwLurzsI`),
Pro plan. **One** project exists: `gut8er-pro` (`prj_FRJ4NeY3xI8wQ31xk9xUKrJLVgE3`), framework
`nextjs`, linked to GitHub `gut8er-pro/core`, latest production deployment READY.

Two corrections to this ticket's assumptions:

1. **`app.gut8erpro.de` is already set up.** DNS already CNAMEs it to `vercel-dns-017.com` and it
   serves the app today (200 on `/`, `/login` renders). The ticket's "reuse the existing project
   for `app.` if present, else create it" is already satisfied — nothing to do for the app host
   beyond env vars. (`get_project` lists only the `.vercel.app` domains; the custom domain is
   attached regardless, as the live 200 proves.)
2. **The apex is a parking page, not the app.** `gut8erpro.de` and `www` resolve to
   `89.31.143.90` (united-domains) and have no valid TLS cert. This invalidates the original
   deploy blocker — see `RELEASE_CHECKLIST.md` §0, since rewritten.

**The Vercel MCP cannot complete this ticket.** It exposes projects, deployments, logs, analytics
and deployment protection — but **no tool for environment variables and no tool for custom
domains**. Those two are the substance of this ticket. They need either the Vercel CLI
(`npm i -g vercel`, then `vercel login` — not installed here) or the dashboard.

Mitigation shipped instead: both apps' cross-origin URL fallbacks are now environment-aware, so
a production deploy with the variables unset still emits correct absolute URLs rather than
`localhost`. The env vars remain the right fix; they are no longer load-bearing for correctness.

Registrar is united-domains (`ns.udag.net/.org/.de`), so DNS stays owner-managed as planned.

**2026-09-01 — blocked on a GitHub permission.** The owner approved creating
`gut8er-pro/website` as a private repo so the Vercel project can be git-linked. `gh repo create`
failed:

```
GraphQL: petar-cerovic-hyvia does not have the correct permissions to execute `CreateRepository`
```

The authenticated token carries `repo`, `read:org`, `gist`, `admin:public_key` — no
repo-creation right in the `gut8er-pro` org. The owner must either grant it, or create the empty
repo themselves (one command, below).

Deliberately **not** worked around with `deploy_to_vercel`: that creates a *bare* Vercel project,
and per the tool's own contract `create_git_project` "does not reconnect an existing unlinked
project with the same name". Taking the shortcut would permanently cost the auto-deploy-on-push
setup this ticket asks for.

Env vars were dropped from this ticket's scope by the owner ("skip env vars, domains only"),
which is safe because both fallbacks are now environment-aware — a production build with the
variables unset still emits correct absolute URLs. They remain worth setting as hygiene.

Domain + DNS work is delivered as stages 1–3 of `.scratch/marketing-app-split/cutover-wizard.sh`.
The registrar is united-domains; the apex and `www` currently A-record to `89.31.143.90`
(parking) and those records must be removed, while `app.gut8erpro.de` must be left untouched —
it already points at Vercel and serves the live app.
