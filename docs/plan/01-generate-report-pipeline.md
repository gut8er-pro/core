# Feature 01: Generate Report Pipeline

## Summary

Single API endpoint `POST /api/reports/:id/generate` that orchestrates the entire AI pipeline. Uses Server-Sent Events (SSE) for real-time progress streaming to the client.

## Figma Reference

- Gallery V1 (`4104:2421`): Green "Generate Report" button top-right
- Gallery after AI (`4104:2929`): Title changes to "Create New Report", photos reordered

## Files to Create

```
src/app/api/reports/[id]/generate/route.ts    — SSE endpoint
src/lib/ai/pipeline.ts                        — Pipeline orchestrator
src/lib/ai/classifier.ts                      — Photo classification (Feature 02)
src/lib/ai/damage-analyzer.ts                 — Damage analysis (Feature 03)
src/lib/ai/overview-analyzer.ts               — Overview photo analysis
src/lib/ai/tire-analyzer.ts                   — Tire analysis (Feature 06)
src/lib/ai/interior-analyzer.ts               — Interior photo analysis
src/lib/ai/vehicle-lookup.ts                  — VIN/plate lookup (Feature 04)
src/lib/ai/diagram-mapper.ts                  — Damage-to-diagram mapping (Feature 05)
src/lib/ai/types.ts                           — Shared AI pipeline types
src/hooks/use-generate-report.ts              — Client-side SSE hook
```

## API Design

### Request
```
POST /api/reports/:id/generate
Authorization: Bearer token (via Supabase cookie)
```

No request body needed — the endpoint fetches all photos for the report from the database.

### Response (SSE stream)

```typescript
// Each SSE event has this shape:
type GenerateEvent =
  | { type: 'progress'; step: string; current: number; total: number; message: string }
  | { type: 'photo_classified'; photoId: string; classification: PhotoClassification }
  | { type: 'photo_processed'; photoId: string; result: PhotoProcessingResult }
  | { type: 'auto_fill'; section: string; fields: string[] }
  | { type: 'complete'; summary: GenerationSummary }
  | { type: 'error'; message: string }
```

### GenerationSummary
```typescript
type GenerationSummary = {
  photosProcessed: number
  classifications: Record<string, number>  // e.g., { damage: 3, vin: 1, plate: 1 }
  autoFilledFields: {
    vehicle: string[]      // ["vin", "manufacturer", "powerKw", ...]
    accident: string[]     // ["claimantLicensePlate"]
    condition: string[]    // ["damageMarkers", "tireSet1"]
  }
  totalFieldsFilled: number
  damageMarkersPlaced: number
  warnings: string[]      // ["Multiple VINs detected — using first match"]
  photoOrder: string[]    // reordered photo IDs
}
```

## Pipeline Steps

### Step 1: Fetch & Classify (parallel)
1. Fetch all photos for the report from DB
2. For each photo, fetch the `aiUrl` (or `url`) as base64
3. Send ALL photos to classifier in parallel (Haiku 4.5)
4. Emit `photo_classified` event for each

### Step 2: Route & Process (parallel by type)
Group photos by classification, then process each group in parallel:
- `damage` photos → `damage-analyzer.ts` (Sonnet 4.5)
- `vin` photos → existing `detect-vin` logic (Haiku 4.5)
- `plate` photos → existing `detect-plate` logic (Haiku 4.5)
- `document` photos → existing `ocr` logic (Sonnet 4.5)
- `overview` photos → `overview-analyzer.ts` (Sonnet 4.5)
- `tire` photos → `tire-analyzer.ts` (Haiku 4.5)
- `interior` photos → `interior-analyzer.ts` (Haiku 4.5)

Emit `photo_processed` event for each completed photo.

### Step 3: Vehicle Lookup (if VIN or plate detected)
If VIN or plate was extracted:
1. Call vehicle lookup API to get full vehicle specs
2. Merge with any OCR data from registration document
3. Resolve conflicts (prefer OCR for dates, lookup for specs)

### Step 4: Auto-Fill Report Sections
Write all extracted data to the database:
- Vehicle tab: VIN, manufacturer, model, specs, registration dates
- Accident Info: license plate → claimant section
- Condition tab: damage markers on SVG diagram, tire data
- Photos: AI descriptions, bounding box annotations, reordered

Emit `auto_fill` events for each section filled.

### Step 5: Complete
Emit `complete` event with full summary.

## Error Handling

- If a single photo fails, log the error and continue with remaining photos
- If classifier fails for a photo, mark it as `other` and skip processing
- If vehicle lookup fails, still use VIN/plate text but log warning
- If the entire pipeline fails, emit `error` event and clean up partial state
- Timeout: 120s max for the entire pipeline (generous for ~10 photos)

## Concurrency

- Classify all photos in parallel (Promise.allSettled)
- Process each type group in parallel
- Within damage photos, process max 3 at a time to avoid rate limits
- Use AbortController to cancel remaining work if client disconnects

## Caching

- Reuse existing `src/lib/ai/cache.ts` for per-photo caching
- Cache key: `generate:${photoId}:${operation}`
- If a photo was already processed (e.g., user ran Generate twice), skip it and use cached result

## Implementation Order

1. Create `src/lib/ai/types.ts` with all shared types
2. Create `src/lib/ai/classifier.ts` (Feature 02)
3. Create `src/lib/ai/damage-analyzer.ts` (Feature 03)
4. Create `src/lib/ai/overview-analyzer.ts`
5. Create `src/lib/ai/tire-analyzer.ts` (Feature 06)
6. Create `src/lib/ai/interior-analyzer.ts`
7. Create `src/lib/ai/pipeline.ts` (orchestrator)
8. Create `src/app/api/reports/[id]/generate/route.ts` (SSE endpoint)
9. Create `src/hooks/use-generate-report.ts` (client hook)
