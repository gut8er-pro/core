import { describe, expect, it, vi } from 'vitest'
import type { OcrExtractionResult, OverviewAnalysisResult, VehicleLookupResult } from './types'
import {
	buildVehicleData,
	filledDocumentFields,
	lookupVehicleByVin,
	mergeVehicleData,
	missingVehicleFields,
	normalizeVehicleType,
	wmiManufacturer,
} from './vehicle-lookup'

function ocr(fields: Partial<OcrExtractionResult>): OcrExtractionResult {
	return {
		photoId: 'doc',
		manufacturer: '',
		model: '',
		vin: '',
		licensePlate: '',
		firstRegistration: '',
		engineDisplacement: '',
		power: '',
		fuel: '',
		mileage: '',
		kbaNumber: '',
		previousOwners: '',
		lastRegistration: '',
		nextMot: '',
		vehicleType: '',
		color: '',
		seats: '',
		transmission: '',
		ownerFirstName: '',
		ownerLastName: '',
		ownerStreet: '',
		ownerPostcode: '',
		ownerCity: '',
		...fields,
	}
}

function overview(fields: Partial<OverviewAnalysisResult>): OverviewAnalysisResult {
	return {
		photoId: 'overview',
		description: '',
		color: null,
		make: null,
		model: null,
		bodyType: null,
		generalCondition: null,
		bodyCondition: null,
		paintType: null,
		paintCondition: null,
		drivingAbility: null,
		...fields,
	}
}

// The demo KIA Ceed's VIN prefix (Kia Slovakia).
const KIA_VIN = 'U5YH5819AML012345'

describe('wmiManufacturer', () => {
	it('maps Audi WMI prefixes', () => {
		expect(wmiManufacturer('WAUZZZ4F58N035435')).toBe('Audi') // the user's real Audi A6 VIN
		expect(wmiManufacturer('WUAZZZ123456789AB')).toBe('Audi')
		expect(wmiManufacturer('TRUZZZ123456789AB')).toBe('Audi')
	})

	it('maps Volkswagen WMI prefixes (DIFFERENT from Audi)', () => {
		expect(wmiManufacturer('WVWZZZ123456789AB')).toBe('Volkswagen')
		expect(wmiManufacturer('WV1ZZZ123456789AB')).toBe('Volkswagen')
		expect(wmiManufacturer('WV2ZZZ123456789AB')).toBe('Volkswagen')
	})

	it('maps other major German manufacturers', () => {
		expect(wmiManufacturer('WBAZZZ123456789AB')).toBe('BMW')
		expect(wmiManufacturer('WDDZZZ123456789AB')).toBe('Mercedes-Benz')
		expect(wmiManufacturer('WDBZZZ123456789AB')).toBe('Mercedes-Benz')
		expect(wmiManufacturer('W0LZZZ123456789AB')).toBe('Opel')
	})

	it('is case-insensitive', () => {
		expect(wmiManufacturer('wauzzz4f58n035435')).toBe('Audi')
	})

	it('maps the non-German brands sold in Germany', () => {
		// The demo KIA Ceed got no manufacturer from its VIN: the table held
		// only European brands.
		expect(wmiManufacturer('U5YH5819AML012345')).toBe('Kia')
		expect(wmiManufacturer('KNAH5819AML012345')).toBe('Kia')
		expect(wmiManufacturer('KMHZZZ123456789AB')).toBe('Hyundai')
		expect(wmiManufacturer('TMAZZZ123456789AB')).toBe('Hyundai')
		expect(wmiManufacturer('VF1ZZZ123456789AB')).toBe('Renault')
		expect(wmiManufacturer('VF3ZZZ123456789AB')).toBe('Peugeot')
		expect(wmiManufacturer('5YJZZZ123456789AB')).toBe('Tesla')
		expect(wmiManufacturer('XP7ZZZ123456789AB')).toBe('Tesla')
		expect(wmiManufacturer('JTDZZZ123456789AB')).toBe('Toyota')
		expect(wmiManufacturer('UU1ZZZ123456789AB')).toBe('Dacia')
	})

	it('returns null for unknown WMIs', () => {
		expect(wmiManufacturer('XXXZZZ123456789AB')).toBeNull()
		expect(wmiManufacturer('9BWZZZ123456789AB')).toBeNull() // VW Brazil (not in our table)
	})

	it('returns null for malformed input', () => {
		expect(wmiManufacturer('')).toBeNull()
		expect(wmiManufacturer('AB')).toBeNull()
	})
})

