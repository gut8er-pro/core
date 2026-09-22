# 27 — BVSK fee: automatic instead of manual (research only, per Ivan)

Status: needs-triage
Type: research
Severity: medium

Client: BVSK is manual today — the assessor opens the rate table and applies a bracket by hand.
It should populate automatically "po trenutnoj BVSK" (from the current BVSK survey). Ivan's
instruction: ONLY check what is possible for now, no implementation.

## Questions to answer

1. The in-app BVSK table already maps damage-amount brackets → base fee + additional fee
   (`bvsk-rate-table.tsx` + its data source). The report's damage amount exists once calculation
   is filled (repair cost / replacement value) — auto-selecting the bracket from it is pure
   in-app logic. Confirm which figure legally drives the bracket (Schadenhöhe = repair cost net,
   or WBW on total loss) — that rule is the crux, likely repair-cost-net vs replacement-value
   minus residual on total loss.
2. Data currency: is the embedded table the CURRENT BVSK-Honorarbefragung (2024/2026?), and is
   there any licensed feed/API for updates, or is periodic manual refresh of the table the only
   option? (BVSK publishes the Honorarbefragung to members; there is no public API — verify.)
3. Proposal shape if feasible: when calculation is complete, pre-fill the Grundhonorar default
   row (ticket 26) from the auto-selected bracket, visibly labelled with the bracket, still
   editable; the red no-repair-cost warning the table already shows becomes the empty state.

Deliverable: findings + recommendation appended here, then Ivan decides go/no-go with the
client.
