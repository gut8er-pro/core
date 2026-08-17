# A cached vision-operation module

**Status:** ready-for-agent
**Next step:** implement Phase 0 → Phase 5 below (behavior-preserving, one commit per step).
**Strength:** Strong · **Dependency category:** mock (inject the Anthropic client so wiring is testable)

> Design settled via `/grilling` on 2026-08-05. Two owner decisions locked:
> **(Q1) Full consolidation** — build the shared module and delete the dead HTTP stack.
> **(Q2) Careful/incremental** — behavior-preserving move first (characterization tests prove nothing
> changed), then the known-bug fixes as separate, individually-tested follow-up commits.

---

## Problem

The **check-cache → call-model → parse** triad is copy-pasted across ~13 sites. Each analyzer owns its own caching, locale suffix, and fence-strip + `JSON.parse`. The documented concentrator `withAiCache` — "the new preferred entry point" — **was never built**. Every analyzer news up its own Anthropic client inline, so only leaf parsers are tested while the wiring bugs (the ones the code comments describe) have **no test surface**.

## Evidence (file:line)

Triad copy-pasted (~13 sites):

- Analyzers: `classifier.ts:61-63,92`; `damage-analyzer.ts:70-72,107`; `interior-analyzer.ts:40-42,71`; `overview-analyzer.ts:53-55,84`; `tire-analyzer.ts:69-71,100`.
- HTTP routes (a whole second stack): `api/ai/detect-vin/route.ts:25-28,90`; `detect-plate/route.ts:23-26,85`; `ocr/route.ts:37-40,114`; `analyze-photo/route.ts:23-26,75`.
- Inline in the pipeline (a **third** stack): `pipeline.ts:926-928,963`; `:1011-1013,1041`; `:1046-1048,1114,1118`.

The phantom concentrator:

- `src/lib/ai/cache.ts:8-16` documents `withAiCache` as the preferred entry point; `cache.ts:52-56` frames `persistToDb` around it — but it is **not defined or exported** (export block `cache.ts:196-203`). Dead documentation describing the deep module that would have made this concentrated.

Cache-key + locale knowledge lives in **4 places that agree only by coincidence** (no code links them):

- (a) each analyzer folds locale into the op string — `getCacheKey(photoId, \`damage-analysis:${locale}\`)`; (b) `prewarmFromDb` rebuilds it defensively (`cache.ts:138-144`, apologetic comment); (c) `LOCALE_AWARE_OPS` Set (`pipeline.ts:66-72`, four ops); (d) a **separate** hard-coded `isLocaleAware` switch keyed on `r.type` at persist time (`pipeline.ts:671-710`).
- Per-analyzer `localeSuffix` ternaries are near-duplicate prose with subtle divergence: `damage-analyzer.ts:17-20` (DE branch written *in German*, extra anti-drift guard), `interior-analyzer.ts:9-12`, `overview-analyzer.ts:17-20`, `tire-analyzer.ts:9-12` (asymmetric "strictly"; each names a different enum scope).

Dependencies newed up inline (no injection seam) — **14 call sites**:

- `anthropic.ts:3-7` (`getAnthropicClient` does `new Anthropic(...)` on every call — no memoization), called inline in every analyzer (`classifier.ts:65`, `damage-analyzer.ts:74`, `interior-analyzer.ts:44`, `overview-analyzer.ts:57`, `tire-analyzer.ts:73`, `calculation-extractor.ts:32`, `vehicle-lookup.ts:215`), every HTTP route, and every inline pipeline fn (`pipeline.ts:930,1015,1050`).
- Fence-strip + `try/JSON.parse/catch` boilerplate re-declared across files; `VIN_PATTERN` re-declared in `pipeline.ts:81` and `detect-vin/route.ts:8`.
- Only existing injection precedent: `callPlateModel(client, …)` (`pipeline.ts:982-1005`), typed `ReturnType<typeof getAnthropicClient>` — a parameter-passing seam, but the caller still news the client up. No Anthropic fake exists anywhere; MSW is installed but orphaned (`src/test/msw/*` unwired).

Three duplicate VIN/plate/OCR stacks that have **drifted**:

- Plate: pipeline (`pipeline.ts:1007-1043`, two-attempt + `GERMAN_PLATE_RE` validation) vs HTTP (`detect-plate/route.ts:45-87`, single attempt, **no regex** — accepts any non-"null" string).
- OCR: pipeline (`pipeline.ts:1045-1121`, 21-field schema incl. owner/Halter) vs HTTP (`ocr/route.ts:8-18`, 9-field, no owner fields — **12 fields silently dropped**).
- `client.ts:26-64` is a genuinely **shallow** module (four ~6-line `fetch` wrappers, large interface) fronting that second HTTP stack.

### Verified during grilling (sharpens/corrects the above)

