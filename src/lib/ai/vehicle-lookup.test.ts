import { describe, expect, it } from 'vitest'
import { normalizeVehicleType, wmiManufacturer } from './vehicle-lookup'

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

	it('returns null for unknown WMIs', () => {
		expect(wmiManufacturer('XXXZZZ123456789AB')).toBeNull()
		expect(wmiManufacturer('1HGCM82633A123456')).toBeNull() // Honda US (not in our table)
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

	it('maps NHTSA body classes that arrive verbose', () => {
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

	it('returns null for off-list types instead of raw text', () => {
		// Bug: AI returned "motorcycle - cruiser" on the Honda VT750 photo set;
		// without this, the literal value got persisted and the UI dropdown
		// stayed empty (no matching option).
		expect(normalizeVehicleType('motorcycle - cruiser')).toBeNull()
		expect(normalizeVehicleType('truck')).toBeNull()
		expect(normalizeVehicleType('unknown')).toBeNull()
	})
})
