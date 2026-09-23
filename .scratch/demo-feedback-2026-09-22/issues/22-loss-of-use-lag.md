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

## Resolution

Status: fixed

### Root cause

Two writes and one read race on every fast tab switch, and the read wins.

1. `useAutoSave`'s unmount cleanup fired the final PATCH **fire-and-forget**
   (`patchSection(...).catch(() => {})`) — nothing held a handle on it, nothing
   waited for it, and nothing refreshed the cache when it landed.
2. Every section query uses `refetchOnMount: 'always'` (`use-calculation.ts`,
   `use-invoice.ts`, `use-condition.ts`, `use-vehicle-info.ts`,
   `use-accident-info.ts`). Remounting the tab fires the GET in the *same tick*
   as that unmount PATCH. The two are concurrent, so when the GET reaches the
   database first it answers with **pre-PATCH rows**.
3. The page's `initializedRef` effect then runs `reset(fromApi(data))` on that
   stale answer and rebuilds the form from it. The typing is now gone from the
   form — and, because the form is the source of truth for the replace-all array
   saves (visits / lineItems / tireSets), the next blur writes the stale values
   back over the good ones in the database. That is the "filled it in, came
   back, it was empty" the client hit on the call.
4. The success path's `invalidateQueries({ refetchType: 'none' })` is correct
   while mounted (a refetch there would reset a form mid-edit) but it means the
   cache keeps serving the last GET, so nothing self-heals.

### Fix

New `src/lib/api/section-saves.ts` — a tiny per-`reportId:section` registry of
in-flight saves, with `trackSectionSave` (register) and `awaitSectionSave`
(wait). Concurrent saves on one section chain, so a reader waits for all of them.

- `use-auto-save.ts` registers **every** PATCH (debounced and unmount) through
  `trackSectionSave`. The unmount flush is no longer fire-and-forget: it is
  tracked, and on completion it invalidates **with** a refetch, so a cache that
  a remount would trust is corrected.
- Each section fetcher (`fetchCalculation`, `fetchInvoice`, `fetchCondition`,
  `fetchVehicleInfo`, `fetchAccidentInfo`) now `await awaitSectionSave(...)`
  before issuing its GET. A read can no longer overtake a write issued before it.
- **Every direct mutation registers too.** The first cut of this guard was
  one-sided — readers waited, but only `useAutoSave` registered writes, so the
  section hooks' own PATCH helpers (which back *all* the non-autosave mutations:
  tire sets, damage markers, paint markers, line items, visits, signatures,
  additional costs) still raced the GET. Each helper is now split into a
  `…Request` function doing the fetch and a thin wrapper that registers it:

      patchConditionSection      → trackSectionSave(reportId, 'condition', …)
      patchInvoiceSection        → trackSectionSave(reportId, 'invoice', …)
      patchVehicleInfo           → trackSectionSave(reportId, 'vehicle', …)
      patchAccidentInfoSection   → trackSectionSave(reportId, 'accident-info', …)
      patchCalculationSection    → trackSectionSave(reportId, 'calculation', …)

  plus the signature `DELETE` in `use-accident-info.ts` (`deleteSignatureRequest`)
  and the calculation page's hand-rolled DAT PATCH, which now goes through
  `useSaveCalculation` instead of its own `fetch`. Credit to the condition agent
  for catching the asymmetry.
- The 800ms debounce, `flushNow`, the `disabled` contract and the queue-while-
  in-flight behaviour are unchanged; the mounted success path still uses
  `refetchType: 'none'` so a live form is never reset under the assessor.

Derived displays compute from `useWatch`, never a server round-trip: the
missing-field highlighting already did via `MissingFieldsProvider`, and the
Correction Calculation result cards now do too (see ticket 23) — they format the
watched form values as `de-DE` EUR instead of waiting for the save to land.

### Verification

- `src/lib/api/section-saves.test.ts` — 7 tests (blocking, rejection, per-key
  isolation, chained saves, cleanup).
