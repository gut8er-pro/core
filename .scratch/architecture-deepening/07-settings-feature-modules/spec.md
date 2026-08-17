# Split settings into feature modules with injected data seams

**Status:** needs-triage
**Next step:** `/grilling` on this file — but note this is the lowest-priority candidate.
**Strength:** Speculative · **Dependency category:** mock / ports (data + upload seams)

## Problem

The settings page is a single 1173-line `'use client'` module bundling **five unrelated feature modules**. Each fetches its own data and news up its own dependencies (Supabase, `fetch`, `window`, react-query hooks) directly in the view, so no tab renders or tests in isolation. One tab is a pure mock masquerading as a feature.

Why speculative: the router-level `SettingsPage` orchestrator (`:1139-1173`) is already **deep** (URL param in → one section out). The deepening here is mostly **locality + testability**, not new leverage — so it ranks below 1–5.

## Evidence (file:line) — `src/app/(app)/settings/[[...tab]]/page.tsx`

8 components co-located in one file:

- `SettingsSidebar:47` · `ProfileSection:86` · `PrivacySection:246` · `BusinessSection:323` · `IntegrationsSection:536` · `BillingSection:724` · `TemplatesSection:978` · `SettingsPage:1139` (orchestrator).

Dependencies newed up inside the view:

- `BusinessSection` does a **dynamic `import('@/lib/supabase/client')` inside the component** (`:371`) and calls `supabase.storage.from('photos').upload(...)` inline (`:376-382`) — an un-mockable data-access seam inside UI.
- `PrivacySection` news up browser globals inline: raw `fetch('/api/account/export')` (`:254`), `fetch('/api/account/delete', {method:'DELETE'})` (`:280`), `window.confirm` (`:274`), `document.createElement('a')` + click (`:261-267`), `window.location.href='/'` (`:287`). Also **bypasses `next-intl`** — hardcoded English strings (`:295-316`) while every other section uses `useTranslations('settings')`.
- `TemplatesSection` is backed by `MOCK_TEMPLATES` (`:971`) with **local-only state** — `handleSave:994`, `handleAdd:1008`, `handleRemove:1004` mutate a `useState` array; no backend.
- Every section calls `useUserSettings`/`useSaveSettings`/`useBilling`/`useCreateCheckout`/`useCreatePortal` directly — none injected.
- `formatDate:718` is a **third** copy of the helper already duplicated in the PDF template (see [06](../06-pdf-view-model-seam/spec.md)).

## Why it's shallow / deletion test

`SettingsPage` orchestrator = deep (keep). The five sections are individually un-testable slabs sharing one file and one `'use client'` boundary. `TemplatesSection` fails the deletion test outright: 158 lines of UI with zero backing behavior — delete its save/add/remove wiring and nothing real is lost.

## Deepening target (to be finalized in grilling)

Extract each tab into its own module that **accepts its data** (and an upload **port** for Business), so it renders and tests in isolation. Decide `TemplatesSection`: wire a real backend or delete the stub. Fold `PrivacySection`'s raw `window`/`fetch` behind an injected client and route its strings through `next-intl`.

Open grilling questions:
- One file per tab under `src/components/settings/`, or keep co-located but inject data via props?
- Define the upload **port** interface for Business (so Supabase is one adapter behind it).
- Templates: build the backend or delete? (If deleting, confirm it's not on a near-term roadmap.)
- Collapse the third `formatDate` into [06](../06-pdf-view-model-seam/spec.md)'s formatting module.

## Wins

- Locality: one feature per module.
- Injected data/upload seam → each tab testable.
- Supabase upload behind a port (one adapter).
- The mock stub stops masquerading as a feature.

## Related

Shares the triplicate `formatDate` with [06-pdf-view-model-seam](../06-pdf-view-model-seam/spec.md).