describe('normalizeVehicleType', () => {
	it('maps canonical body types to UI option keys', () => {
		expect(normalizeVehicleType('Sedan')).toBe('sedan')
		expect(normalizeVehicleType('SUV')).toBe('suv')
		expect(normalizeVehicleType('Hatchback')).toBe('compact')
		expect(normalizeVehicleType('Estate')).toBe('wagon')
		expect(normalizeVehicleType('Coupe')).toBe('coupe')
		expect(normalizeVehicleType('Cabriolet')).toBe('convertible')
		expect(normalizeVehicleType('Minivan')).toBe('van')
	})

	it('maps body classes that arrive verbose', () => {
		expect(normalizeVehicleType('Sport Utility Vehicle')).toBe('suv')
		expect(normalizeVehicleType('Station Wagon')).toBe('wagon')
		expect(normalizeVehicleType('Compact Car')).toBe('compact')
	})

	it('uses substring fallback for compound descriptions', () => {
		// Real-photo QA: AI sometimes returns adjectives like "luxury sedan".
		// Substring fallback recovers the canonical type instead of dropping
		// the value entirely.
		expect(normalizeVehicleType('luxury sedan')).toBe('sedan')
		expect(normalizeVehicleType('full-size van')).toBe('van')
		expect(normalizeVehicleType('mid-size coupe')).toBe('coupe')
	})

	it('resolves German compound body styles to the right option', () => {
		// The demo KIA Ceed is a wagon and was detected as something else: the
		// substring fallback iterated the map in insertion order, so
		// "Kombilimousine" hit "limousine" (sedan) before "kombi" (wagon).
		expect(normalizeVehicleType('Kombilimousine')).toBe('wagon')
		expect(normalizeVehicleType('Sportswagon')).toBe('wagon')
		expect(normalizeVehicleType('Schräghecklimousine')).toBe('compact')
		expect(normalizeVehicleType('Limousine')).toBe('sedan')
		expect(normalizeVehicleType('Geländewagen')).toBe('suv')
		expect(normalizeVehicleType('Kleinbus')).toBe('van')
	})

	it('returns null for off-list types instead of raw text', () => {
		// Bug: AI returned "motorcycle - cruiser" on the Honda VT750 photo set;
		// without this, the literal value got persisted and the UI dropdown
		// stayed empty (no matching option).
		expect(normalizeVehicleType('motorcycle - cruiser')).toBeNull()
		expect(normalizeVehicleType('truck')).toBeNull()
		expect(normalizeVehicleType('unknown')).toBeNull()
	})
})

describe('lookupVehicleByVin', () => {
	it('contributes the VIN and the WMI manufacturer, nothing more', () => {
		// No NHTSA call, no model decode: positions 4–9 are the manufacturer's
		// private scheme, so any spec read from them is an assumed value.
		const fetchSpy = vi.spyOn(globalThis, 'fetch')
		const lookup = lookupVehicleByVin(KIA_VIN)
		expect(fetchSpy).not.toHaveBeenCalled()
		fetchSpy.mockRestore()

		expect(mergeVehicleData(lookup, null)).toEqual({ vin: KIA_VIN, manufacturer: 'Kia' })
	})

	it('contributes only the VIN when the WMI is unknown', () => {
		expect(mergeVehicleData(lookupVehicleByVin('9BWZZZ123456789AB'), null)).toEqual({
			vin: '9BWZZZ123456789AB',
		})
	})
})

