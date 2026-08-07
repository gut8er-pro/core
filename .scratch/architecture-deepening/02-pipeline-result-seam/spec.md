# Give the AI pipeline a real result seam

**Status:** needs-triage
**Next step:** `/grilling` on this file to design the `GenerationResult` view model + `persistReport` interface.
**Strength:** Strong · **Dependency category:** in-process (inject Prisma at the persistence seam)

## Problem

`runPipeline`'s declared return type is a **lie**. The data the caller actually needs (all DB-write payloads) is attached by cast and read back by cast, bypassing the interface. It then feeds a **540-line `persistResults` procedure** that re-derives the field lists the pipeline already computed, with business logic (kW→HP, tire-position assignment) buried inside inline `prisma` calls — none of it testable.

## Evidence (file:line)

The `_payloads` side channel:

- `src/lib/ai/pipeline.ts:135-141` — signature: `runPipeline(_reportId, photos, emit, options, locale): Promise<GenerationSummary>`. Note `_reportId` is unused; the real output is not in the return type.
- `src/lib/ai/pipeline.ts:619-642` — builds `autoFillPayloads` then smuggles it: `;(summary as GenerationSummary & { _payloads: … })._payloads = autoFillPayloads`.
- `src/app/api/reports/[id]/generate/route.ts:164-196` — `PipelinePayloads` type **hand-redeclared** in the route as a structural duplicate of the inline literal; must be kept in sync by hand.
- `src/app/api/reports/[id]/generate/route.ts:202` — reads it back by cast: `(summary as … & { _payloads?: PipelinePayloads })._payloads`.
- `GenerationSummary` also accumulates via **mutation** through `emit` (`pipeline.ts:142-150`) — violates return-results-don't-mutate.

`persistResults` — the 540-line procedure (`generate/route.ts:201-740`):

- Fuses ~6 independent responsibilities: vehicle `205-296`, claimant `298-350`, condition/markers `352-410`, tire `412-588`, calculation `590-614`, photo updates `616-654`, reorder `656-668`, stamping `670-684`, summary/title `686-739`.
- **Re-derives field lists the pipeline already knows**: `summary.autoFilledFields.*` (`pipeline.ts:499-603`) and `calculationFields` (`pipeline.ts:570-603`) vs the route's re-derived `stringFields`/`numericFields` (`route.ts:209-239`), condition mapping (`:364-384`), calc mapping (`:593-601`). The set of AI-filled fields lives in **two places that must agree**.
- **Business logic buried in the writer, un-testable without a DB**: kW→HP (`route.ts:242-244`), overview back-fill (`:254-283`), the entire tire position-assignment algorithm incl. `profileToMm` + `bestTire` scoring (`:431-583`), auto-title (`:700-731`). Every branch calls `prisma.*` inline; `prisma` is the module singleton (`route.ts:18`), never injected.

`runPipeline` has **exactly one caller** (`route.ts:8,112`) — one adapter, so the current pipeline↔route seam is hypothetical, yet it's the heaviest seam in the subsystem.

## Why it's shallow / deletion test

The interface *looks* small (5 params → 1 summary) but the true contract is the ~15-field `_payloads` object transmitted out-of-band — the type system is switched off at exactly the seam that matters. You cannot test `runPipeline`'s real output through its interface because the output isn't in the interface. `persistResults` is deep in volume but fuses 6 responsibilities behind a `(reportId, summary) → void` interface with all real inputs smuggled in.

## Deepening target (to be finalized in grilling)

1. `runPipeline` returns a **typed `GenerationResult`** view model — every payload the caller needs, in the return. Delete the `_payloads` cast and the route's hand-redeclared `PipelinePayloads`.
2. A `persistReport(result, db)` module consumes the view model with an **injected** Prisma client, so the tire-assignment + kW→HP logic can be tested against a fake db (or, better, extracted as pure functions the persist step calls).

Open grilling questions:
- Is `GenerationResult` one flat object, or split per-target (vehicle / claimant / condition / tire / calc)?
- Does `emit` (SSE progress) stay a side-effect sink, or also fold into the result? (It genuinely streams — probably stays, but the *final* result must be in the return.)
- Split `persistReport` into per-target sub-writers behind one interface, or keep one procedure that's now testable?
- Pull the tire-assignment algorithm out as a **pure function** (its own deletable-test) — this is the most bug-prone code and currently has zero test surface.

## Wins

- The interface is the test surface again.
- Field list lives in one place, not two.
- Tire assignment + kW→HP testable without a database.
- Delete the hand-synced payload type in the route.
- Locality: DB writes concentrate behind one injected seam.

## Related

Pairs with [03-cached-vision-operation](../03-cached-vision-operation/spec.md) (both AI). Enum normalization leak (`pipeline.ts:3, 803-807` imports `normalizeConditionValue` from the PDF layer) is better homed by [06-pdf-view-model-seam](../06-pdf-view-model-seam/spec.md).
