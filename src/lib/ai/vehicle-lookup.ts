// Vehicle data lookup — NHTSA (free) with AI VIN decode fallback for European vehicles.

import { getAnthropicClient } from './anthropic'
import type { VehicleLookupResult, OcrExtractionResult } from './types'

const NHTSA_API_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues'

const AI_VIN_PROMPT = `Decode this Vehicle Identification Number (VIN): {VIN}

Use your knowledge of VIN structure to extract vehicle information:
- Positions 1-3 (WMI): World Manufacturer Identifier
  Common European WMIs: WBA/WBS=BMW, WDD/WDC=Mercedes-Benz, WVW/WV1=Volkswagen, WAU/WUA=Audi, ZAR=Alfa Romeo, ZFF=Ferrari, W0L=Opel, VSS=SEAT, TMB=Skoda, YV1=Volvo, SAJ=Jaguar, SAL=Land Rover, WF0=Ford Europe, WDB=Mercedes
- Positions 4-8: Vehicle attributes (model, body, engine)
- Position 9: Check digit
- Position 10: Model year (A=2010..J=2018, K=2019, L=2020, M=2021, N=2022, P=2023, R=2024, S=2025)
- Position 11: Assembly plant
- Positions 12-17: Sequential number

Return JSON with:
1. "manufacturer": Full manufacturer name (e.g., "Volkswagen", "BMW", "Mercedes-Benz")
2. "make": Parent company if different from manufacturer
3. "model": Model name if determinable from VIN structure
4. "modelYear": Model year as number
5. "bodyType": Body type if determinable
6. "engineDesign": Engine type if determinable
7. "fuelType": Fuel type if determinable
8. "confidence": 0.0-1.0 how confident you are in the decode

Return ONLY valid JSON. Use null for fields you cannot determine.`

async function lookupVehicleByVin(vin: string): Promise<VehicleLookupResult> {
	// Try NHTSA first (free, works well for US/Asian vehicles)
	const nhtsaResult = await lookupViaNhtsa(vin)

	// If NHTSA returned good results, use them
	if (nhtsaResult.confidence >= 0.3) {
		return nhtsaResult
	}

	// Fall back to AI VIN decoding for European vehicles
	const aiResult = await lookupViaAiDecode(vin)

	// If AI was more confident, prefer it but merge any NHTSA data
	if (aiResult.confidence > nhtsaResult.confidence) {
		return {
			...aiResult,
			warnings: [
				...nhtsaResult.warnings,
				...aiResult.warnings,
				'Used AI VIN decode (NHTSA had low confidence)',
			],
		}
	}

	return nhtsaResult
}