describe('mergeVehicleData', () => {
	it('takes the registration document over a lookup that disagrees', () => {
		// 1482 cm³ is Kia's 1.5 T-GDi — the VIN guess that beat the demo
		// car's correctly read 1.6 CRDi document.
		const lookup: VehicleLookupResult = {
			source: 'wmi',
			vin: KIA_VIN,
			manufacturer: 'Kia',
			model: 'Ceed',
			bodyType: 'Hatchback',
			powerKw: 117,
			engineDisplacement: 1482,
			fuelType: 'Gasoline',
			seats: 4,
			confidence: 1,
			warnings: [],
		}
		const document = ocr({
			manufacturer: 'KIA',
			model: 'CEED SW',
			power: '100',
			engineDisplacement: '1582',
			fuel: 'Diesel',
			seats: '5',
			vehicleType: 'Kombilimousine',
		})

		expect(mergeVehicleData(lookup, document)).toMatchObject({
			manufacturer: 'KIA',
			mainType: 'CEED SW',
			powerKw: 100,
			engineDisplacementCcm: 1582,
			motorType: 'diesel',
			seats: 5,
			vehicleType: 'wagon',
		})
	})

	it('falls back to the lookup only for a box the document leaves empty', () => {
		const lookup: VehicleLookupResult = {
			source: 'wmi',
			manufacturer: 'Kia',
			powerKw: 117,
			confidence: 1,
			warnings: [],
		}
		expect(mergeVehicleData(lookup, ocr({ power: '' }))).toMatchObject({
			manufacturer: 'Kia',
			powerKw: 117,
		})
	})
})

describe('buildVehicleData', () => {
	it('never writes a body type judged from an overview photo', () => {
		// A wagon shot from the front three-quarter looks like a hatchback:
		// body style from a silhouette is an assumed value.
		const data = buildVehicleData(lookupVehicleByVin(KIA_VIN), null, [
			overview({ bodyType: 'hatchback', make: 'Kia', model: 'Ceed' }),
		])
		expect(data.vehicleType).toBeUndefined()
	})

	it('writes only the VIN and its WMI manufacturer when there is no document photo', () => {
		const data = buildVehicleData(lookupVehicleByVin(KIA_VIN), null, [
			overview({ bodyType: 'wagon', make: 'Kia', model: 'Ceed' }),
		])
		expect(data).toEqual({ vin: KIA_VIN, manufacturer: 'Kia' })
	})

	it('reads the manufacturer off a make badge when neither VIN nor document gave one', () => {
		// The badge gives the make; a model name from a photo is not written.
		const data = buildVehicleData(null, null, [overview({ make: 'Kia', model: 'Ceed' })])
		expect(data).toEqual({ manufacturer: 'Kia' })
	})

	it('keeps the VIN manufacturer over a badge read', () => {
		const data = buildVehicleData(lookupVehicleByVin(KIA_VIN), null, [
			overview({ make: 'Hyundai' }),
		])
		expect(data.manufacturer).toBe('Kia')
	})
})

describe('filledDocumentFields', () => {
	it('names the document columns the saved row holds a value for', () => {
		expect(filledDocumentFields({ powerKw: 100, vin: '', manufacturer: null, seats: 0 })).toEqual([
			'powerKw',
			'seats',
		])
		expect(filledDocumentFields(null)).toEqual([])
	})
})

describe('missingVehicleFields', () => {
	it('names the document fields no source stated', () => {
		const data = mergeVehicleData(lookupVehicleByVin(KIA_VIN), null)
		const missing = missingVehicleFields(data, [])
		expect(missing).toContain('powerKw')
		expect(missing).toContain('engineDisplacementCcm')
		expect(missing).toContain('firstRegistration')
		expect(missing).not.toContain('vin')
		expect(missing).not.toContain('manufacturer')
	})

	it('leaves out fields the report already holds', () => {
		const missing = missingVehicleFields({}, ['powerKw', 'firstRegistration'])
		expect(missing).not.toContain('powerKw')
		expect(missing).not.toContain('firstRegistration')
		expect(missing).toContain('engineDisplacementCcm')
	})

	it('is empty when the document stated everything', () => {
		const data = mergeVehicleData(
			null,
			ocr({
				vin: KIA_VIN,
				manufacturer: 'KIA',
				model: 'CEED',
				power: '100',
				engineDisplacement: '1582',
				fuel: 'Diesel',
				seats: '5',
				vehicleType: 'Kombilimousine',
				firstRegistration: '2021-03-01',
				lastRegistration: '2023-05-10',
				kbaNumber: '8253/AKL',
			}),
		)
		expect(missingVehicleFields(data, [])).toEqual([])
	})
})
