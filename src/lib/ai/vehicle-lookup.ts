// Vehicle data from the VIN. Only positions 1–3 (the WMI) have a public,
// fixed meaning, so the VIN contributes itself and the manufacturer — nothing
// more. Positions 4–9 encode model, body and engine in each manufacturer's
// private scheme; turning them into kW / cm³ / body needs a licensed database
// (DAT), and any figure decoded without one is an assumed value. See
// "Vehicle data from Generate" in CONTEXT.md.

import type { OcrExtractionResult, OverviewAnalysisResult, VehicleLookupResult } from './types'

// ISO 3779 World Manufacturer Identifiers of the brands sold in Germany. A
// static list: an unknown WMI yields no manufacturer rather than a guess.
const WMI_MANUFACTURER_MAP: Record<string, string> = {
	// Volkswagen group
	WAU: 'Audi',
	WUA: 'Audi',
	WA1: 'Audi',
	TRU: 'Audi',
	WVW: 'Volkswagen',
	WV1: 'Volkswagen',
	WV2: 'Volkswagen',
	WVG: 'Volkswagen',
	VSS: 'SEAT',
	TMB: 'Skoda',
	WP0: 'Porsche',
	WP1: 'Porsche',
	SCB: 'Bentley',
	ZHW: 'Lamborghini',
	// BMW group
	WBA: 'BMW',
	WBS: 'BMW',
	WBY: 'BMW',
	'5UX': 'BMW',
	WMW: 'MINI',
	SCA: 'Rolls-Royce',
	// Mercedes-Benz
	WDD: 'Mercedes-Benz',
	WDC: 'Mercedes-Benz',
	WDB: 'Mercedes-Benz',
	WDF: 'Mercedes-Benz',
	WMX: 'Mercedes-Benz',
	W1K: 'Mercedes-Benz',
	W1N: 'Mercedes-Benz',
	W1V: 'Mercedes-Benz',
	WME: 'smart',
	// Stellantis
	W0L: 'Opel',
	W0V: 'Opel',
	VXK: 'Opel',
	VF3: 'Peugeot',
	VR3: 'Peugeot',
	VF7: 'Citroën',
	VR7: 'Citroën',
	VR1: 'DS',
	ZFA: 'Fiat',
	ZAR: 'Alfa Romeo',
	ZLA: 'Lancia',
	ZAM: 'Maserati',
	ZAC: 'Jeep',
	'1C4': 'Jeep',
	'1J4': 'Jeep',
	// Renault group
	VF1: 'Renault',
	UU1: 'Dacia',
	// Ford
	WF0: 'Ford',
	NM0: 'Ford',
	'1FA': 'Ford',
	'1FM': 'Ford',
	'1FT': 'Ford',
	// Hyundai group
	KMH: 'Hyundai',
	KMF: 'Hyundai',
	KM8: 'Hyundai',
	TMA: 'Hyundai',
	NLH: 'Hyundai',
	MAL: 'Hyundai',
	KMT: 'Genesis',
	KNA: 'Kia',
	KNC: 'Kia',
	KND: 'Kia',
	KNE: 'Kia',
	U5Y: 'Kia',
	U6Y: 'Kia',
	// Japanese brands
	JTD: 'Toyota',
	JTE: 'Toyota',
	JTM: 'Toyota',
	JTN: 'Toyota',
	SB1: 'Toyota',
	VNK: 'Toyota',
	NMT: 'Toyota',
	JTH: 'Lexus',
	JTJ: 'Lexus',
	JN1: 'Nissan',
	JN8: 'Nissan',
	SJN: 'Nissan',
	VSK: 'Nissan',
	JHM: 'Honda',
	SHH: 'Honda',
	SHS: 'Honda',
	JMZ: 'Mazda',
	JM1: 'Mazda',
	JMB: 'Mitsubishi',
	XMC: 'Mitsubishi',
	JSA: 'Suzuki',
	TSM: 'Suzuki',
	MA3: 'Suzuki',
	JF1: 'Subaru',
	JF2: 'Subaru',
	// Others
	YV1: 'Volvo',
	YV4: 'Volvo',
	LYV: 'Volvo',
	LPS: 'Polestar',
	SAJ: 'Jaguar',
	SAL: 'Land Rover',
	SCF: 'Aston Martin',
	SBM: 'McLaren',
	SCC: 'Lotus',
	ZFF: 'Ferrari',
	LSJ: 'MG',
	LGX: 'BYD',
	KPT: 'SsangYong',
	'5YJ': 'Tesla',
	'7SA': 'Tesla',
	LRW: 'Tesla',
	XP7: 'Tesla',
}

