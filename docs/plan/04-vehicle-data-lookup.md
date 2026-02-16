# Feature 04: Vehicle Data Lookup

## Summary

After extracting a VIN or license plate from photos, automatically look up full vehicle specifications from external APIs. This dramatically reduces manual data entry on the Vehicle tab.

## Data Sources

### Option A: NHTSA VIN Decoder (Free, US + International)
- **URL**: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{VIN}?format=json`
- **Cost**: Free, no API key needed
- **Coverage**: Good for international manufacturers, limited for EU-specific data
- **Returns**: Make, model, year, body class, engine, cylinders, displacement, fuel type, doors, GVWR, plant info

### Option B: VIN Decoding via AI (Fallback)
- Use Claude to decode the VIN structure itself
- VIN positions 1-3: World Manufacturer Identifier (WMI)
- Position 4-8: Vehicle attributes (model, engine, body)
- Position 9: Check digit
- Position 10: Model year
- Position 11: Plant code
- Positions 12-17: Sequential number

### Option C: German Plate Lookup (Kennzeichen)
- German plates follow pattern: `XX YY 1234` (city code + letters + numbers)
- The city code tells you the registration district
- No free public API for German plate-to-vehicle lookup
- **Approach**: Use the plate to identify the region, but rely on VIN or OCR for vehicle data

## Recommended Approach

1. **Primary**: NHTSA VIN Decoder (free, reliable for most VINs)
2. **Fallback**: AI-based VIN structure decoding
3. **Enhancement**: Merge with OCR data from registration document for German-specific fields

## File

`src/lib/ai/vehicle-lookup.ts`

## Types

```typescript
type VehicleLookupInput = {
  vin?: string
  plate?: string
}

type VehicleLookupResult = {
  source: 'nhtsa' | 'ai-decode' | 'none'

  // Vehicle identification
  vin?: string
  manufacturer?: string        // e.g., "Volkswagen"
  make?: string               // e.g., "Volkswagen AG"
  model?: string              // e.g., "Golf"
  modelYear?: number          // e.g., 2019
  subType?: string            // e.g., "Golf VII 2.0 TDI"

  // Specifications
  bodyType?: string           // e.g., "Hatchback", "Sedan", "SUV"
  engineDesign?: string       // e.g., "Inline"
  engineDisplacement?: number // in ccm, e.g., 1968
  cylinders?: number          // e.g., 4
  powerKw?: number            // if available
  fuelType?: string           // e.g., "Diesel", "Benzin"
  transmission?: string       // e.g., "Manual", "Automatic"

  // Vehicle details
  doors?: number
  seats?: number
  driveType?: string          // e.g., "FWD", "AWD", "RWD"

  // Registration info
  plantCountry?: string
  plantCity?: string

  // Confidence
  confidence: number          // 0-1 how complete the data is
  warnings: string[]          // e.g., "Model year decoded from VIN position 10"
}
```

## NHTSA API Integration

```typescript
async function lookupVinNHTSA(vin: string): Promise<VehicleLookupResult> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
  const response = await fetch(url)
  if (!response.ok) throw new Error('NHTSA API request failed')

  const data = await response.json()
  const result = data.Results?.[0]
  if (!result) throw new Error('No results from NHTSA')

  return {
    source: 'nhtsa',
    vin,
    manufacturer: result.Make || undefined,
    make: result.Manufacturer || undefined,
    model: result.Model || undefined,
    modelYear: result.ModelYear ? parseInt(result.ModelYear) : undefined,
    bodyType: result.BodyClass || undefined,
    engineDisplacement: result.DisplacementCC ? parseFloat(result.DisplacementCC) : undefined,
    cylinders: result.EngineCylinders ? parseInt(result.EngineCylinders) : undefined,
    powerKw: result.EngineKW ? parseFloat(result.EngineKW) : undefined,
    fuelType: result.FuelTypePrimary || undefined,
    transmission: result.TransmissionStyle || undefined,
    doors: result.Doors ? parseInt(result.Doors) : undefined,
    seats: result.Seats ? parseInt(result.Seats) : undefined,
    driveType: result.DriveType || undefined,
    plantCountry: result.PlantCountry || undefined,
    plantCity: result.PlantCity || undefined,
    confidence: calculateConfidence(result),
    warnings: [],
  }
}
```

## AI VIN Decode (Fallback)

```typescript
async function decodeVinWithAI(vin: string): Promise<VehicleLookupResult> {
  // Use Haiku 4.5 to decode VIN structure
  const prompt = `Decode this VIN: ${vin}

  VIN structure:
  - Positions 1-3 (WMI): World Manufacturer Identifier
  - Positions 4-8: Vehicle attributes
  - Position 9: Check digit
  - Position 10: Model year code
  - Position 11: Assembly plant
  - Positions 12-17: Production sequence

  Return JSON with: manufacturer, model, modelYear, bodyType, engineType, plantCountry
  Use your knowledge of WMI codes and VIN encoding standards.`

  // ... call Claude Haiku 4.5 and parse result
}
```

## Data Merge Logic

When we have data from multiple sources (VIN lookup, OCR, plate), merge intelligently:

```typescript
function mergeVehicleData(
  lookup: VehicleLookupResult | null,
  ocr: OcrResult | null,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {}

  // VIN: prefer OCR (direct from document) over lookup
  merged.vin = ocr?.vin || lookup?.vin

  // Manufacturer: prefer lookup (standardized) over OCR
  merged.manufacturer = lookup?.manufacturer || ocr?.manufacturer

  // Model/subtype
  merged.mainType = lookup?.model || ocr?.model
  merged.subType = lookup?.subType

  // Specs: prefer lookup for technical data
  merged.powerKw = lookup?.powerKw || (ocr?.power ? parseInt(ocr.power) : undefined)
  merged.cylinders = lookup?.cylinders
  merged.displacement = lookup?.engineDisplacement ||
    (ocr?.engineDisplacement ? parseInt(ocr.engineDisplacement) : undefined)
  merged.engineDesign = lookup?.engineDesign
  merged.transmission = lookup?.transmission

  // Registration dates: only from OCR (not in VIN lookup)
  if (ocr?.firstRegistration) {
    merged.firstRegistration = ocr.firstRegistration
  }

  // Vehicle details
  merged.doors = lookup?.doors
  merged.seats = lookup?.seats

  // License plate: only from plate detection or OCR
  // (handled separately in accident-info auto-fill)

  return merged
}
```

## Auto-Fill Mapping

| Source Field | Target | Tab |
|-------------|--------|-----|
| VIN | `vehicleInfo.vin` | Vehicle |
| Manufacturer | `vehicleInfo.manufacturer` | Vehicle |
| Model | `vehicleInfo.mainType` | Vehicle |
| Subtype | `vehicleInfo.subType` | Vehicle |
| Power (kW) | `vehicleInfo.powerKw` + auto-calc HP | Vehicle |
| Cylinders | `vehicleInfo.cylinders` | Vehicle |
| Displacement | `vehicleInfo.displacement` | Vehicle |
| Engine design | `vehicleInfo.engineDesign` | Vehicle |
| Transmission | `vehicleInfo.transmission` | Vehicle |
| Doors | `vehicleInfo.doors` | Vehicle |
| Seats | `vehicleInfo.seats` | Vehicle |
| Fuel type | `vehicleInfo.motorType` | Vehicle |
| First registration | `vehicleInfo.firstRegistration` | Vehicle |
| Body type | `vehicleInfo.vehicleType` | Vehicle |
| License plate | `accidentInfo.claimantInfo.licensePlate` | Accident Info |
