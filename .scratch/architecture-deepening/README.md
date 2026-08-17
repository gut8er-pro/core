# Architecture deepening — effort index

Seven deepening opportunities from the architecture review on 2026-08-05. Each turns a **shallow** module (interface nearly as wide as its implementation) into a **deep** one (a lot of behaviour behind a small interface, tested through that interface).

Vocabulary is from the `codebase-design` skill: **module · interface · implementation · depth · seam · adapter · leverage · locality**. The visual report is `architecture-review.html` (open it in a browser).

Each candidate has a self-contained `spec.md` under its numbered folder — it carries the full friction map (file:line evidence) so a **fresh session can pick it up cold** with no re-exploration.

## How to work through these (one per session)

Grilling + implementing a candidate is a big chunk. Do them **one per fresh session** so context stays clean:

1. Start a new session in this repo.
2. `/grilling` and point it at the spec, e.g. *"Grill me on `.scratch/architecture-deepening/01-report-type-policy/spec.md`"*. The grill walks the decision tree — constraints, what sits behind the seam, which tests survive — and produces the interface (do **not** finalize the interface before grilling).
3. Side effects happen inline during grilling: `/domain-modeling` keeps `CONTEXT.md` current (e.g. candidate 1 names a `ReportType` policy concept); a load-bearing rejection becomes an ADR under `docs/adr/`.
4. Update the **Status** line in this table when a candidate is designed / done.

## Recommended order (mostly independent; arrows = "unblocks")

```
1 report-type-policy ──┬──▶ 6 pdf-view-model-seam
                       └──▶ (feeds tab-completion + PDF calc branching)
5 child-collection-persistence   (highest correctness risk — do early)
4 with-report-section-wrapper
3 cached-vision-operation ──▶ 2 pipeline-result-seam
7 settings-feature-modules       (speculative — last)
```

Suggested sequence: **1 → 5 → 4 → 3 → 2 → 6 → 7**. Start with 1 (best leverage-to-risk, gives the others a vocabulary); reach for 5 early because its three divergent "replace-all" strategies are compensating for each other's duplicate-row bugs.

## Status tracker

| # | Candidate | Strength | Status |
|---|-----------|----------|--------|
| 1 | [report-type-policy](01-report-type-policy/spec.md) | Strong | needs-triage |
| 2 | [pipeline-result-seam](02-pipeline-result-seam/spec.md) | Strong | needs-triage |
| 3 | [cached-vision-operation](03-cached-vision-operation/spec.md) | Strong | needs-triage |
| 4 | [with-report-section-wrapper](04-with-report-section-wrapper/spec.md) | Strong | needs-triage |
| 5 | [child-collection-persistence](05-child-collection-persistence/spec.md) | Strong | needs-triage |
| 6 | [pdf-view-model-seam](06-pdf-view-model-seam/spec.md) | Worth exploring | needs-triage |
| 7 | [settings-feature-modules](07-settings-feature-modules/spec.md) | Speculative | needs-triage |

> These are **pre-design**: the friction is mapped, the deepening target is sketched, but the interface is decided during grilling — not before.
