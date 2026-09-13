# 02 — Build the Astro marketing site

Status: resolved
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

**2026-09-01 — implemented.** The owner approved the agent scaffolding the project, so the
gate was lifted rather than waited on. Built at the `gut8er/website` sibling directory as its
own git repo (2 commits).

Scaffold: Astro 7.2.9 + Tailwind v4 (`@tailwindcss/vite`) + `@astrojs/sitemap`, TS strict.
Two version pins were forced and are documented in the site's README: `astro` is pinned
exactly because this machine's pnpm enforces a `minimumReleaseAge` supply-chain policy that
rejects 7.2.10 (published within the cutoff) — 7.2.9 predates it, so the policy is satisfied
rather than bypassed; and `typescript` is pinned to `^6` because TS 7's native compiler no
longer exposes the programmatic API `astro check` needs. The scaffold also hit exactly the
pnpm 11 `allowBuilds` problem flagged in ticket 01 — `esbuild` would not build until a
`pnpm-workspace.yaml` was added.

Delivered against the acceptance criteria:
- **Zero client JS.** `find dist -name '*.js'` is empty. The FAQ is a native `<details>`
  disclosure and the language switcher is a plain `<a>`, so not even the "trivial script"
  the ticket allowed was needed.
- **German at `/`, English at `/en`**, with `hreflang` alternates on both plus `x-default`
  → German. Verified in the built HTML and in `sitemap-0.xml`.
- **SEO**: per-page `<title>`, meta description, canonical, Open Graph, `robots.txt`,
  sitemap index.
- **Visual parity** confirmed in a browser at both locales: hero + stat overlay, all four
  feature cards (DAT tile, revenue chart, floating AI stat cards, icon grid), FAQ, footer.
- **CTAs** resolve through `PUBLIC_APP_URL`; verified that a production-value build emits
  `https://app.gut8erpro.de/...`.

Two deliberate departures from the ticket, both recorded in the site's README:
1. **Legal pages are German-only.** The ticket's i18n line implies everything is bilingual,
   but these are German statutory texts (§ 5 TMG, DSGVO, AGB, Widerrufsbelehrung). Machine
   translation of a legal notice is worse than none, so they are marked `monolingual` —
   one canonical URL each, no `hreflang` — and both language footers link to them.
2. **Inter is self-hosted via Fontsource, not Google Fonts.** The ticket allowed either.
   Google's CDN transmits visitor IPs to a third party, which German courts have held to
   breach the DSGVO and which contradicts the Datenschutzerklärung this very site serves.

Impressum placeholders carried over faithfully, as instructed.