- **The entire HTTP stack (Stack B) is dead.** Routes ← `client.ts` ← `use-ai.ts` (React-Query hooks) ← **nobody**. Grep found zero consumers of the hooks; only `use-ai.test.ts` references the chain, and it mocks `@/lib/ai/client`. It is also the *weaker* fork (no plate regex, 9-field OCR). → safe to delete outright.
- **The triad is not uniform.** Image arity varies: **0** (`vehicle-lookup`, text-only), **1** (most), **N** (`calculation-extractor` spreads an array). **Two ops don't cache at all** (`calculation-extractor`, `vehicle-lookup`). Only **damage** attaches `cache_control: { type: 'ephemeral' }` to its image block (`damage-analyzer.ts:95`). Damage/tire take **extra non-locale inputs** (`position`, `damageLocation`, `vehiclePosition`) used in prompt/parse. So `runVisionOp(op, image, {locale})` is too simple — see interface below.
- **No Zod anywhere.** Every op does `JSON.parse → hand-rolled field narrowing → per-op fallback object`. The pure parsers (`parseDamageResponse`, etc.) are already extracted and unit-tested (`parsers.test.ts`, `vehicle-lookup.test.ts`); the *wiring around them* is not.
- **`PROMPT_VERSIONS`** (`pipeline.ts:50-64`) is per-op cache-busting data and belongs with the op registry.

## Why it's shallow / deletion test

Deleting `cache.ts`'s in-mem functions would collapse ~13 near-identical blocks — so shared code earns keep, but it's shallow: a 3-line Map wrapper (`cache.ts:22-50`) exposing 3 functions callers must orchestrate themselves. Low behaviour-per-interface-learned. The pure parsers were extracted **for testability** while the real bugs — German leaking into EN output, hallucinated fallback markers, stale `photoId` on cross-report cache reuse — all live in the **wiring**, which has no test surface. This is the "no locality" failure.

---

## Settled design

One `runVisionOp` module owns the triad. Per-op differences become **data** (a registry entry). It accepts an **injected client**, defaulting to `getAnthropicClient()`, so a fake makes the wiring testable. Call sites shrink to one line. This is the `withAiCache` the comment promised.

### Scope (Q1 = A)

- **In:** every **image-based** op — the 5 analyzers (`classify`, `damage-analysis`, `interior-analysis`, `overview-analysis`, `tire-analysis`), the multi-image `calculation-extractor`, and the inline `detect-vin` / `detect-plate` / `ocr-document`.
- **Out:** `vehicle-lookup` (text-only, no image, no cache, one caller) — stays a separate function; it may still receive the client-injection seam on its own but does not go through `runVisionOp`.
- **Deleted:** the dead HTTP stack — `src/app/api/ai/{detect-vin,detect-plate,ocr,analyze-photo}/route.ts`, `src/lib/ai/client.ts`, `src/hooks/use-ai.ts`, `src/hooks/use-ai.test.ts`. (`analyze-photo` has no live equivalent and is not re-created.)

### Behavior-preserving guarantees (Q2 = a)

- App behaves **identically** after consolidation. Live behaviors are preserved exactly: **21-field** OCR, validated + retried plate, each op's **exact current prompt wording** (including the inconsistent DE/EN `localeSuffix` phrasing — kept verbatim; tidying wording is a behavior change and is out of scope).
- The weaker duplicates don't "lose an argument" — they're deleted because nothing runs them. **No quality regression risk** from the merge.
- The 4-way locale duplication collapses to **one `localeAware` flag** per op — this is de-duplication (the copies agree today), not a behavior change, so it rides along in the safe pass.

### Interface (finalized during build; sketch)

```ts
type VisionOp<TResult> = {
  name: string                    // 'damage-analysis' | 'classify' | 'detect-vin' | ...
  model: string                   // e.g. 'claude-haiku-4-5-20251001'
  maxTokens: number
  cache:                          // null → op does not cache (calc)
    | null
    | { op: string; localeAware: boolean; promptVersion: number }
  imageCacheControl?: boolean     // true for damage only
  buildPrompt: (input: TInput) => string          // static const OR (…, locale) => string
  parse: (photoId: string, rawText: string) => TResult   // reuse the EXISTING extracted parser
  retry?: {                       // plate only: preserves two-attempt behavior as data
    maxAttempts: number
    isValid: (parsed: TResult) => boolean
    buildRetryPrompt: (input: TInput) => string
  }
}

async function runVisionOp<TResult, TInput>(
  op: VisionOp<TResult>,
  images: ImageData[],            // arity 1 → [image]; arity N → calc; runVisionOp always ≥1 image
  ctx: {
    photoId: string
    locale: Locale
    client?: ReturnType<typeof getAnthropicClient>   // defaults to getAnthropicClient()
  } & TInput,                     // op-specific extras: position, damageLocation, vehiclePosition
): Promise<TResult>
```