async function lookupViaNhtsa(vin: string): Promise<VehicleLookupResult> {
	try {
		const url = `${NHTSA_API_URL}/${encodeURIComponent(vin)}?format=json`
		const response = await fetch(url, { signal: AbortSignal.timeout(10000) })

		if (!response.ok) {
			return {
				source: 'none',
				confidence: 0,
				warnings: [`NHTSA API returned ${response.status}`],
			}
		}

		const data = await response.json() as {
			Results?: Array<Record<string, string | null>>
		}
		const result = data.Results?.[0]

		if (!result) {
			return {
				source: 'none',
				confidence: 0,
				warnings: ['No results from NHTSA VIN decoder'],
			}
		}

		const getString = (key: string): string | undefined => {
			const val = result[key]
			return val && val.trim() !== '' && val !== '0' ? val.trim() : undefined
		}

		const getNumber = (key: string): number | undefined => {
			const val = result[key]
			if (!val || val.trim() === '' || val === '0') return undefined
			const num = Number.parseFloat(val)
			return Number.isNaN(num) ? undefined : num
		}

		const warnings: string[] = []
		const errorCode = getString('ErrorCode')
		if (errorCode && errorCode !== '0') {
			const errorText = getString('ErrorText')
			if (errorText) warnings.push(errorText)
		}

		const manufacturer = getString('Make')
		const model = getString('Model')
		const modelYear = getNumber('ModelYear')

		const filledFields = [
			manufacturer, model, modelYear,
			getString('BodyClass'), getNumber('DisplacementCC'),
			getNumber('EngineCylinders'), getString('FuelTypePrimary'),
		].filter(Boolean).length
		const confidence = Math.min(1, filledFields / 7)

		return {
			source: 'nhtsa',
			vin,
			manufacturer,
			make: getString('Manufacturer'),
			model,
			modelYear: modelYear ? Math.round(modelYear) : undefined,
			subType: getString('Series') || getString('Trim'),
			bodyType: getString('BodyClass'),
			engineDesign: getString('EngineConfiguration'),
			engineDisplacement: getNumber('DisplacementCC'),
			cylinders: getNumber('EngineCylinders') ? Math.round(getNumber('EngineCylinders')!) : undefined,
			powerKw: getNumber('EngineKW'),
			fuelType: getString('FuelTypePrimary'),
			transmission: getString('TransmissionStyle'),
			doors: getNumber('Doors') ? Math.round(getNumber('Doors')!) : undefined,
			seats: getNumber('Seats') ? Math.round(getNumber('Seats')!) : undefined,
			driveType: getString('DriveType'),
			confidence,
			warnings,
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		console.error('NHTSA lookup failed:', message)
		return {
			source: 'none',
			confidence: 0,
			warnings: [`NHTSA lookup failed: ${message}`],
		}
	}
}

async function lookupViaAiDecode(vin: string): Promise<VehicleLookupResult> {
	try {
		const client = getAnthropicClient()
		const prompt = AI_VIN_PROMPT.replace('{VIN}', vin)

		const message = await client.messages.create({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 512,
			messages: [{ role: 'user', content: prompt }],
		})

		const textBlock = message.content.find((b) => b.type === 'text')
		const raw = textBlock ? textBlock.text.trim() : ''

		const jsonString = raw
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

		const confidence = typeof parsed.confidence === 'number'
			? Math.min(1, Math.max(0, parsed.confidence))
			: 0.4

		return {
			source: 'ai-decode',
			vin,
			manufacturer: typeof parsed.manufacturer === 'string' ? parsed.manufacturer : undefined,
			make: typeof parsed.make === 'string' ? parsed.make : undefined,
			model: typeof parsed.model === 'string' ? parsed.model : undefined,
			modelYear: typeof parsed.modelYear === 'number' ? Math.round(parsed.modelYear) : undefined,
			bodyType: typeof parsed.bodyType === 'string' ? parsed.bodyType : undefined,
			engineDesign: typeof parsed.engineDesign === 'string' ? parsed.engineDesign : undefined,
			fuelType: typeof parsed.fuelType === 'string' ? parsed.fuelType : undefined,
			confidence,
			warnings: [],
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		console.error('AI VIN decode failed:', message)
		return {
			source: 'none',
			confidence: 0,
			warnings: [`AI VIN decode failed: ${message}`],
		}
	}
}

/**
 * Normalize body type from VIN/OCR to UI option values.
 */
function normalizeVehicleType(raw: string): string {
	const lower = raw.toLowerCase().trim()
	const map: Record<string, string> = {
		sedan: 'sedan', saloon: 'sedan', limousine: 'sedan',
		compact: 'compact', hatchback: 'compact', 'compact car': 'compact',
		suv: 'suv', 'sport utility vehicle': 'suv', crossover: 'suv',
		wagon: 'wagon', estate: 'wagon', kombi: 'wagon', 'station wagon': 'wagon',
		coupe: 'coupe', coupé: 'coupe',
		convertible: 'convertible', cabriolet: 'convertible', cabrio: 'convertible', roadster: 'convertible',
		van: 'van', minivan: 'van', mpv: 'van', bus: 'van', transporter: 'van',
	}
	return map[lower] ?? lower
}

/**
 * Normalize fuel type from VIN/OCR to UI option values.
 */
function normalizeMotorType(raw: string): string {
	const lower = raw.toLowerCase().trim()
	const map: Record<string, string> = {
		gasoline: 'petrol', petrol: 'petrol', benzin: 'petrol', otto: 'petrol',
		diesel: 'diesel',
		electric: 'electric', elektro: 'electric', bev: 'electric',
		hybrid: 'hybrid', 'plug-in hybrid': 'hybrid', phev: 'hybrid',
		gas: 'gas', lpg: 'gas', cng: 'gas', 'compressed natural gas': 'gas', 'natural gas': 'gas',
	}
	return map[lower] ?? lower
}

/**
 * Merges vehicle data from VIN lookup and OCR extraction.
 * Prefers OCR for registration-specific data, lookup for technical specs.
 */
function mergeVehicleData(
	lookup: VehicleLookupResult | null,
	ocr: OcrExtractionResult | null,
): Record<string, unknown> {
	const merged: Record<string, unknown> = {}

	// VIN: prefer OCR (direct from document)
	if (ocr?.vin) merged.vin = ocr.vin
	else if (lookup?.vin) merged.vin = lookup.vin

	// Manufacturer: prefer lookup (standardized naming)
	if (lookup?.manufacturer) merged.manufacturer = lookup.manufacturer
	else if (ocr?.manufacturer) merged.manufacturer = ocr.manufacturer

	// Model
	if (lookup?.model) merged.mainType = lookup.model
	else if (ocr?.model) merged.mainType = ocr.model

	if (lookup?.subType) merged.subtype = lookup.subType

	// Technical specs: prefer lookup
	if (lookup?.powerKw) {
		merged.powerKw = lookup.powerKw
	} else if (ocr?.power) {
		const kw = Number.parseInt(ocr.power, 10)
		if (!Number.isNaN(kw)) merged.powerKw = kw
	}

	if (lookup?.cylinders) merged.cylinders = lookup.cylinders
	if (lookup?.engineDesign) merged.engineDesign = lookup.engineDesign
	if (lookup?.transmission) merged.transmission = lookup.transmission
	else if (ocr?.transmission) merged.transmission = ocr.transmission

	if (lookup?.engineDisplacement) {
		merged.engineDisplacementCcm = lookup.engineDisplacement
	} else if (ocr?.engineDisplacement) {
		const cc = Number.parseInt(ocr.engineDisplacement, 10)
		if (!Number.isNaN(cc)) merged.engineDisplacementCcm = cc
	}

	// Vehicle details
	if (lookup?.doors) merged.doors = lookup.doors
	if (lookup?.seats) merged.seats = lookup.seats
	else if (ocr?.seats) {
		const seats = Number.parseInt(ocr.seats, 10)
		if (!Number.isNaN(seats)) merged.seats = seats
	}
	if (lookup?.fuelType) merged.motorType = normalizeMotorType(lookup.fuelType)
	else if (ocr?.fuel) merged.motorType = normalizeMotorType(ocr.fuel)

	if (lookup?.bodyType) merged.vehicleType = normalizeVehicleType(lookup.bodyType)
	else if (ocr?.vehicleType) merged.vehicleType = normalizeVehicleType(ocr.vehicleType)

	// Registration dates: only from OCR
	if (ocr?.firstRegistration) merged.firstRegistration = ocr.firstRegistration
	if (ocr?.lastRegistration) merged.lastRegistration = ocr.lastRegistration

	// KBA number: only from OCR
	if (ocr?.kbaNumber) merged.kbaNumber = ocr.kbaNumber

	// Previous owners: only from OCR
	if (ocr?.previousOwners) {
		const owners = Number.parseInt(ocr.previousOwners, 10)
		if (!Number.isNaN(owners)) merged.previousOwners = owners
	}

	return merged
}

export { lookupVehicleByVin, mergeVehicleData, normalizeVehicleType, normalizeMotorType }