function wmiManufacturer(vin: string): string | null {
	if (!vin || vin.length < 3) return null
	const wmi = vin.slice(0, 3).toUpperCase()
	return WMI_MANUFACTURER_MAP[wmi] ?? null
}

/**
 * What the VIN itself states: the VIN, and the manufacturer from its WMI.
 * Synchronous on purpose — there is no VIN service to call. When DAT access
 * lands, its VIN query belongs here, still ranked below the document by
 * `mergeVehicleData`.
 */
function lookupVehicleByVin(vin: string): VehicleLookupResult {
	const manufacturer = wmiManufacturer(vin)
	return {
		source: 'wmi',
		vin,
		...(manufacturer ? { manufacturer } : {}),
		confidence: manufacturer ? 1 : 0,
		warnings: [],
	}
}

/**
 * Normalize body type from VIN/OCR to one of the canonical UI option values
 * defined in details-section.tsx (sedan / compact / suv / wagon / coupe /
 * convertible / van). Returns null for anything off-list — the dropdown then
 * stays empty rather than showing raw AI text it can't render. We saw the
 * model emit "motorcycle - cruiser" and "luxury van" in real-photo testing;
 * those used to leak through as the literal stored value.
 */
function normalizeVehicleType(raw: string): string | null {
	const lower = raw.toLowerCase().trim()
	const map: Record<string, string> = {
		sedan: 'sedan',
		saloon: 'sedan',
		limousine: 'sedan',
		compact: 'compact',
		hatchback: 'compact',
		'compact car': 'compact',
		kleinwagen: 'compact',
		schrägheck: 'compact',
		schraegheck: 'compact',
		schräghecklimousine: 'compact',
		suv: 'suv',
		'sport utility vehicle': 'suv',
		crossover: 'suv',
		geländewagen: 'suv',
		gelaendewagen: 'suv',
		wagon: 'wagon',
		estate: 'wagon',
		kombi: 'wagon',
		kombilimousine: 'wagon',
		caravan: 'wagon',
		variant: 'wagon',
		avant: 'wagon',
		touring: 'wagon',
		sportstourer: 'wagon',
		sportswagon: 'wagon',
		'station wagon': 'wagon',
		coupe: 'coupe',
		coupé: 'coupe',
		convertible: 'convertible',
		cabriolet: 'convertible',
		cabrio: 'convertible',
		roadster: 'convertible',
		van: 'van',
		minivan: 'van',
		mpv: 'van',
		bus: 'van',
		transporter: 'van',
	}
	if (map[lower]) return map[lower]
	// Substring fallback: catches "luxury sedan" → sedan, "compact suv" → suv.
	// Longest key first, otherwise a compound German body style resolves to
	// whichever short key happens to sit earlier in the map —
	// "Kombilimousine" (a wagon, the demo car) matched "limousine" → sedan.
	for (const key of Object.keys(map).sort((a, b) => b.length - a.length)) {
		if (lower.includes(key)) return map[key] ?? null
	}
	return null
}

/**
 * Normalize fuel type from VIN/OCR to UI option values.
 */
function normalizeMotorType(raw: string): string {
	const lower = raw.toLowerCase().trim()
	const map: Record<string, string> = {
		gasoline: 'petrol',
		petrol: 'petrol',
		benzin: 'petrol',
		otto: 'petrol',
		diesel: 'diesel',
		electric: 'electric',
		elektro: 'electric',
		bev: 'electric',
		hybrid: 'hybrid',
		'plug-in hybrid': 'hybrid',
		phev: 'hybrid',
		gas: 'gas',
		lpg: 'gas',
		cng: 'gas',
		'compressed natural gas': 'gas',
		'natural gas': 'gas',
	}
	return map[lower] ?? lower
}

function parseCount(raw: string | undefined): number | undefined {
	if (!raw) return undefined
	const n = Number.parseInt(raw, 10)
	return Number.isNaN(n) ? undefined : n
}

/**
 * Merges the registration document with the VIN lookup. The document wins
 * for every box it prints; the lookup only fills a box the document left
 * empty. Never the other way round — a lookup value preferred over a read box
 * is how the demo car got a 1.5 T-GDi's 1482 cm³ on a 1.6 CRDi.
 */
