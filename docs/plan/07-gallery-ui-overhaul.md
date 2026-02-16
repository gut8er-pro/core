# Feature 07: Gallery UI Overhaul

## Summary

Overhaul the gallery page to match the Figma design exactly. Replace the manual AI toolbar with a single "Generate Report" button, add progress UI, photo classification badges, and update the instruction sidebar.

## Figma References

- Gallery V1 single view (`4104:2421`): "Upload Images" title, KG badge, green "Generate Report" button with sparkles icon, instruction sidebar with 3 suggested photo groups (Vehicle Diagonals, Damage Overview, Document Shot), filmstrip below photo
- Gallery V2 grid view (`4104:4174`): Same header, masonry 2-column grid, each photo has edit + delete overlays
- Gallery after AI (`4104:2929`): Title becomes "Create New Report", left sidebar becomes report navigation (Gallery, Report Details, Export & Send), photos reordered, filmstrip shows reordered thumbs

## Current vs Design Comparison

| Element | Current | Design (Figma) |
|---------|---------|----------------|
| Title | "Gallery" | "Upload Images" → "Create New Report" after AI |
| AI controls | 4 separate buttons (Analyze, VIN, Plate, Scan) | Single "Generate Report" green button |
| Badge | None | "KG" red badge next to title |
| View toggle | Single/Grid buttons | Not visible (always show based on photo count) |
| Instruction sidebar | Photo Tips + generic suggested photos | "Instruction" + "Suggested Photos" with 3 categories + thumbnails |
| Photo badges | None | Classification badges after AI processing |
| Progress | None | Button shows step progress during generation |

## Changes Required

### 1. Gallery Page (`src/app/(app)/reports/[id]/gallery/page.tsx`)

**Remove**:
- `AiToolbar` component and all its sub-components
- Manual AI button handlers (`handleAnalyze`, `handleDetectVin`, etc.)
- AI result state management (`aiResult`, `aiError`, `copySuccess`)
- Individual AI mutation hooks (`usePhotoAnalysis`, `useVinDetection`, etc.)
- `AiAnalyzeResultCard`, `AiVinResultCard`, `AiPlateResultCard`, `AiOcrResultCard`
- View mode toggle buttons (single/grid) — instead auto-detect based on UX

**Add**:
- "Generate Report" button in header (green, with sparkles icon)
- Generation progress overlay/modal
- Photo classification badges on each photo
- State management for generation status
- Title transition: "Upload Images" → "Create New Report"
- Import and use new `useGenerateReport` hook
- KG badge next to title

**Header layout** (matching Figma):
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <h1 className="text-h3 font-semibold text-black">
      {isGenerated ? 'Create New Report' : 'Upload Images'}
    </h1>
    <span className="rounded-sm bg-error px-1.5 py-0.5 text-caption font-bold text-white">
      KG
    </span>
  </div>
  <Button
    variant="primary"
    icon={<Sparkles className="h-4 w-4" />}
    onClick={handleGenerate}
    disabled={photos.length === 0 || isGenerating}
    loading={isGenerating}
  >
    Generate Report
  </Button>
</div>
```

### 2. Instruction Sidebar (`src/components/report/gallery/instruction-sidebar.tsx`)

**Redesign to match Figma** with:

```
Instruction
  ✅ Good lighting or use of flash
  ✅ JPG or PNG format
  ✅ Maximum 20 images

Suggested Photos
  [thumbnail] Vehicle Diagonals
              Front and rear diagonal photos of the vehicle
  [thumbnail] Damage Overview
              Detailed close-ups of all damaged areas
  [thumbnail] Document Shot
              Photos of all relevant vehicle documents
```

**Props update**:
```typescript
type InstructionSidebarProps = {
  className?: string
  photoClassifications?: Map<string, string>  // photoId -> classification
  photos?: Photo[]
}
```

After generation, show completion indicators:
- Green checkmark on fulfilled categories
- Count: "4/4", "3/?", "0/1"

### 3. New Components

#### `src/components/report/gallery/generate-progress.tsx`
Shows during generation:
- Overlay or inline progress bar
- Step description: "Classifying photos... (3/7)" → "Analyzing damage... (5/7)" → "Filling report..."
- Animated sparkles icon
- Cancel button

#### `src/components/report/gallery/photo-classification-badge.tsx`
Small badge overlay on each photo in grid/filmstrip:
```typescript
type ClassificationBadgeProps = {
  classification: string  // 'damage' | 'vin' | 'plate' | etc.
  className?: string
}
```

Badge colors:
- `damage` → red badge
- `vin` → blue badge
- `plate` → blue badge
- `document` → purple badge
- `overview` → green badge
- `tire` → orange badge
- `interior` → grey badge

### 4. Generation Hook (`src/hooks/use-generate-report.ts`)

```typescript
type GenerationStatus = {
  isGenerating: boolean
  step: string
  current: number
  total: number
  message: string
  results: GenerationSummary | null
  error: string | null
}

function useGenerateReport(reportId: string) {
  // SSE connection to /api/reports/:id/generate
  // Returns generation status and control functions
  return {
    status: GenerationStatus,
    generate: () => void,
    cancel: () => void,
  }
}
```

### 5. Photo Viewer Updates

After generation:
- Photos show classification badges in filmstrip
- Grid view shows badges on each photo card
- Photo order reflects AI-suggested sequence

### 6. Flow

**Before generation**:
1. Title: "Upload Images"
2. Sidebar: Instructions + Suggested Photos (empty state)
3. Header: "Generate Report" button (enabled when photos > 0)

**During generation**:
1. "Generate Report" button shows loading spinner + step text
2. Progress bar appears below header
3. Photos get classification badges as they're classified

**After generation**:
1. Title: "Create New Report"
2. Toast: "Report generated — {N} fields auto-filled"
3. Photos reordered by suggested order
4. Sidebar: Suggested photos show checkmarks
5. Each photo has a colored classification badge

## Deleted Code

The entire `AiToolbar` component (~400 lines) and its 4 result card sub-components will be removed from the gallery page. The individual AI route endpoints (`/api/ai/analyze-photo`, etc.) remain as they're reused by the pipeline internally.
