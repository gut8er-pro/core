# 43 — Condition PATCH has no server-side idempotency on tire sets

Status: done
Type: hardening
Severity: low-medium

Found while fixing the tire fast-switch race (ticket 20 follow-up): an id-less tire set in the
condition PATCH always CREATES a new set, with no uniqueness on `(conditionId, setNumber)`. The
client now avoids it (placeholder is read-only until the real set lands, ids re-attached), but a
duplicate-set write is still reachable in principle from any other client path or a retried
request.

Direction: unique constraint on `(conditionId, setNumber)` (schema change — additive index +
upsert-by-setNumber in the route's no-id branch), or route-level upsert keyed on setNumber.

## Resolution (2026-10-04)

- `@@unique([conditionId, setNumber])` on `TireSet`, in migration
  `20261004120000_unique_tire_set_number`. The migration first deletes existing duplicates —
  keeping the set with the most tires, lowest id on a tie — or the index cannot be built. It
  replaces `TireSet_conditionId_idx`, which the composite index covers. Already applied to prod
  (pre-launch) on 2026-10-04.
- The condition PATCH's id-less branch is now "make sure set N exists", not an upsert that
  applies the payload: it creates the set with its tires in one write, and on a unique
  violation returns the existing set untouched apart from tires at positions it lacks. Every
  id-less sender (first-load auto-create, "add set", a retry of either) sends blank defaults,
  so overwriting would wipe what the assessor typed — worse than the duplicate it replaces.
- Beyond the ticket: an id-less tire on an identified set now updates the tire already at
  that position instead of adding a second, and tire ids are scoped to their set (a tire id
  from another report can no longer be written through this one).
- The AI generate route's find-then-create of set 1 is now an upsert on the same key.
- `src/test/integration/condition-tire-sets.integration.test.ts`: retry, gap-filling,
  concurrent writes, a genuinely new set 2, and position matching on an identified set.

Left open: moving an identified set onto a set number another set holds now 500s on the
unique constraint (no client does this). If a delete-set button is ever wired up,
`handleAddTireSet`'s `tireSets.length + 1` must become the lowest free set number, or it
will land on an existing set.