Test fake (structurally assignable, no SDK type needed):
`{ messages: { create: async () => ({ content: [{ type: 'text', text }] }) } }`.

### Op registry data (source of truth for the table below)

| op name | model | maxTokens | caches? | localeAware | imageCacheControl | arity | extra inputs |
|---|---|---|---|---|---|---|---|
| `classify` | haiku-4-5 | 256 | yes | no | – | 1 | – |
| `damage-analysis` | sonnet-4-5 | 2048 | yes | yes | **yes** | 1 | position, damageLocation |
| `interior-analysis` | haiku-4-5 | 512 | yes | yes | – | 1 | – |
| `overview-analysis` | haiku-4-5 | 512 | yes | yes | – | 1 | – |
| `tire-analysis` | haiku-4-5 | 512 | yes | yes | – | 1 | vehiclePosition |
| `calculation-extractor` | sonnet-4-5 | 512 | **no** | no | – | N | – |
| `detect-vin` | haiku-4-5 | 256 | yes | no | – | 1 | – (post: 17-char `VIN_PATTERN` extract/validate) |
| `detect-plate` | haiku-4-5 | 256 | yes | no | – | 1 | – (retry: two-attempt + `GERMAN_PLATE_RE`) |
| `ocr-document` | sonnet-4-5 | 1024 | yes | no | – | 1 | – (21-field incl. owner/Halter) |

(Model IDs: `claude-haiku-4-5-20251001`, `claude-sonnet-4-5-20250929`.)

### Cache ownership

- `runVisionOp` becomes the **single place that spells a cache key**. It owns in-mem read/write for ops whose registry entry has a non-null `cache`.
- The op registry becomes the **single source** `prewarmFromDb` and `persistResultsToDb` consult for `{ operation, locale (via localeAware), promptVersion }` — they take registry entries instead of re-deriving strings. Deletes `LOCALE_AWARE_OPS`, the persist-time `isLocaleAware` switch, and per-caller `:${locale}` folding.
- Keep `cache.ts`'s low-level Map + DB primitives (`getCachedResult` / `setCachedResult` / `persistToDb` / `prewarmFromDb`) as the storage layer — **do not rewrite storage**. `getCacheKey`'s locale-folding responsibility moves inside `runVisionOp`.

---

## Implementation plan (one commit per step; behavior-preserving unless noted)

**Phase 0 — Delete the dead HTTP stack.** Remove the four `api/ai/*/route.ts`, `client.ts`, `use-ai.ts`, `use-ai.test.ts`. Confirm no remaining imports (already verified: zero live callers). Zero-risk, independent.

**Phase 1 — Build `runVisionOp` + op registry, no rewiring yet.** New module alongside existing code. Registry entries reference the **existing** extracted parsers. Add unit tests using the fake client for ≥2 ops (one locale-aware analyzer, one non-caching / multi-image). Nothing calls it in prod yet.

**Phase 2 — Migrate call sites one op at a time.** Each op: replace its inline triad with a `runVisionOp` call; add a characterization test (fake client) pinning today's output. Suggested order: `overview-analysis` (simple locale-aware) → `damage-analysis` (cache_control + extra inputs) → `interior`/`tire`/`classify` → `calculation-extractor` (multi-image) → `detect-vin` → `detect-plate` (retry) → `ocr-document`. One commit each.

**Phase 3 — Move cache-key + locale ownership into the module.** Make `prewarmFromDb` / `persistResultsToDb` consume registry entries; delete `LOCALE_AWARE_OPS`, the persist switch, and per-caller locale folding; collapse to the single `localeAware` flag. Pure de-dup.

**Phase 4 — Memoize the client (separate, small).** Lazy module-level singleton in `getAnthropicClient` instead of new-per-call. Benign behavior change → its own commit, not mixed into the structural pass.

**Phase 5 — Queued fixes (each its own tested diff, after the move is proven).**
1. Add a test locking in the German-leak guard (the prompt-v2 strictness) so it can't silently regress.
2. Add a test locking in the hallucinated-center-marker guard (`collectDamageMarkers`).
3. Fix the stale-`photoId` rebind (`cache.ts:146-155`) so it also re-points array/primitive results, not just objects; add a test.

---

## Wins

- Collapse ~13 triads into one interface; call sites become one-liners.
- Cache-key + locale rule live once (delete the 4 copies).
- Injected client → wiring bugs finally have a test surface.
- VIN/plate/OCR stop drifting (dead weaker fork deleted; single live definition).
- Builds the `withAiCache` the comment already promised.

## Related

Pairs with [02-pipeline-result-seam](../02-pipeline-result-seam/spec.md) (both AI; do this one first — it's more foundational).
