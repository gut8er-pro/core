# Feature 05: Damage-to-Diagram Mapping

## Summary

Automatically place damage markers on the top-down car SVG diagram based on AI-detected damage locations. Users can then move, edit, or delete the auto-placed markers.

## Figma Reference

- Damage diagram (`4104:460`): SVG car with numbered dark circle markers
- Damage with comments (`4104:502`): Marker tooltips showing damage descriptions
- Condition tab (`4104:620`): Full condition page with "Manual Setup" toggle and "Add Marker" button

## How It Works

1. During the Generate Report pipeline, each damage photo gets analyzed by `damage-analyzer.ts`
2. The analyzer returns a `diagramPosition: { x, y, comment }` for each damage photo
3. The pipeline collects all diagram positions and writes them as `DamageMarkerData` to the condition API
4. The frontend displays these markers on the SVG diagram
5. Users can drag markers to adjust position, edit comments, or delete them

## SVG Coordinate System

The existing `VehicleDiagram` component uses:
- **viewBox**: `0 0 400 200` (width 400, height 200)
- **Markers**: percentage-based coordinates `(x: 0-100, y: 0-100)`
- **Conversion**: `svgX = (x / 100) * 400`, `svgY = (y / 100) * 200`

The car is drawn top-down (bird's eye view):
- `y=0` → front of car
- `y=100` → rear of car
- `x=0` → left side (driver's side in EU)
- `x=100` → right side (passenger side in EU)

## Position Mapping Reference

This table maps common damage locations to approximate SVG coordinates:

| Damage Location | x | y | Notes |
|----------------|---|---|-------|
| Front bumper center | 50 | 5 | Very front |
| Front bumper left | 30 | 8 | |
| Front bumper right | 70 | 8 | |
| Front-left headlight | 25 | 10 | |
| Front-right headlight | 75 | 10 | |
| Hood center | 50 | 18 | |
| Hood left | 35 | 18 | |
| Hood right | 65 | 18 | |
| Front-left fender | 15 | 20 | |
| Front-right fender | 85 | 20 | |
| Left front door | 12 | 35 | |
| Right front door | 88 | 35 | |
| Left rear door | 12 | 55 | |
| Right rear door | 88 | 55 | |
| Left side mirror | 10 | 30 | |
| Right side mirror | 90 | 30 | |
| Roof center | 50 | 40 | |
| Left rear quarter panel | 15 | 70 | |
| Right rear quarter panel | 85 | 70 | |
| Rear bumper center | 50 | 95 | |
| Rear bumper left | 30 | 92 | |
| Rear bumper right | 70 | 92 | |
| Left taillight | 25 | 88 | |
| Right taillight | 75 | 88 | |
| Trunk/boot lid | 50 | 85 | |
| Left A-pillar | 18 | 25 | |
| Right A-pillar | 82 | 25 | |
| Left B-pillar | 15 | 45 | |
| Right B-pillar | 85 | 45 | |
| Left C-pillar | 18 | 65 | |
| Right C-pillar | 82 | 65 | |
| Windshield | 50 | 25 | |
| Rear window | 50 | 75 | |
| Undercarriage front | 50 | 15 | |
| Undercarriage rear | 50 | 85 | |

## AI Prompt Enhancement

The damage analyzer prompt (Feature 03) already includes `diagramPosition`. The key instruction is:

```
diagramPosition: Where to place a damage marker on a top-down car diagram.
The diagram shows the car from above (bird's eye view).
- x: 0 = left side of car, 100 = right side. Center = 50.
- y: 0 = front of car, 100 = rear of car.
- Examples:
  - Front bumper center: {x: 50, y: 5}
  - Left front door: {x: 12, y: 35}
  - Right rear quarter panel: {x: 85, y: 70}
  - Rear bumper: {x: 50, y: 95}
```

## De-duplication

If multiple damage photos show the same area (e.g., two photos of the rear bumper), we need to avoid placing duplicate markers:

```typescript
function deduplicateMarkers(
  markers: DiagramPosition[],
  proximityThreshold: number = 10,  // percentage points
): DiagramPosition[] {
  const result: DiagramPosition[] = []

  for (const marker of markers) {
    const isDuplicate = result.some(
      (existing) =>
        Math.abs(existing.x - marker.x) < proximityThreshold &&
        Math.abs(existing.y - marker.y) < proximityThreshold,
    )

    if (!isDuplicate) {
      result.push(marker)
    } else {
      // Merge: append the comment to the existing nearby marker
      const nearby = result.find(
        (existing) =>
          Math.abs(existing.x - marker.x) < proximityThreshold &&
          Math.abs(existing.y - marker.y) < proximityThreshold,
      )
      if (nearby && marker.comment) {
        nearby.comment += `; ${marker.comment}`
      }
    }
  }

  return result
}
```

## Auto-Fill to Condition API

```typescript
// After collecting all damage markers from the pipeline:
async function autoFillDamageMarkers(
  reportId: string,
  markers: DiagramPosition[],
): Promise<void> {
  const deduplicated = deduplicateMarkers(markers)

  // Convert to DamageMarkerData format
  const damageMarkers = deduplicated.map((pos) => ({
    id: crypto.randomUUID(),
    x: pos.x,
    y: pos.y,
    comment: pos.comment,
  }))

  await fetch(`/api/reports/${reportId}/condition`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      damageMarkers,
      // Keep manualSetup as true so user can edit
      manualSetup: true,
    }),
  })
}
```

## User Interaction

After auto-placement:
1. Green markers (AI-placed) appear on the diagram with numbered labels
2. User can click a marker to see/edit the AI-generated comment
3. User can drag a marker to adjust its position
4. User can delete markers that are incorrect
5. User can still click the diagram to add new manual markers
6. "Manual Setup" toggle is ON by default when AI has placed markers

## Edge Cases

- **No damage detected**: No markers placed, user adds manually
- **Damage not locatable**: If AI can't determine position (e.g., extreme close-up), skip diagram placement but still save the photo description
- **Multiple damages in one photo**: Create one marker per damage area (the analyzer's `diagramPosition` represents the primary damage area)
- **Interior damage**: Don't place on the exterior diagram (interior condition goes to notes)
