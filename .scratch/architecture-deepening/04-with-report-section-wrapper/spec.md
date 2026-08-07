# `withReportSection` route wrapper + retire the dead hook layer

**Status:** needs-triage
**Next step:** `/grilling` on this file to design the wrapper interface.
**Strength:** Strong · **Dependency category:** in-process

## Problem

The **auth → load-report → ownership → lock → validate → touch** envelope is copy-pasted into 12 section handlers and has already drifted (different `user.id` spelling, lock status code 403 vs 423, one route missing the lock check entirely). Meanwhile there are **two competing PATCH client paths** per section: `useAutoSave.patchSection` (live) and `patchXSection` feeding ~15 `useSaveX` mutations that **nothing calls**.

## Evidence (file:line)

Identical route skeleton (only the schema id changes):

- PATCH guard verbatim in all 6: `vehicle/route.ts:41-56`, `calculation/route.ts:72-87`, `condition/route.ts:76-91`, `accident-info/route.ts:44-60` (+ invoice, export).
- Validate block verbatim: `accident-info:62-72`, `vehicle:58-68`, `condition:93-103`, `calculation:89-99`, `invoice:69-79`, `export:87-97`.
- Touch-updatedAt closer verbatim: `accident-info:229-232`, `vehicle:150-153`, `condition:330-333`, `calculation:169-172`, `invoice:177-180`, `export:120-126`.
- Only `getAuthenticatedUser`/`unauthorizedResponse` are shared (`src/lib/api/auth.ts`, used by 28 route files). The **load-report + ownership + 404** trio is copy-pasted 2× per section route (GET + PATCH), not extracted.
- Roughly **25% of each route is identical wrapper** (e.g. vehicle 158 L → ~40 L boilerplate); larger share in the shorter routes.

Drift the copy-paste has already produced:

- `user?.id` (accident-info/vehicle/condition/calculation) vs `user.id` (invoice/export/send/signatures) after differing guards (`if (error)` vs `if (error || !user)`).
- Lock status: section routes return **403**; `signatures/[signatureId]/route.ts:21` returns **423** for the same condition.
- `export/route.ts:73-85` PATCH has **no lock check at all** (it's the route that *sets* `isLocked`).

Two PATCH paths + dead hooks:

- Live path: `use-auto-save.ts:49-67` defines its own `patchSection()` that fetches `/api/reports/${reportId}/${section}` directly.
- Dead path: `patchXSection` in `use-accident-info.ts:91`, `use-condition.ts:18`, `use-calculation.ts:41`, `use-invoice.ts:40`, etc., feeding `useSaveX` mutations. Grep for consumers **outside `src/hooks/`** returns **0** for: `useSaveAccidentInfo/ClaimantInfo/OpponentInfo/Visit/ExpertOpinion/VehicleInfo/ExportConfig/Calculation/AdditionalCost/DeleteAdditionalCost/Invoice/LineItem/DeleteLineItem`. Only the condition per-item hooks + `useSaveSignature/DeleteSignature` have a live consumer (one file each).

## Why it's shallow / deletion test

If a `withReportSection(req, { schema, handler })` wrapper existed, each PATCH would shed its first ~15 and last ~4 lines; what remains (field mapping + upsert) is genuinely distinct and would NOT collapse. So the **envelope** is shallow duplication; the bodies are not. The ~15 `useSaveX` mutations are shallow **and** unused — the clearest deletion-test signal.

## Deepening target (to be finalized in grilling)

1. A `withReportSection({ schema }, handler)` wrapper that owns auth + load-report + ownership 404 + lock + validate + touch, and hands the handler `{ report, data, db }`. One deletion semantics, one lock status code.
2. Retire the dead hook layer onto the single `useAutoSave` PATCH path (delete ~15 unused mutations + their `patchXSection` fetchers). Keep only the live per-item hooks (condition markers, signatures) — or fold those into the auto-save path too (decide during grilling).

Open grilling questions:
- Wrapper as a higher-order handler `(handler) => NextRoute`, or a helper called at the top of each handler? (HOF gives the strongest seam.)
- Standardize the lock status code — 403 or 423? And make export's "set lock" an explicit exception in the wrapper (allow-lock-write flag).
- GET path: does the wrapper also cover GET (load + ownership) or just PATCH?
- Where does route-test coverage land — the wrapper becomes the one place to test the envelope (currently **zero** API route tests exist).

## Wins

- Lock/ownership rule fixed once, everywhere; export's missing check can't recur.
- Delete ~15 shallow, unused mutations (+ their fetchers).
- One PATCH path, not two.
- The wrapper is the natural home for the first API route tests.

## Related

Pairs with [05-child-collection-persistence](../05-child-collection-persistence/spec.md) — same subsystem; the wrapper handles the scalar envelope, 05 handles the array bodies. Do 05 first (higher correctness risk).
