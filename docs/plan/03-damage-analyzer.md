# Feature 03: Damage Analyzer

## Summary

Deep analysis of damage photos using Claude Sonnet 4.5. Extracts detailed damage descriptions, severity, affected parts, repair approach, AND bounding box coordinates for auto-annotation on the photo AND damage location for placing markers on the car diagram SVG.

## AI Model

**Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`) — needed for detailed visual analysis.

## File

`src/lib/ai/damage-analyzer.ts`

## Input/Output

```typescript
type DamageAnalysisInput = {
  photoId: string
  imageBase64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  vehiclePosition: VehiclePosition  // from classifier
  damageLocation?: string           // from classifier
}

type DamageAnalysisResult = {
  photoId: string
  description: string              // Detailed damage description for the report
  severity: 'minor' | 'moderate' | 'severe'
  damageTypes: DamageType[]        // Array of damage types found
  affectedParts: string[]          // e.g., ["rear bumper", "taillight", "quarter panel"]
  repairApproach: string           // Suggested repair method
  estimatedRepairHours?: number    // Rough estimate if possible

  // For auto-annotation on the photo (Fabric.js bounding boxes)
  boundingBoxes: BoundingBox[]

  // For auto-placing markers on the car diagram SVG
  diagramPosition: DiagramPosition
}

type DamageType =
  | 'dent' | 'scratch' | 'crack' | 'deformation'
  | 'paint_damage' | 'broken_part' | 'corrosion'
  | 'glass_damage' | 'plastic_damage' | 'structural'

type BoundingBox = {
  x: number       // 0-1 normalized, top-left corner X
  y: number       // 0-1 normalized, top-left corner Y
  width: number   // 0-1 normalized width
  height: number  // 0-1 normalized height
  label: string   // e.g., "Dent on rear quarter panel"
  color: string   // suggested annotation color (e.g., "#FF0000" for severe)
}

type DiagramPosition = {
  // Where on the car diagram SVG (percentage-based 0-100)
  x: number        // 0-100 percentage on the SVG viewBox (400px wide)
  y: number        // 0-100 percentage on the SVG viewBox (200px tall)
  comment: string  // Short description for the marker tooltip
}
```

## Prompt

```
You are a professional German vehicle damage assessor (Kfz-Sachverständiger). Analyze this vehicle damage photo in detail.

The photo was taken from position: {vehiclePosition}
{damageLocation ? `Preliminary damage location: ${damageLocation}` : ''}

Provide a comprehensive analysis:

1. description: Write a detailed, professional damage description suitable for an insurance report (Gutachten). Be specific about damage location, extent, and type. Write 2-4 sentences.

2. severity: Rate as "minor" (cosmetic only, paint touch-up), "moderate" (requires body work/part replacement), or "severe" (structural damage, safety-critical)

3. damageTypes: Array of damage type codes found: "dent", "scratch", "crack", "deformation", "paint_damage", "broken_part", "corrosion", "glass_damage", "plastic_damage", "structural"

4. affectedParts: Array of specific car parts affected, e.g. ["rear bumper", "right taillight assembly", "rear quarter panel"]

5. repairApproach: Brief repair recommendation, e.g. "Bumper replacement, PDR on quarter panel, taillight assembly replacement"

6. estimatedRepairHours: Rough estimate of repair labor hours (number or null)

7. boundingBoxes: Array of bounding boxes around each visible damage area. Each box has:
   - x, y: top-left corner as 0.0-1.0 fraction of image width/height
   - width, height: as 0.0-1.0 fraction of image dimensions
   - label: short description of what this box highlights
   - color: "#FF0000" for severe, "#FF8C00" for moderate, "#FFD700" for minor

8. diagramPosition: Where to place a damage marker on a top-down car diagram (viewed from above):
   - The diagram is a top-down SVG of a car, 0-100 scale for both x and y
   - x=0 is the left edge of the car, x=100 is the right edge
   - y=0 is the front of the car, y=100 is the rear
   - Examples: front bumper center = {x: 50, y: 5}, rear-left quarter = {x: 25, y: 75}, right door = {x: 85, y: 50}
   - comment: short marker text for the tooltip

Return ONLY valid JSON matching this structure exactly.
```

## Bounding Box → Fabric.js Conversion

The bounding boxes (normalized 0-1 coordinates) need to be converted to Fabric.js rectangle objects:

```typescript
function boundingBoxToFabricRect(
  box: BoundingBox,
  canvasWidth: number,
  canvasHeight: number,
): fabric.Rect {
  return new fabric.Rect({
    left: box.x * canvasWidth,
    top: box.y * canvasHeight,
    width: box.width * canvasWidth,
    height: box.height * canvasHeight,
    fill: 'transparent',
    stroke: box.color,
    strokeWidth: 3,
    selectable: true,  // user can move/resize
    hasControls: true,
  })
}
```

## Diagram Position → Damage Marker

The `diagramPosition` maps directly to the existing `DamageMarkerData`:

```typescript
function diagramPositionToMarker(pos: DiagramPosition): DamageMarkerData {
  return {
    id: crypto.randomUUID(),
    x: pos.x,     // already 0-100 scale
    y: pos.y,     // already 0-100 scale
    comment: pos.comment,
  }
}
```

These markers are user-editable — the user can drag them to adjust position and edit comments.
