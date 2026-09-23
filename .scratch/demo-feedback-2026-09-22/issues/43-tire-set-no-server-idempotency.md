# 43 — Condition PATCH has no server-side idempotency on tire sets

Status: ready-for-agent
Type: hardening
Severity: low-medium

Found while fixing the tire fast-switch race (ticket 20 follow-up): an id-less tire set in the
condition PATCH always CREATES a new set, with no uniqueness on `(conditionId, setNumber)`. The
client now avoids it (placeholder is read-only until the real set lands, ids re-attached), but a
duplicate-set write is still reachable in principle from any other client path or a retried
request.

Direction: unique constraint on `(conditionId, setNumber)` (schema change — additive index +
upsert-by-setNumber in the route's no-id branch), or route-level upsert keyed on setNumber.
