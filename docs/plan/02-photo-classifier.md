# Feature 02: Photo Classifier

## Summary

Fast classification of each uploaded photo into one of 8 categories using Claude Haiku 4.5. Also determines vehicle position and suggested photo order.

## AI Model

**Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — fast, cheap, good enough for classification.

## File

`src/lib/ai/classifier.ts`

## Input/Output

```typescript
type ClassificationInput = {
  photoId: string
  imageBase64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
}

type ClassificationResult = {
  photoId: string
  type: 'damage' | 'vin' | 'plate' | 'document' | 'overview' | 'tire' | 'interior' | 'other'
  confidence: number           // 0.0 - 1.0
  position: VehiclePosition    // where on the car
  suggestedOrder: number       // 1-20 for logical ordering
  damageLocation?: string      // only for damage photos: "rear-left bumper", "front hood", etc.
}

type VehiclePosition =
  | 'front-left' | 'front' | 'front-right'
  | 'left' | 'right'
  | 'rear-left' | 'rear' | 'rear-right'
  | 'top' | 'interior' | 'engine'
  | 'wheel-fl' | 'wheel-fr' | 'wheel-rl' | 'wheel-rr'
  | 'undercarriage' | 'other'
```

## Prompt

```
You are a vehicle assessment photo classifier. Classify this photo into exactly one category.

Categories:
- "damage": Shows vehicle damage (dents, scratches, cracks, broken parts, deformation, paint damage)
- "vin": Shows a VIN plate, VIN sticker, or VIN number visible on the vehicle
- "plate": Shows the vehicle's license plate (Kennzeichen)
- "document": Shows a vehicle registration document (Zulassungsbescheinigung), insurance papers, or inspection certificate
- "overview": General vehicle photo showing the full car body or significant portion (undamaged areas)
- "tire": Close-up of a tire, wheel, or rim showing tread pattern, brand, or size markings
- "interior": Interior of the vehicle (dashboard, seats, steering wheel, trunk/boot space)
- "other": Cannot be classified into any above category

Also determine:
1. position: Where on the vehicle this photo was taken from. Use one of: front-left, front, front-right, left, right, rear-left, rear, rear-right, top, interior, engine, wheel-fl, wheel-fr, wheel-rl, wheel-rr, undercarriage, other
2. suggestedOrder: A number 1-20 for the logical ordering in a professional report:
   - 1: front-left diagonal (3/4 view)
   - 2: front straight
   - 3: front-right diagonal
   - 4: right side
   - 5: rear-right diagonal
   - 6: rear straight
   - 7: rear-left diagonal
   - 8: left side
   - 9-12: damage close-ups (ordered by severity, front-to-back)
   - 13-14: interior shots
   - 15: engine bay
   - 16-17: tire/wheel photos
   - 18: VIN plate
   - 19: license plate
   - 20: registration document
3. confidence: 0.0 to 1.0 how certain you are about the classification
4. damageLocation (only if type is "damage"): Brief description of where on the car the damage is, e.g. "rear-left quarter panel", "front bumper", "right door"

Return ONLY valid JSON:
{"type": "...", "position": "...", "suggestedOrder": N, "confidence": 0.X, "damageLocation": "...or null"}
```

## Photo Ordering Logic

After classification, photos are reordered by `suggestedOrder`:

| Order | Position | Description |
|-------|----------|-------------|
| 1 | front-left | Front-left diagonal (3/4 view) |
| 2 | front | Front straight |
| 3 | front-right | Front-right diagonal |
| 4 | right | Right side |
| 5 | rear-right | Rear-right diagonal |
| 6 | rear | Rear straight |
| 7 | rear-left | Rear-left diagonal |
| 8 | left | Left side |
| 9-12 | damage | Damage close-up photos |
| 13-14 | interior | Interior shots |
| 15 | engine | Engine bay |
| 16-17 | wheel/tire | Tire/wheel photos |
| 18 | vin | VIN plate |
| 19 | plate | License plate |
| 20 | document | Registration documents |

## Suggested Photos Tracking

After classification, update the instruction sidebar with fulfilled categories:

```typescript
type SuggestedPhotoStatus = {
  vehicleDiagonals: { fulfilled: number; total: 4 }  // front-left, front-right, rear-left, rear-right
  damageOverview: { fulfilled: number; total: number } // unknown total
  documentShot: { fulfilled: number; total: 1 }
  vinShot: { fulfilled: number; total: 1 }
  plateShot: { fulfilled: number; total: 1 }
  tireShots: { fulfilled: number; total: 4 }           // FL, FR, RL, RR
}
```

This matches the Figma design which shows 3 suggested photo groups:
- **Vehicle Diagonals** — "Front and rear diagonal photos of the vehicle"
- **Damage Overview** — "Detailed close-ups of all damaged areas"
- **Document Shot** — "Photos of all relevant vehicle documents"
