# Feature 09: Calculation Auto-Fill

## Summary

Add an "Upload Image to Auto-fill" button on the Calculation tab that uses AI to extract repair-relevant data from photos and auto-fill calculation fields.

## Figma Reference

- Calculation tab (`4104:2153`): Green "Upload Image to Auto-fill" button top-right
- Two-column layout: Vehicle Value (left) + Repair (right)
- Bottom: Loss of Use section

## Current Implementation

The Calculation page (`src/app/(app)/reports/[id]/details/calculation/page.tsx`) has:
- Two-column layout with Vehicle Value and Repair sections
- Loss of Use section at bottom
- DAT modal for external calculation
- No AI auto-fill button

## Changes Required

### 1. Add Auto-Fill Button

In the page header, add a green button matching the Figma design:

```tsx
<div className="flex items-center justify-between">
  <h1 className="text-h3 font-semibold text-black">Create New Report</h1>
  <Button
    variant="primary"
    onClick={handleAutoFill}
  >
    Upload Image to Auto-fill
  </Button>
</div>
```

### 2. Auto-Fill Flow

When clicked:
1. Open a photo selector (show existing gallery photos, or allow new upload)
2. Send selected photo(s) to AI for calculation-relevant extraction
3. Extract: damage class, repair method, estimated repair cost, affected body parts
4. Auto-fill the calculation form fields

### 3. AI Extraction

Use existing damage analysis results from the Generate Report pipeline. If available, use the already-extracted data. If not, run a new analysis.

```typescript
type CalculationAutoFillResult = {
  damageClass?: string           // e.g., "III" (German damage classification)
  repairMethod?: string          // e.g., "Conventional repair with body work"
  risks?: string                 // e.g., "Hidden structural damage possible"
  wheelAlignment?: string        // e.g., "Required" | "Not required"
  bodyMeasurements?: string      // e.g., "Required" | "Not required"
  bodyPaint?: string             // e.g., "Full repaint rear section"
  plasticRepair?: boolean
  estimatedRepairDays?: number
}
```

### 4. New API Route

`src/app/api/reports/[id]/calculation/auto-fill/route.ts`

```typescript
// POST /api/reports/:id/calculation/auto-fill
// Body: { photoIds: string[] }  — which photos to analyze for calculation data
// Returns: CalculationAutoFillResult
```

### 5. New Analyzer

`src/lib/ai/calculation-extractor.ts`

Uses Claude Sonnet 4.5 to analyze damage photos and extract calculation-relevant data.

## Prompt

```
You are a German vehicle damage assessor calculating repair costs. Analyze these damage photos and provide repair-relevant information.

Based on the visible damage, determine:
1. damageClass: German damage classification (I = minor cosmetic, II = moderate, III = significant, IV = severe structural). Use Roman numerals.
2. repairMethod: Recommended repair method (e.g., "Conventional body repair", "PDR (Paintless Dent Repair)", "Part replacement")
3. risks: Any repair risks or hidden damage concerns
4. wheelAlignment: "Required" or "Not required" based on damage location
5. bodyMeasurements: "Required" or "Not required" based on structural damage indicators
6. bodyPaint: Paint repair scope (e.g., "Spot repair", "Panel repaint", "Full section repaint")
7. plasticRepair: true if plastic parts need repair
8. estimatedRepairDays: Estimated repair duration in working days

Return ONLY valid JSON.
```

## Files

```
src/app/(app)/reports/[id]/details/calculation/page.tsx    — Add button
src/app/api/reports/[id]/calculation/auto-fill/route.ts    — NEW: API endpoint
src/lib/ai/calculation-extractor.ts                        — NEW: AI analyzer
```
