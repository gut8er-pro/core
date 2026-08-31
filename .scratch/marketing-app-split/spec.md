# Spec: Split marketing site (Astro) from dashboard app (Next)

Status: ready-for-agent

> Feature slug: `marketing-app-split`. Decision rationale: `docs/adr/0001-split-marketing-site-from-dashboard-app.md`.
> Detailed, file-level cutover notes were captured during grilling and now live in this spec at the decision level (file paths intentionally omitted per template — they belong in implementation issues).

## Problem Statement

Gut8erPRO's marketing landing page, legal pages, authentication flows, and the authenticated dashboard are all served by one Next.js app from a single origin. The public landing page is a client-rendered React component, which is weak exactly where a marketing surface must be strong: SEO (search discoverability, indexable per-language URLs, meta/canonical/`hreflang`) and first-load performance. Meanwhile the dashboard has the opposite needs — it is auth-gated and dynamic. Serving both from one app forces a compromise that shortchanges the marketing goal, and public marketing traffic is coupled to the heavy authenticated app's build and runtime.

## Solution

Split into two independent projects on two subdomains:

- **`gut8erpro.de` (apex)** — a new, from-scratch **Astro** marketing site (the landing page and the four legal pages). Fully static, cache-everywhere, German-default with English under `/en`, with sitemap, robots, per-page meta, and `hreflang`. Its own git repo and Vercel project.
- **`app.gut8erpro.de`** — the existing **Next.js** app (all authentication, dashboard, and API routes), unchanged in shape except: the dashboard becomes the app root (`/`), and the default UI language becomes German.
- **`www.gut8erpro.de`** — 301-redirects to the apex.

Authentication stays entirely on `app.` (host-only cookies, no cross-subdomain session). The marketing site is stateless and links to the app. Cross-app links are environment-driven in both directions.

## User Stories

1. As a prospective customer, I want the Gut8erPRO homepage to load near-instantly, so that I don't bounce before seeing the value proposition.
2. As a prospective customer searching Google in German, I want to find the marketing pages ranked and correctly described, so that I discover the product.
3. As a search engine, I want a static, server-rendered marketing site with proper `<title>`, meta description, and canonical tags, so that I can index it reliably.
4. As a search engine, I want distinct indexable URLs per language with `hreflang` annotations, so that I serve the right language version to each user.
5. As a German-speaking visitor, I want the marketing site to default to German at the apex root, so that the content matches my market and expectations.
6. As an English-speaking visitor, I want an English version of the marketing site under `/en`, so that I can read it in English.
7. As a visitor, I want to read the legal pages (Impressum, Datenschutz, AGB, Widerruf) on the marketing domain, so that I can review terms before signing up.
8. As a prospective customer, I want a clear "Start free trial" call-to-action on the marketing site, so that I can begin signup on the app.
9. As a prospective customer, I want a "Dashboard" / "Log in" entry point on the marketing site, so that I can reach the app; if I'm not signed in, the app itself sends me to login.
10. As a returning assessor (Sachverständiger), I want the dashboard to live at `app.gut8erpro.de/` with no `/dashboard` suffix, so that the app has a clean root URL.
11. As an assessor, I want to log in, sign up, reset my password, and use Google/Apple OAuth on `app.gut8erpro.de`, so that authentication works entirely within the app subdomain.
12. As an assessor completing signup, I want Stripe Checkout and the billing portal to return me to the correct app URLs, so that the trial/subscription flow completes without broken redirects.
13. As an assessor, I want OAuth (Google/Apple) sign-in to redirect back to the app's callback correctly, so that social login succeeds.
14. As an assessor, I want password-reset and confirmation emails to link to the app subdomain, so that the links work after the split.
15. As an assessor, I want the dashboard UI to default to German, so that it matches my market; and I want to switch to English if I prefer.
16. As an assessor who deletes my account, I want to be sent to the marketing homepage afterward, so that I land somewhere sensible rather than an auth-gated page.
17. As an assessor hitting an unknown app URL, I want the not-found page's "home" link to take me to the right place (marketing or app as appropriate), so that I'm not dead-ended.
18. As an assessor, I want in-app references to legal pages to open the legal pages on the marketing domain, so that links resolve after the split.
19. As the product owner, I want the two projects in separate git repositories, so that the marketing site has its own deploy cadence and history independent of the app.
20. As the product owner, I want two separate Vercel projects mapped to the two subdomains, so that each deploys and scales independently.
21. As the product owner, I want to manage DNS at my registrar with a clear list of records to set, so that I keep control of DNS while the apps point to the right places.
22. As the product owner, I want the agent to update Vercel environment variables and the Supabase configuration directly (via MCP), so that I don't do that work manually.
23. As the product owner, I want a step-by-step wizard for the changes only I can make in external dashboards (Google Cloud Console, Apple Developer, Stripe webhook), so that I can complete them confidently.
24. As the product owner, I want the marketing site to reuse the existing brand design and tokens, so that it stays visually consistent with the app.
25. As a developer, I want cross-app links driven by environment variables (never hardcoded), so that domains can change without code edits.
26. As a developer, I want the existing Playwright e2e suite updated for the renamed routes and still green, so that I can trust the app after the migration.
27. As the product owner, I want a big-bang cutover with a trivial rollback (reassign domain + revert), so that the migration is low-ceremony given there are no live users.
28. As a developer, I want the repo standardized on a single package manager (pnpm), so that the mixed-lockfile ambiguity is removed.

