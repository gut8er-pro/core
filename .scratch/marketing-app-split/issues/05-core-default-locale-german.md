# 05 — Core: flip default UI locale to German

Status: resolved
Type: task

## Goal
The dashboard defaults to German for the DE market; English stays available via the switcher.

## Changes (core repo)
- `src/i18n/config.ts`: `defaultLocale: 'en'` → `'de'`.
- Verify the middleware locale-cookie fallback (`src/lib/supabase/middleware.ts:70-82`) still sets a sensible `NEXT_LOCALE` and that `Accept-Language` handling remains.
- Update `CLAUDE.md` — replace the "UI is in English" note to reflect German-default UI with English available. (Optional incidental: correct the stale "Next 14" reference to Next 16 / React 19.)

## Acceptance criteria
- A fresh visitor with no locale cookie gets German UI.
- The language switcher still toggles to English and persists.
- `de.json`/`en.json` parity already verified — no missing-key regressions.

## Comments

**2026-09-01 — implemented.** `defaultLocale` flipped to `'de'`. Updated `CLAUDE.md`: the "UI is in English" line, the app-structure section (now scoped to the app only, pointing at the ADR and at `marketingUrl()`), and the stale "Next.js 14" → Next 16 / React 19.

One nuance worth stating plainly: `defaultLocale` is the fallback *after* `Accept-Language` detection, in both `i18n/request.ts` and the middleware cookie-seeding branch. A fresh visitor whose browser advertises English still gets English, not German. That matches the spec's decision to keep `Accept-Language` handling; it does mean the ticket's acceptance line ("a fresh visitor with no locale cookie gets German UI") holds only for visitors whose `Accept-Language` matches neither locale. Flag if you wanted German unconditionally — that's a one-line change to remove the detection.
