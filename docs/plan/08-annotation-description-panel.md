# Feature 08: Annotation Description Panel

## Summary

Add a right-side panel to the annotation/draw modal showing the AI-generated description for the current photo. This matches the Figma design which shows a "Description" panel with detailed damage text.

## Figma Reference

- Draw modal (`4104:2564`):
  - Full-screen modal with photo taking ~70% width
  - Right panel (~30%) with:
    - "Description" heading
    - AI-generated text (2 paragraphs of damage description)
    - Green edit button (pencil icon) in top-right corner of panel
  - Bottom toolbar: Pen, Crop, Circle, Rectangle, Arrow, Delete
  - Color palette (3 rows of colors)
  - Photo filename + date in top-left
  - Left/Right navigation arrows on photo
  - Close (X) button top-right

- Document modal (`4104:2781`):
  - Same layout but for registration document
  - Green highlights on extracted fields (NB5CA000M500, DOKKER, DACIA, etc.)
  - Green checkmark icon on edit button (indicating data was extracted)

## Current Implementation

The `AnnotationModal` (`src/components/report/gallery/annotation-modal.tsx`) currently:
- Full-screen modal with photo + canvas
- Toolbar at bottom (pen, crop, circle, rectangle, arrow, delete)
- Color palette
- NO description panel

## Changes Required

### 1. Update Annotation Modal Layout

**Current layout**:
```
[Modal: fullscreen]
  [Header: filename + cancel/save]
  [Toolbar]
  [Canvas: 100% width]
```

**New layout (matching Figma)**:
```
[Modal: fullscreen]
  [Header: filename + date | ......................... | X close button]
  [Left: photo canvas (~70%) with left/right arrows]
  [Right: Description panel (~30%)]
  [Bottom: toolbar + color palette]
```

### 2. New Component: `annotation-description.tsx`

```typescript
type AnnotationDescriptionProps = {
  description: string | null       // AI-generated description
  photoType: string | null         // 'damage', 'document', 'vin', etc.
  onEdit: (newDescription: string) => void
  className?: string
}
```

**For damage photos**: Shows the full damage analysis text from `photo.aiDescription`

**For document photos**: Shows extracted fields with green highlighting

**For VIN/plate photos**: Shows detected value

**For other photos**: Shows generic description or empty state

### 3. Description Panel UI

```tsx
<div className="flex w-[300px] shrink-0 flex-col border-l border-border bg-white p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-h4 font-semibold text-black">Description</h3>
    <button
      onClick={handleEdit}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark"
    >
      <Pencil className="h-4 w-4" />
    </button>
  </div>

  {description ? (
    <div className="text-body-sm text-black leading-relaxed whitespace-pre-wrap">
      {description}
    </div>
  ) : (
    <p className="text-body-sm text-grey-100 italic">
      No AI description available. Run "Generate Report" to analyze this photo.
    </p>
  )}
</div>
```

### 4. Auto-Annotation (Bounding Boxes)

When a damage photo has bounding boxes from the AI pipeline:
1. On modal open, check if photo has AI bounding box annotations
2. Render them as Fabric.js rectangles on the canvas
3. Rectangles are green-stroked (matching Figma design showing green bounding box)
4. User can move, resize, or delete them
5. User can add their own manual annotations on top

```typescript
// In annotation-canvas.tsx, add function to render AI bounding boxes:
function renderAiBoundingBoxes(
  canvas: fabric.Canvas,
  boundingBoxes: BoundingBox[],
  canvasWidth: number,
  canvasHeight: number,
) {
  for (const box of boundingBoxes) {
    const rect = new fabric.Rect({
      left: box.x * canvasWidth,
      top: box.y * canvasHeight,
      width: box.width * canvasWidth,
      height: box.height * canvasHeight,
      fill: 'transparent',
      stroke: '#16A34A',     // Primary green
      strokeWidth: 3,
      strokeDashArray: [8, 4],  // Dashed line
      selectable: true,
      hasControls: true,
    })
    canvas.add(rect)
  }
}
```

### 5. Document Photo Highlighting

For document photos (Zulassungsbescheinigung), the Figma shows green highlights on extracted fields. This is done by the bounding boxes — the OCR route should also return bounding boxes for extracted text fields.

### 6. Photo Navigation

The Figma shows left/right arrow buttons on the photo to navigate between photos without closing the modal:

```typescript
// Add to AnnotationModal:
type AnnotationModalProps = {
  photo: Photo | null
  photos: Photo[]           // all photos for navigation
  open: boolean
  onClose: () => void
  onSave?: (fabricJson: Record<string, unknown>) => void
  onNavigate?: (photoId: string) => void  // navigate to another photo
}
```

### 7. Header Update

Replace modal title with Figma-matching header:
```
[Photo icon] Photo.jpg
01.05.2026 - 11:32am                                    [X]
```

## Files Modified

```
src/components/report/gallery/annotation-modal.tsx    — Layout overhaul
src/components/report/gallery/annotation-description.tsx  — NEW: Description panel
src/components/report/gallery/annotation-canvas.tsx   — Add AI bounding box rendering
```