## Implementation Decisions

- **Two independent projects, two subdomains.** New Astro marketing site on the apex (own git repo, own Vercel project); existing Next app on `app.`. No monorepo — the shared surface (design tokens, a class-name helper, three client components Astro cannot reuse as-is) is too small to justify one.
- **Content boundary.** Marketing site owns the landing page and the four legal pages. The Next app keeps all authentication routes, all dashboard routes, and all API routes. The public `/help` page stays inside the app for phase 1 (it currently renders inside the authenticated app shell).
- **Dashboard becomes the app root.** The dashboard page moves to the app group's index so its URL is `app.gut8erpro.de/`. The former landing route at `/` is removed from the app, and `/` plus the legal paths are removed from the middleware public-routes allow-list. All hardcoded post-auth redirects that targeted the dashboard are updated to the new root.
- **Auth topology.** Authentication stays entirely on `app.` with host-only cookies — no cross-subdomain cookie sharing. The marketing site does not detect login state; its nav is static and links to the app, where existing middleware redirects unauthenticated visitors to login.
- **Cross-app linking.** Environment-driven both ways: the Next app gains a "marketing URL" variable (for the account-delete redirect, the not-found home link, in-app legal links, and notification email links); the app-URL variable is set to the app subdomain (it drives OAuth callbacks, password-reset links, and Stripe redirect URLs). The Astro site gets an "app URL" variable for its CTAs.
- **Marketing rebuild approach.** Pure Astro, authored from scratch, shipping ~zero JavaScript; the only interactive bits (FAQ disclosure, language links) use native HTML or a trivial script. Reuse only the visual design and the canonical design tokens (from the app's live theme). Stale token values elsewhere in the repo are not propagated.
- **Marketing i18n.** Bilingual, German default at the apex root, English under `/en`, with `hreflang`. Language preference does not carry across the domain boundary in phase 1; the app already falls back to `Accept-Language`.
- **Dashboard i18n.** The app's default UI locale flips from English to German; English remains available via the in-app switcher. German translations already have full parity, so there is no translation-completeness risk. The project brain note stating "UI is in English" is updated accordingly.
- **External configuration ownership.** The agent performs code changes, Vercel environment/domain changes (via MCP), and Supabase changes (Site URL and redirect-URL allow-list, via MCP). A wizard is generated for the changes only the owner can make: Google Cloud Console OAuth redirect, Apple Developer return URL, and the Stripe webhook endpoint. Stripe checkout/portal return URLs follow the app-URL variable automatically and need no dashboard change.
- **Deployment & DNS.** Two Vercel projects (reuse the existing app project for `app.` if one exists, otherwise create it; create a new project for the Astro site on apex + `www`). The owner manages DNS at the registrar; the agent supplies the exact records, including the `www`→apex 301.
- **No legacy redirects.** The app is launched-but-unofficial with no live users, so there is no SEO history to preserve; clean URLs from day one.
- **Package manager.** Standardize on pnpm; remove the npm lockfile. The untracked workspace file is a pnpm build-approval artifact, not monorepo scaffolding.
- **Cutover.** Big-bang: build both, migrate the app, flip everything in one coordinated pass, verify, done. Rollback is reassign-domain plus git revert.

## Testing Decisions

- **What makes a good test here:** assert externally-observable behavior over HTTP — that a visitor/assessor can reach the right page and complete a flow — not internal implementation details (route file locations, middleware internals, cookie mechanics).
- **Single seam, already existing:** the Playwright end-to-end suite that drives the running Next app over HTTP at a configured `baseURL`. This is the highest available seam and the migration's behavioral changes (dashboard at root, auth entirely on the app, redirects) are all observable through it. No new seams are introduced.
- **Modules tested:** the Next app's auth flows (login, signup wizard through Stripe, password reset, OAuth entry), and the report/dashboard flows — the same surfaces the existing 16 specs already cover. Update these specs for the renamed routes; keep the local `baseURL` for CI.
- **Prior art:** the existing e2e specs under the testing directory (the per-report-type flow specs and the "all reports" send flow) are the pattern to follow for any adjustments.
- **Marketing site:** no automated tests in phase 1 (static content). An optional link/smoke check may be added later.

## Out of Scope

- A pnpm monorepo or any shared-code package extraction between the two projects.
- Cross-subdomain auth session sharing (shared cookies on `.gut8erpro.de`) and login-state awareness on the marketing site.
- Migrating `/help` out of the app shell.
- Legacy 301 redirects from old apex app-URLs (no indexed history to preserve).
- Filling in real Impressum/company data (a legal prerequisite for official launch, owned by the product owner).
- Reconciling the stale design-token drift in the repo's non-canonical token sources (a separate cleanup).
- Automated tests for the marketing site.
- DNS record changes themselves (owner-managed; the agent only supplies the values).

## Further Notes

- Execution is gated on two things: the owner's go-ahead, and the owner scaffolding the Astro project at the `gut8er/website` sibling directory (the owner will run the Astro CLI and report the chosen stack/integrations so the build sits on their scaffold).
- The Impressum currently contains placeholder company data (flagged in the file); the port carries it faithfully but real data is required before official DE launch.
- Real-domain fact: production references use `gut8erpro.de` and `noreply@gut8erpro.de`; the stack is Next 16 / React 19 (the project brain's "Next 14" note is stale and may be corrected as incidental cleanup).
