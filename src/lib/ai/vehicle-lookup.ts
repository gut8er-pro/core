// Vehicle data lookup using NHTSA VIN decoder API (free, no key required).

import type { VehicleLookupResult } from './types'

const NHTSA_API_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues'

async function lookupVehicleByVin(vin: string): Promise<VehicleLookupResult> {
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

		// Helper to extract non-empty string values
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

		// Calculate confidence based on how many fields were returned
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
		console.error('Vehicle lookup failed:', message)
		return {
			source: 'none',
			confidence: 0,
			warnings: [`Vehicle lookup failed: ${message}`],
		}
	}
}

/**
 * Merges vehicle data from VIN lookup and OCR extraction.
 * Prefers OCR for registration-specific data, lookup for technical specs.
 */
function mergeVehicleData(
	lookup: VehicleLookupResult | null,
	ocr: { manufacturer?: string; model?: string; vin?: string; power?: string; engineDisplacement?: string; fuel?: string; firstRegistration?: string; licensePlate?: string } | null,
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

	if (lookup?.engineDisplacement) {
		merged.engineDisplacementCcm = lookup.engineDisplacement
	} else if (ocr?.engineDisplacement) {
		const cc = Number.parseInt(ocr.engineDisplacement, 10)
		if (!Number.isNaN(cc)) merged.engineDisplacementCcm = cc
	}

	// Vehicle details
	if (lookup?.doors) merged.doors = lookup.doors
	if (lookup?.seats) merged.seats = lookup.seats
	if (lookup?.fuelType) merged.motorType = lookup.fuelType
	else if (ocr?.fuel) merged.motorType = ocr.fuel

	if (lookup?.bodyType) merged.vehicleType = lookup.bodyType

	// Registration dates: only from OCR
	if (ocr?.firstRegistration) merged.firstRegistration = ocr.firstRegistration

	return merged
}

export { lookupVehicleByVin, mergeVehicleData }
