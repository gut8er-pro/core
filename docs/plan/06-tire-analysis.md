# Feature 06: Tire Photo Analysis

## Summary

Extract tire information from close-up tire photos using AI vision. Auto-fill the Tires section in the Condition tab with brand, size, tread depth, and condition.

## Figma Reference

- Condition tab (`4104:620`): Tires section with "First Set of Tires" / "Second Set of Tires" tabs
- Tire fields: VL/VR/HL/HR positions, tire size, profile level, manufacturer

## AI Model

**Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — sufficient for reading tire markings.

## File

`src/lib/ai/tire-analyzer.ts`

## Types

```typescript
type TireAnalysisInput = {
  photoId: string
  imageBase64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  vehiclePosition: VehiclePosition  // from classifier: wheel-fl, wheel-fr, wheel-rl, wheel-rr
}

type TireAnalysisResult = {
  photoId: string
  manufacturer: string         // e.g., "Continental", "Michelin", "Pirelli"
  size: string                 // e.g., "205/55 R16 91V"
  treadDepth?: number          // estimated mm remaining (if visible)
  profileLevel: 'good' | 'acceptable' | 'worn' | 'critical'
  condition: string            // e.g., "Good condition, even wear pattern"
  usability: 1 | 2 | 3        // 1=good, 2=acceptable, 3=worn/replace
  tireType?: string            // "summer" | "winter" | "all-season"
  dotCode?: string             // DOT manufacturing date code if visible
  position: 'VL' | 'VR' | 'HL' | 'HR'  // mapped from vehiclePosition
  confidence: number
}
```

## Position Mapping

The classifier provides `vehiclePosition` which maps to tire positions:

```typescript
function mapWheelPosition(position: VehiclePosition): 'VL' | 'VR' | 'HL' | 'HR' | null {
  switch (position) {
    case 'wheel-fl': return 'VL'  // Vorne Links
    case 'wheel-fr': return 'VR'  // Vorne Rechts
    case 'wheel-rl': return 'HL'  // Hinten Links
    case 'wheel-rr': return 'HR'  // Hinten Rechts
    default: return null  // Unknown position — AI will try to determine
  }
}
```

## Prompt

```
Analyze this tire photo from a vehicle assessment. Extract as much information as visible.

The photo appears to be from position: {vehiclePosition}

Extract:
1. manufacturer: Tire brand name (e.g., "Continental", "Michelin", "Goodyear", "Pirelli", "Bridgestone", "Hankook", "Dunlop")
2. size: Full tire size marking (e.g., "205/55 R16 91V"). Look for numbers on the sidewall.
3. treadDepth: Estimated remaining tread depth in mm if you can judge from the photo (2-8mm range typically)
4. profileLevel: "good" (>4mm, plenty of tread), "acceptable" (2-4mm), "worn" (<2mm, near limit), "critical" (at or below legal limit 1.6mm)
5. condition: Brief condition description (wear pattern, any visible damage, cracking, bulges)
6. usability: 1 (good, safe to use), 2 (acceptable, monitor), 3 (worn, should replace)
7. tireType: "summer", "winter" (look for M+S or snowflake symbol), or "all-season" (M+S + snowflake)
8. dotCode: The DOT manufacturing code if visible (4 digits, e.g., "2419" = week 24 of 2019)
9. position: Best guess of which wheel position this is: "VL" (front-left), "VR" (front-right), "HL" (rear-left), "HR" (rear-right). Use the photo context clues.
10. confidence: 0.0-1.0 how much information you could reliably extract

Return ONLY valid JSON. Use null for fields you cannot determine.
```

## Auto-Fill to Condition API

```typescript
async function autoFillTireData(
  reportId: string,
  tireResults: TireAnalysisResult[],
): Promise<void> {
  // Group by set (first 4 tires = set 1, next 4 = set 2)
  const tires = tireResults.map((r) => ({
    position: r.position,
    size: r.size,
    profileLevel: r.treadDepth ? `${r.treadDepth}mm` : r.profileLevel,
    manufacturer: r.manufacturer,
    usability: r.usability,
  }))

  await fetch(`/api/reports/${reportId}/condition`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tireSets: [{
        setNumber: 1,
        matchAndAlloy: false,
        tires,
      }],
    }),
  })
}
```

## Edge Cases

- **Cannot read markings**: Return what's visible; `confidence` will be low
- **Multiple tires in one photo**: Focus on the most prominent tire
- **No wheel position from classifier**: AI tries to determine from photo context (visible car body, angle)
- **Winter vs summer**: Look for snowflake/M+S markings on sidewall
- **DOT code**: Often partially obscured; extract what's visible
