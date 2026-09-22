import { describe, expect, it } from 'vitest'
import { formatMileage, toMileageDigits } from './mileage'

describe('toMileageDigits', () => {
	it('keeps digits only', () => {
		expect(toMileageDigits('125.450')).toBe('125450')
		expect(toMileageDigits('125 450 km')).toBe('125450')
		expect(toMileageDigits('abc')).toBe('')
	})

	it('strips leading zeros but keeps a lone zero', () => {
		expect(toMileageDigits('000125')).toBe('125')
		expect(toMileageDigits('0')).toBe('0')
	})

	it('caps the length so a paste cannot overflow the column', () => {
		expect(toMileageDigits('12345678901234')).toBe('123456789')
	})
})

describe('formatMileage', () => {
	it('groups from the right', () => {
		expect(formatMileage('125450')).toBe('125.450')
		expect(formatMileage('21177')).toBe('21.177')
		expect(formatMileage('999')).toBe('999')
		expect(formatMileage('1000')).toBe('1.000')
		expect(formatMileage('1234567')).toBe('1.234.567')
	})

	it('is idempotent on already-formatted input', () => {
		expect(formatMileage('125.450')).toBe('125.450')
	})

	it('renders empty for no digits', () => {
		expect(formatMileage('')).toBe('')
		expect(formatMileage('km')).toBe('')
	})
})
