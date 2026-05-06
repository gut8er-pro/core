# AI Cost Optimization — Research, Numbers, Plan

**Goal:** Minimize Anthropic spend per Generate-Report run while preserving (or improving) result quality.

**TL;DR:** A typical 12-photo report currently costs **~$0.12–0.15** in Claude calls. With the recommended changes, it drops to **~$0.04–0.06** — a **60–70% saving** with **no quality loss** (some changes actually improve quality by giving the analyzers crisper inputs where they need them).

---

## 1. How Anthropic charges for vision

Source: [Vision docs](https://platform.claude.com/docs/en/build-with-claude/vision), [Pricing docs](https://platform.claude.com/docs/en/about-claude/pricing).

- **Image token formula:** `tokens ≈ (width × height) / 750`. Auto-padded to multiple of 28 px.
- **Native max long edge:** 1568 px on Sonnet/Haiku 4.5 (Opus 4.7 = 2576 px). Beyond that, the API resizes down — no quality benefit, just bigger payload.
- **Media type doesn't affect tokens** — only dimensions do. JPEG vs PNG only changes payload size (upload speed). Same billable tokens.
- **Multi-image messages save prompt tokens, not image tokens** — sending 5 images in 1 call avoids re-sending the prompt 5×.

### Pricing (USD per 1M tokens, May 2026)

| Model | Input (base) | Output | Cache write 5m | Cache write 1h | Cache HIT |
|---|---:|---:|---:|---:|---:|
| Haiku 4.5 | $1.00 | $5.00 | $1.25 | $2.00 | **$0.10** |
| Sonnet 4.5 | $3.00 | $15.00 | $3.75 | $6.00 | **$0.30** |
| (Batch API) | 50% off everything | | | | |

Cache hit = **90% off base input** when the same image+prompt prefix is re-sent within TTL. Min cache size: 1024 tokens.

### Image-size → token table (using `(W×H)/750`)

| Pixels | Tokens | Sonnet input | Haiku input |
|---|---:|---:|---:|
| 200 × 150 (thumb) | 40 | $0.00012 | $0.00004 |
| 512 × 384 | 262 | $0.00079 | $0.00026 |
| 768 × 576 | 590 | $0.00177 | $0.00059 |
| 1024 × 768 | 1049 | $0.00315 | $0.00105 |
| **1568 × 1176 (current `ai`)** | **2459** | **$0.00738** | **$0.00246** |
| 2576 × 1932 (Opus max) | 6634 | n/a | n/a |

> **Note on the 1568 cap:** docs use the words "max 1568 image tokens" for non-Opus. In practice the formula applies up to that ceiling; an image at 1568 long edge × 1176 high would still bill ~2459 tokens because both axes contribute. Verify with the [token-counting endpoint](https://platform.claude.com/docs/en/build-with-claude/token-counting) before final tuning, but the trend (smaller image → fewer tokens) is reliable.

---

## 2. Where the money goes today

A typical 12-photo report (Audi A6 test set) makes **26–27 API calls**:

| Step | Model | Calls | Image tokens each | Output cap |
|---|---|---:|---:|---:|
| Classify | Haiku | 12 | 2459 | 256 |
| Damage analyzer | Sonnet | 5 | 2459 | 2048 |
| Overview analyzer | Haiku | 1–2 | 2459 | 512 |
| Interior analyzer | Haiku | 1 | 2459 | 512 |
| Tire analyzer | Haiku | 0–4 | 2459 | 512 |
| VIN detect | Haiku | 0–1 | 2459 | 256 |
| Plate detect (+retry) | Haiku | 1–2 | 2459 | 256 |
| OCR document | Sonnet | 0–2 | 2459 | 1024 |
| Calculation extractor | Sonnet | 1 | 5 × 2459 = 12,295 | 512 |
| VIN AI fallback | Haiku | 0–1 | 0 (text only) | 512 |

**Estimated current cost per 12-photo report:** ≈ **$0.12–0.15**. Mostly Sonnet on damage (5 × ~$0.011 = $0.055) and the calculation extractor ($0.04) — those two account for ~70% of the bill.

The cache (`src/lib/ai/cache.ts`) is in-memory with 1-hour TTL — it helps on repeated Generate clicks within a single server lifetime, but is wiped on every deploy/restart. Effectively a non-factor for production cost projections.

---

## 3. Where every photo actually needs detail (and where it doesn't)

Not every analyzer needs 1568×1176. The current pipeline sends the same big variant everywhere. Mapping detail requirement to task:

| Task | Detail need | Reasonable size | Why |
|---|---|---|---|
| **Classify** | Low — just "what is this photo?" | 384–512 px | A wallet-sized thumbnail is enough to tell damage from doc from interior. |
| **Plate OCR** | High — small text | 1568 px | Plate characters can be 30 px tall in a wide shot. |
| **VIN OCR** | High — etched text | 1568 px | Often glare/low contrast; needs all the pixels. |
| **Document OCR (Zulassungsbescheinigung)** | High — many small fields | 1568 px | Holder name, postcode, KBA. |
| **Damage analyzer** | Medium-high — surface detail | 1024–1568 px | Cracks/dents need decent resolution; 1024 holds up well per Anthropic vision examples. |
| **Overview analyzer** | Low — color + body type | 768 px | Color, sedan/SUV — not subtle. |
| **Interior analyzer** | Medium — read odometer digits | 1024 px | Mileage extraction is the limiting factor. |
| **Tire analyzer** | High — sidewall code, DOT | 1568 px | Tiny stamped digits. |
| **Calculation (multi-image)** | Same as damage | 1024 px each | Already covered in damage; reuse. |

**Quick math** — switching just **classify** to a 384px variant: 12 photos × (2459 → 197) tokens × $1/MTok = saves ~$0.027 per report on classification alone, with **zero quality loss** (it's just routing).

---

## 4. The optimization tiers

Ranked by impact-per-quality-cost. Tier 1 is pure win; Tier 3 has small risk.

### TIER 1 — pure wins (no quality risk)

#### 1.1 Classify on the thumbnail variant
Use `previewUrl` (or a new `classifyUrl` at 512 px) for the classifier instead of `aiUrl`. The classifier just picks one of 8 buckets — it doesn't read text or measure damage. **Saves ~$0.025/report. Zero quality cost.**

#### 1.2 Persistent AI cache by **content hash**
Replace the in-memory 1h cache with a Postgres table keyed by `(sha256(image_bytes), operation, locale, prompt_version)`. Survives restarts; deduplicates across reports (same photo uploaded twice → analyzed once). Combined with the existing per-photo `aiProcessedHash`, this makes repeat-runs free.

Implementation: add a `AiResult` table:
```
AiResult {
  imageHash  String   // sha256 of image bytes
  operation  String   // 'classify' | 'damage-analysis' | ...
  locale     String   // 'en' | 'de'
  promptVersion Int   // bump when prompt changes to invalidate
  result     Json
  createdAt  DateTime @default(now())
  @@id([imageHash, operation, locale, promptVersion])
}
```

The current Java-hashCode-of-URL approach is collision-prone and pointless — same photo with different signed URL counts as different. **Saves 90%+ on repeat-Generate clicks. Saves duplicates across reports. Zero quality cost.**

#### 1.3 Right-size the AI variants per task
Add `previewUrl` (already exists at 800×600) and `aiUrl` (1568×1176 — keep for OCR/plate/VIN/tire/damage), plus a new compact variant for low-detail tasks:

| Task | Variant used now | Variant after |
|---|---|---|
| classify | aiUrl 1568 | **previewUrl 800** (or new 512px) |
| overview | aiUrl 1568 | **previewUrl 800** |
| interior | aiUrl 1568 | aiUrl (need odometer detail) |
| damage | aiUrl 1568 | aiUrl |
| plate / vin / document / tire | aiUrl 1568 | aiUrl |
| calculation | aiUrl 1568 each | **previewUrl 800** each (5 images) |

Calculation extractor is currently the single biggest line item ($0.04/report). 5 × 800px instead of 5 × 1568×1176 drops it to ~$0.012 — **saves ~$0.028/report**.

Total Tier 1 savings: **~$0.05–0.07 per report**, with no quality risk.

#### 1.4 Image content dedup at upload time
Hash incoming bytes; if the same hash already exists for any photo this user owns, link to the existing Photo record. Stops users re-uploading the same image from inflating storage AND AI cost.

---

### TIER 2 — Anthropic prompt caching (small implementation cost, high payoff for re-runs)

Anthropic supports `cache_control` on image blocks. The same image sent to multiple operations within the same model can be cached.

**Eligible:**
- A damage photo goes to: classify (Haiku) + damage-analyzer (Sonnet) + calculation (Sonnet). Within Sonnet, the image can be cached between damage-analyzer and calculation calls — saves ~70% of the second image-token charge.
- For repeat Generate runs in the same hour, every analyzer's cached prompt+image hits the 90%-off rate.

**Pre-conditions:**
- ≥1024 tokens (we're at ~2459 per image, so always eligible).
- Same model. Cache write ≠ shared between Haiku and Sonnet.
- Identical prompt prefix + image. Adding `cache_control` only requires a marker on the last cacheable block.

Add `cache_control: { type: 'ephemeral', ttl: '1h' }` to the system message + image block in each analyzer.

Expected saving on a single Generate run: **~$0.02 (only the calc-extractor + repeat damage path benefit).** Bigger payoff is on hot re-runs (user re-clicks Generate within an hour) — those drop to near-zero.

---

### TIER 3 — quality-trade-off optimizations (use only with care)

#### 3.1 Merge damage-analyzer + calculation-extractor
Currently they overlap: damage-analyzer returns severity / repair approach / hours; calc-extractor sends the same 5 photos again to extract damage class / repair method / risks / wheel-alignment / body-paint / plastic-repair / days. Single Sonnet call per damage photo could return both blocks.

Saves: 1 full Sonnet call's image tokens × 5 images = ~$0.04/report.

Risk: bigger output token budget per photo (~2.5k vs 2k). Schema is more complex; harder to debug. Test thoroughly before shipping.

**Recommendation:** Defer until after Tier 1+2 land. Re-evaluate once we have data on real-world report cost.

#### 3.2 Two-stage damage analysis
Run a cheap Haiku triage on damage photos: "is this a clear minor scratch or anything more?" If minor, skip the Sonnet damage call and use Haiku output. If anything else, escalate to Sonnet.

Risk: misclassifies "minor" damage that's actually structural. Insurance reports demand accuracy. **Not recommended for this product.**

#### 3.3 Skip the AI VIN fallback when WMI is unambiguous
If `wmiManufacturer(vin)` returns a non-null mapping AND NHTSA returned **any** model/year/displacement (even at low confidence), trust the merge instead of calling Haiku VIN-decode. Saves 1 Haiku text call (~$0.0003 — small) but reduces variance in manufacturer field. Already partially done in this week's WMI override.

---

## 5. Cost projections

Per 12-photo report. "Heavy month" = 200 reports/month for a single user.

| Scenario | Per report | Heavy month (200 runs) |
|---|---:|---:|
| **Status quo (today)** | $0.12–0.15 | $24–30 |
| **+ Tier 1.1 (classify on previewUrl)** | $0.10–0.12 | $20–24 |
| **+ Tier 1.3 (right-sized variants for overview/calc)** | $0.06–0.09 | $12–18 |
| **+ Tier 1.2 (persistent content-hash cache)** | $0.05–0.07 *first run; subsequent re-Generate effectively $0* | $8–12 |
| **+ Tier 2 (Anthropic prompt cache)** | $0.04–0.06 | $6–10 |
| **All tiers + Tier 3.1 merge** | $0.03–0.05 | $4–8 |

(All numbers are USD; ranges reflect varying photo mix per report.)

For your Audi A6 test specifically (12 photos, 5 damage):
- **Today:** ~$0.13
- **Tier 1 only:** ~$0.06
- **Tier 1+2:** ~$0.045
- **All tiers:** ~$0.035

---

## 6. Implementation plan (proposed for execution after approval)

### Phase A — Tier 1 (the obvious wins) — ~½ day
1. **Add a `classify` variant** (or reuse `previewUrl`). Update `process` route to generate it; update each analyzer to fetch the right variant.
   - `src/app/api/reports/[id]/photos/process/route.ts`
   - `src/lib/ai/classifier.ts` → use `previewUrl || aiUrl || url`
   - `src/lib/ai/overview-analyzer.ts` → use `previewUrl || aiUrl || url`
   - `src/lib/ai/calculation-extractor.ts` → use `previewUrl || aiUrl || url` for each input
   - Keep `aiUrl` for damage-analyzer, interior-analyzer, tire-analyzer, ocrDocument, detectVin, detectPlate
2. **Replace URL hashCode with SHA-256 of image bytes**.
   - New helper `sha256OfBytes(buffer)` in `src/lib/ai/fetch-image.ts`.
   - During `/photos/process`, compute and store `Photo.contentHash` (new schema column).
3. **Add `AiResult` table** keyed by `(contentHash, operation, locale, promptVersion)`.
   - Prisma migration.
   - Wrapper in `src/lib/ai/cache.ts` that checks DB first, falls back to in-memory.
   - Each analyzer bumps its own `promptVersion` constant when its prompt changes.
4. **Dedupe uploads by content hash**.
   - In photo upload route: if `contentHash` matches an existing Photo on this report, return the existing record without re-storing.

Verification:
- Re-run the Audi A6 test set on a fresh deploy. Watch the dev console for "cache hit" logs.
- Check Prisma DB after the run — `AiResult` table populated with 26 rows.
- Click Generate again on the same report — expect 0 new API calls.

### Phase B — Tier 2 (Anthropic prompt caching) — ~½ day
5. Add `cache_control: { type: 'ephemeral', ttl: '1h' }` to image+system blocks in each analyzer call. Verify cache_creation_input_tokens > 0 on first call and cache_read_input_tokens > 0 on subsequent.

Verification:
- Anthropic dashboard or `usage` field on the response — cache hit metrics surfaced as `summary.cacheHitTokens`.

### Phase C — Tier 3.1 (merge damage + calc) — ~1 day, only if budget targets demand
6. Extend `damage-analyzer` schema with calc fields. Aggregate at pipeline level instead of separate Sonnet call.

### Out of scope (not recommended)
- Two-stage Haiku→Sonnet damage triage (Tier 3.2).
- Switching to Batch API (synchronous user flow, not fit).

---

## 7. Quality safeguards

To prove "no quality loss" claims:
- **Snapshot test**: lock the existing 12-photo Audi A6 results as the gold standard. After each phase, re-run and diff vehicle/condition/markers fields. Any regression on a non-trivial field blocks the change.
- **Manual review**: spot-check the German PDF after Phase A and Phase B. Any visible degradation = roll back.
- **Token-counter sanity check**: use Anthropic's [token-counting endpoint](https://platform.claude.com/docs/en/build-with-claude/token-counting) once before Phase A so the formula assumptions are verified for this account.

---

## 8. What NOT to do

- Don't reduce damage / plate / VIN / document / tire variants below 1568 px. The OCR-style tasks need that resolution; "saving" 0.5¢ per call by under-sizing them gives back inaccuracy that costs the user a real assessment.
- Don't collapse the 1-hour cache TTL. Reports often get re-Generated within an hour while the user fills the rest of the form.
- Don't migrate everything to Haiku to save money. Sonnet on damage analysis is a defining quality moat — Haiku misses subtle cracks and fails on complex repair recommendations.
- Don't compress JPEG below ~80% quality. Visible artifacts make AI judgements noisier even when token cost is identical.

---

## 9. Open questions for verification

1. **Confirm token cost at 1568 px boundary.** Anthropic docs reference a "max 1568 image tokens" for non-Opus models. Need a one-off call to the token-count endpoint with a 1568×1176 JPEG to confirm whether actual billing is the formula's 2459 or capped at 1568. Affects exact numbers above by a factor of 1.5×.
2. **Cache_control TTL on production.** Confirm the `1h` TTL is currently allowed on the user's account/tier (some account types only allow 5m).
3. **Batch API**: still off the table for live Generate, but worth keeping in mind for any future "bulk re-process all reports" admin tool.

---

## 10. Recommended execution order

If the user approves: **Phase A → measure → Phase B → measure**. Tier 3 only if the post-A+B numbers don't hit target.

Total engineering time: **~1 day for Phases A+B**, ~1 more day for Phase C.
Expected cost reduction: **65–75%** at the same quality.

Pending approval to start with Phase A.
