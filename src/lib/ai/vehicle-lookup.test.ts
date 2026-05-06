import { describe, expect, it } from 'vitest'
import { wmiManufacturer } from './vehicle-lookup'

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