- `src/hooks/use-auto-save.test.ts` — 12 tests, the new ones covering: read
  waits for the unmount flush; the unmount flush refetches the cache; the
  mounted path does not; debounce / `flushNow` / `disabled` / queue / `locked`
  all still hold.
- `src/hooks/section-mutations.test.ts` — 5 tests, one per section, asserting a
  read blocks until that section's **direct** mutation resolves and the entry is
  cleared afterwards. This is the regression guard for the one-sided-guard bug.
- New E2E `testing/e2e/21-tab-switch-data-loss.spec.ts` fills and switches tabs
  **with no settle wait** (inside the debounce window).

Gate runs on a healthy server:

- `07-condition 08-calculation 21-tab-switch` → **22 passed, 3 failed**.
  Wrapping the direct mutations took 07-condition from **6 failures to 1**
  (tire sets / damage markers / paint markers now persist); the survivor,
  `align axes copies the active tire to its axle partner`, is the condition
  agent's axle-copy logic, not the save path.
- Later re-run of `08-calculation 21-tab-switch` → **11 passed, 1 failed**.
  **08-calculation fully green.** 21-tab-switch now passes 4 of 5, including the
  invoice `payoutDelay` case once the invoice page gained its change
  subscription. The only survivor is the tire case (see below).

### Known gap, not this fix

The invoice and condition tabs have a *second*, independent loss mechanism that
this barrier does not cover. Both failures reproduce on a healthy server across
two independent runs, so they are real, not flakes.

**Invoice — now resolved.** This failed for a second, independent reason:
`invoice/page.tsx` saved **on blur only**, with no `watch()` change
subscription like `calculation/page.tsx` has. Diagnosed here (the same field
with a settle wait persisted fine — DB held `21`), handed to the invoice agent,
and it passes in the latest run.

**Condition/tires** — the condition page renders **no tire inputs at all** on a
fresh HS report (probed: the only `input[name]`s are paintType, hard,
paintCondition, generalCondition, bodyCondition, interiorCondition,
drivingAbility, vehicleColor, specialFeatures, mileageRead, estimateMileage,
nextMot). Nothing to type into, so the case cannot pass; this is ticket 20's
territory. Owner: condition agent.

Both cases are left in the spec deliberately, failing, as live regression
coverage for those owners rather than being skipped into silence.

## Note from the wave-2 invoice agent (2026-09-23)

The invoice case of `21-tab-switch-data-loss.spec.ts` is **green**. It needed two fixes, not
the one the wave-1 hand-off predicted.

1. **The change subscription** the calculation page has, ported to `invoice/page.tsx` with the
   same `dirtyFields` guard and dotted-name (array field) exclusion. That alone was **not**
   enough.
2. **A stale-cache latch in the init effect.** `useInvoice` sets `refetchOnMount: 'always'`, so
   a remount serves the *previous* mount's cached body first and fires the new GET behind it.
   The effect guarded only on `if (!data ...)`, so it latched `initializedRef` on that cached
   body — which predated the unmount PATCH — reset the form to `INVOICE_DEFAULTS`, and then
   regenerated and saved a **new invoice number** on top. Proven with a request/response probe:
   the DB held `payoutDelay = 21` and the GET returned `21`, while the input showed the default
   `30` and a spurious `{"invoice":{"invoiceNumber":"GH-9254-2026"}}` PATCH went out on every
   re-entry.

   Fixed by gating the effect on React Query's `isFetchedAfterMount`, so the form only ever
   initialises from **this** mount's own fetch.

Worth checking on the other tabs: every section hook uses `refetchOnMount: 'always'`, and the
calculation / accident-info / vehicle / condition pages all latch on `data` (or on one nested
object) the same way. The section-save barrier from this ticket makes the *write* safe, but
this second latch is a separate hazard and the same pattern is present in all of them. They
pass today because their init guards happen to look at a nested object that is null until the
first real save — which is luck, not design.
