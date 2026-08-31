# 02 — Build the Astro marketing site

Status: ready-for-agent
Type: task

## Gate
Requires the owner to have scaffolded the Astro project at the `gut8er/website` sibling directory (own git repo) and reported the chosen Astro version + integrations (Tailwind, `@astrojs/sitemap`). Build on that scaffold — do not scaffold from scratch.

## Goal
A fully static, SEO-strong marketing site on the apex domain, rebuilt from the current Next landing + legal pages, reusing only the visual design and canonical tokens.

## Changes (website repo)
- **Landing** — re-author `core/src/app/page.tsx` as pure `.astro`: header/nav, hero + hero image + stat overlay, 4 feature cards, FAQ (native `<details>` or ~10 lines vanilla JS), footer. Ship ~zero JS.
- **Legal** — port `core/src/app/legal/*` (impressum, datenschutz, agb, widerruf + shared shell) as static pages.
- **Tokens** — copy the `@theme` block from `core/src/app/globals.css` (canonical; `--color-primary: #019447`). Do NOT use the stale greens in `design-tokens.ts` / `DESIGN_TOKENS.md`. Load Inter (Fontsource or Google).
- **Assets** — copy the marketing subset: `logo.svg`, `landing-hero.jpg`, favicon.
- **i18n** — German default at root (`/`), English under `/en`, with `hreflang`. Port `landing.*` + `nav.*` strings from `core/src/messages/{de,en}.json`.
- **SEO** — sitemap (`@astrojs/sitemap`), `robots.txt`, per-page `<title>`/meta description/canonical.
- **CTAs** — read `PUBLIC_APP_URL`; link "Start free trial" → `${PUBLIC_APP_URL}/signup/account`, "Dashboard"/"Log in" → `${PUBLIC_APP_URL}`. Legal footer links stay internal to the marketing site.

## Acceptance criteria
- Static build; Lighthouse SEO + performance strong; no client JS beyond the trivial FAQ/lang bits.
- German at `/`, English at `/en`, correct `hreflang` + canonical.
- Visual parity with the current landing using canonical tokens.
- All CTAs resolve to the app subdomain via env var.

## Notes
Carry the Impressum's placeholder company data faithfully; real data is the owner's responsibility (out of scope).

## Comments

**2026-09-01 — status.** **Not started — the gate is unmet.** `gut8er/website` does not exist; the sibling directory alongside `core/` is empty. Per the ticket, the owner scaffolds the Astro project and reports the version + integrations, then this ticket can run.

Prep done so the port is a straight read-across once unblocked: the deleted sources are snapshotted at `.scratch/marketing-app-split/source-snapshot/` — `landing-page.tsx`, the four `legal/` pages with their shared layout, and `globals.css` (the canonical `@theme` block). They are also in git history at `5024886`.
