# 22 — Data loss on tab switch: calculation, invoice and tire values vanish or never save

Status: ready-for-agent
Type: bug
Severity: high

REWRITTEN after reading the meeting-notes PDFs — this is not a display lag, it is data loss.
Three first-hand reports of the same class:

- KG: "I filled out every field, the bar showed 1/3, I switched to Invoice and came back —
  Vehicle Value data, Repair data and Loss of Use data WERE MISSING."
- HS: "loss of use changes didn't get saved."
- KG Invoice: "filled out fields — changes not saved." Tires: "data not saved when changed."

## Direction

The pattern (fill → navigate away quickly → come back → gone) points at the debounced autosave
racing navigation, and/or the page's initialise-from-API `reset()` overwriting form state with
a stale fetch:

- `useAutoSave` flushes on unmount — verify the flush actually AWAITS and that a navigation
  right after typing cannot cancel the in-flight PATCH (`keepalive`/`fetch` on unmount,
  the queued-while-saving path, and the 800ms window).
- On re-entry the page `reset(fromApi(data))` runs against React Query's CACHED response — if
  the cache predates the last save (invalidate not awaited, or flush landed after refetch),
  the stale reset wipes what was saved. Check the invalidate/refetch ordering in `useAutoSave`
  onSuccess vs the pages' `initializedRef` pattern.
- Reproduce deterministically with throttled network: type → switch tab within 800ms → return.
  Fix must make that sequence lossless across calculation, invoice and tires (all three share
  the same hooks/pattern, so the fix is likely central in `use-auto-save.ts` + the init
  effect convention).
- Add a regression E2E: fill loss-of-use → immediately click Invoice tab → back → values
  present; same for a tire field and an invoice field.

The one-word UX part of the original ticket (computed values feeling laggy) rides along:
derived displays should compute from `useWatch`, not wait for the server round-trip.
