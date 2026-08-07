# One child-collection persistence module

**Status:** ready-for-agent
**Next step:** implement **Phase A** (see Finalized design below).
**Strength:** Strong (highest correctness payoff) · **Dependency category:** in-process (transactional Prisma)

## Problem

CLAUDE.md describes **one** rule for array fields — *"save entire array on blur, API replaces all when no IDs."* In reality it is implemented **three divergent ways** that differ in transactionality and who owns deletion, and they are **compensating for each other's bugs** (the visits path exists to clean up duplicate rows the other path creates).

## Evidence (file:line)

Three server strategies:

- **(a) visits — transactional ID-diff replace** (`accident-info/route.ts:118-165`): load existing IDs, delete rows whose ID isn't incoming, update-by-id / create-if-no-id, all in `prisma.$transaction`, with per-row ownership re-check.
- **(b) lineItems — bulk "if none have IDs → deleteMany + create"** (`invoice/route.ts:131-163`): the only literal match to the CLAUDE.md wording; **no transaction**; still carries a separate `deleteLineItemIds` path (`:166-174`) that the replace-all mode makes partly redundant.
- **(c) markers / tireSets / additionalCosts — NO replace-all** (`condition/route.ts:174-327`, `calculation/route.ts:129-166`): upsert-by-id loop that relies on the client sending explicit `deleteXIds` arrays for removals. `tireSets` nests a second upsert loop for child `tires` (`condition:270-311`).

Client side is split into two channels too:

- `visits` + `lineItems` saved as whole arrays via `useAutoSave` (`accident-info/page.tsx:181-185`, `invoice/page.tsx:95-110`).
- markers / tireSets / additionalCosts / signatures saved as **individual items** via dedicated React Query mutations, bypassing auto-save.

The bugs-patching-bugs smell (explicit in the code):

- `accident-info/page.tsx:216-220` deliberately disables per-keystroke saving for `visits.*` "because the form doesn't currently round-trip the created row id back from the API, so per-keystroke saves of an unsaved row would produce duplicate DB rows" — the exact duplication the visits `$transaction` (`route.ts:118-125`) was written to clean up.

## Why it's shallow / deletion test

The conceptual problem — "persist an array of report children" — is one thing solved three ways. The **field lists** inside each are genuinely distinct domain data and would not collapse; only the **write strategy** is duplicated-with-drift. A single `replaceChildren` module would concentrate the deletion semantics that are currently smeared and inconsistent.

## Deepening target (to be finalized in grilling)

A single `replaceChildren(tx, { parentKey, parentId, model, incoming, uniqueBy })` module with **one** deletion semantics (ID-diff, transactional), driven by data. All child arrays route through it. The client stops tracking `deleteXIds`.

Open grilling questions:
- **Deletion semantics**: ID-diff (delete rows not in payload) is the safest single rule — confirm every collection can adopt it (visits, lineItems, damageMarkers, paintMarkers, tireSets+tires, additionalCosts, signatures).
- **Nested children** (tireSets → tires): does `replaceChildren` recurse, or does the caller compose two calls?
- **ID round-trip**: fix the root cause behind the visits hack — the API must return created IDs so the client can send them back. Does that let markers/costs move onto the whole-array auto-save channel and retire the per-item mutations?
- **Transaction ownership**: the wrapper from [04](../04-with-report-section-wrapper/spec.md) could open the `$transaction`; `replaceChildren` receives `tx`.
- Ownership re-check per row (as visits does) — keep as a guard inside the module?

## Wins

- Highest correctness payoff of the seven.
- Deletion semantics defined once (transactional, ID-diff).
- Closes the duplicate-row class of bug (and the hack compensating for it).
- Client stops shipping `deleteXIds`.
- One place to test array persistence (currently untested except via E2E).

## Finalized design (grilling, 2026-08-06)

### Scope decision: **A — server engine only**

Build the one server-side `replaceChildren` module now; leave the browser channels
mostly as-is. Rationale: the clean "delete anything not in the payload" rule only
works when the client sends the *whole* array, and only **visits** + **lineItems** do
that today. The four per-item collections (damage/paint markers, tireSets, additional
costs) send one item at a time and would be catastrophically over-deleted by id-diff —
migrating them requires the client to send whole arrays, which is **Phase B**.

**Phase A migrates exactly two collections:**
- **lineItems** — the real fix. Today: non-transactional `deleteMany`-then-recreate with
  an `allNew` full-wipe flag → crash can lose data. After: transactional id-diff. Also
  retires the dead server-side `deleteLineItemIds` handler (client hook is unused).
- **visits** — already transactional id-diff; moved onto the shared module for
  consolidation + its first unit tests. No behavior change.

**Deferred to Phase B** (needs client changes): migrate markers / tireSets(+tires) /
additionalCosts onto whole-array auto-save; remove the visits "don't save while typing"
hack (root-cause fix: client generates the row uuid up front — ids are client-supplyable);
delete `deleteXIds` client tracking + the dead per-item mutations.

### Engineering decisions

- **D1 — id-diff only.** No schema has a business/natural unique key, so reconciliation is
  purely by `id`. The spec's `uniqueBy` param is dropped (can't exist).
- **D2 — external transaction.** `replaceChildren` receives no client of its own; the
  **caller** wraps it in `prisma.$transaction`. Phase A: each route opens its own tx.
  When [04](../04-with-report-section-wrapper/spec.md)'s wrapper lands it supplies the tx —
  a one-line swap, no interface change.
- **D3 — parent-scoped writes, no per-row ownership SELECT.** Every delete/update is scoped
  `where { id, [parentKey]: parentId }`. A forged id from another parent matches zero rows,
  so the per-row `findFirst` "defence in depth" (visits) is dropped as redundant — same
  safety, one fewer query per row.
- **D4 — no recursion.** For nested tireSets→tires (Phase B), the caller composes two flat
  `replaceChildren` calls; the module never traverses nesting.
- **D5 — signatures excluded permanently.** Enum-typed, logically one-per-type, own DELETE
  route → id-diff replace is the wrong model. Stays on its current path.
- **D6 — caller pre-coerces.** Model-specific transforms (e.g. visit `date` string → `Date`)
  happen in the route before calling the module; the module stays generic.

### Interface

```ts
replaceChildren(model, { parentKey, parentId, incoming, orderBy? }): Promise<{ id: string }[]>
```

`model` is a Prisma delegate (`tx.visit`, `tx.invoiceLineItem`, …) typed via a minimal
structural interface. Returns the authoritative post-state (created ids included) so route
responses keep returning rows. One unit test file is the first test coverage for array
persistence — `src/lib/api/replace-children.test.ts`.

## Related

Pairs with [04-with-report-section-wrapper](../04-with-report-section-wrapper/spec.md): 04 owns the scalar envelope + transaction; this owns the array write. Fixing the ID round-trip here may let the two array client-channels merge into one.