function mergeVehicleData(
	lookup: VehicleLookupResult | null,
	ocr: OcrExtractionResult | null,
): Record<string, unknown> {
	const merged: Record<string, unknown> = {}
	const set = (key: string, value: unknown) => {
		if (value !== undefined && value !== null && value !== '') merged[key] = value
	}

	set('vin', ocr?.vin || lookup?.vin)
	set('manufacturer', ocr?.manufacturer || lookup?.manufacturer)
	set('mainType', ocr?.model || lookup?.model)
	set('subtype', lookup?.subType)

	set('powerKw', parseCount(ocr?.power) ?? lookup?.powerKw)
	set('engineDisplacementCcm', parseCount(ocr?.engineDisplacement) ?? lookup?.engineDisplacement)
	set('seats', parseCount(ocr?.seats) ?? lookup?.seats)
	set('cylinders', lookup?.cylinders)
	set('engineDesign', lookup?.engineDesign)
	set('doors', lookup?.doors)
	set('transmission', ocr?.transmission || lookup?.transmission)

	const fuel = ocr?.fuel || lookup?.fuelType
	if (fuel) set('motorType', normalizeMotorType(fuel))

	// Skip the assignment entirely if neither produces a canonical match, so
	// an off-list value is never persisted.
	const fromOcr = ocr?.vehicleType ? normalizeVehicleType(ocr.vehicleType) : null
	const fromLookup = lookup?.bodyType ? normalizeVehicleType(lookup.bodyType) : null
	set('vehicleType', fromOcr ?? fromLookup)

	// Registration-specific boxes: only the document states them.
	set('firstRegistration', ocr?.firstRegistration)
	set('lastRegistration', ocr?.lastRegistration)
	set('kbaNumber', ocr?.kbaNumber)
	set('previousOwners', parseCount(ocr?.previousOwners))

	return merged
}

/**
 * The vehicle values Generate writes: the merged document + VIN, then a make
 * badge read off an overview photo when neither stated a manufacturer. Never
 * a model or body type from an overview photo — a model name is as often
 * judged from the shape as read off a badge, and body type — body style judged from a
 * silhouette is an assumed value (a wagon from the front three-quarter
 * looks like a hatchback).
 */
function buildVehicleData(
	lookup: VehicleLookupResult | null,
	ocr: OcrExtractionResult | null,
	overviews: OverviewAnalysisResult[],
): Record<string, unknown> {
	const data = mergeVehicleData(lookup, ocr)
	if (!data.manufacturer) {
		const make = overviews.find((o) => o.make)?.make
		if (make) data.manufacturer = make
	}
	return data
}

/**
 * The `VehicleInfo` columns a registration document prints (transmission is
 * not a Teil I box, so it is not listed). When Generate
 * leaves one of them empty, the summary names it so the assessor knows to
 * enter it by hand.
 */
const DOCUMENT_VEHICLE_FIELDS = [
	'vin',
	'manufacturer',
	'mainType',
	'powerKw',
	'engineDisplacementCcm',
	'motorType',
	'seats',
	'vehicleType',
	'firstRegistration',
	'lastRegistration',
	'kbaNumber',
] as const

type DocumentVehicleField = (typeof DOCUMENT_VEHICLE_FIELDS)[number]

/**
 * Document fields the saved `VehicleInfo` row already holds a value for.
 */
function filledDocumentFields(
	vehicleInfo: Partial<Record<DocumentVehicleField, unknown>> | null,
): DocumentVehicleField[] {
	return DOCUMENT_VEHICLE_FIELDS.filter((field) => {
		const value = vehicleInfo?.[field]
		return value !== null && value !== undefined && value !== ''
	})
}

/**
 * Document fields that neither this run stated nor the report already holds.
 */
function missingVehicleFields(
	vehicleData: Record<string, unknown>,
	alreadyFilled: Iterable<string>,
): DocumentVehicleField[] {
	const filled = new Set(alreadyFilled)
	return DOCUMENT_VEHICLE_FIELDS.filter(
		(field) => vehicleData[field] === undefined && !filled.has(field),
	)
}

export type { DocumentVehicleField }
export {
	buildVehicleData,
	filledDocumentFields,
	lookupVehicleByVin,
	mergeVehicleData,
	missingVehicleFields,
	normalizeMotorType,
	normalizeVehicleType,
	wmiManufacturer,
}
