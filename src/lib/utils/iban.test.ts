import { describe, expect, it } from 'vitest'
import { formatIban, isValidIban, normalizeIban } from './iban'

describe('normalizeIban', () => {
	it('strips the grouping spaces the input adds', () => {
		expect(normalizeIban('DE89 3704 0044 0532 0130 00')).toBe('DE89370400440532013000')
	})

	it('uppercases and drops punctuation', () => {
		expect(normalizeIban('de89-3704.0044 0532 0130 00')).toBe('DE89370400440532013000')
	})

	it('leaves an empty value empty', () => {
		expect(normalizeIban('')).toBe('')
	})
})

describe('formatIban', () => {
	it('groups a German IBAN in fours', () => {
		expect(formatIban('DE89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00')
	})

	it('regroups a value that already carries stray spaces', () => {
		expect(formatIban('DE8937 040044 0532013000')).toBe('DE89 3704 0044 0532 0130 00')
	})

	it('adds no trailing space on a complete group', () => {
		expect(formatIban('DE89370400440532')).toBe('DE89 3704 0044 0532')
	})

	it('groups as the assessor types', () => {
		expect(formatIban('DE893')).toBe('DE89 3')
	})

	it('caps at the ISO 13616 maximum of 34 characters', () => {
		expect(normalizeIban(formatIban('D'.repeat(40)))).toHaveLength(34)
	})
})

describe('isValidIban', () => {
	it('accepts a German IBAN with correct check digits', () => {
		expect(isValidIban('DE89 3704 0044 0532 0130 00')).toBe(true)
		expect(isValidIban('DE12500105170648489890')).toBe(true)
	})

	it('rejects a German IBAN whose check digits do not add up', () => {
		expect(isValidIban('DE89370400440532013001')).toBe(false)
	})

	it('rejects a German IBAN of the wrong length', () => {
		expect(isValidIban('DE8937040044053201300')).toBe(false)
		expect(isValidIban('DE893704004405320130000')).toBe(false)
	})

	it('accepts non-German IBANs that pass the checksum', () => {
		expect(isValidIban('AT61 1904 3002 3457 3201')).toBe(true)
		expect(isValidIban('GB33BUKB20201555555555')).toBe(true)
		expect(isValidIban('FR1420041010050500013M02606')).toBe(true)
	})

	it('rejects anything that is not IBAN-shaped', () => {
		expect(isValidIban('not-an-iban')).toBe(false)
		expect(isValidIban('1234567890')).toBe(false)
		expect(isValidIban('')).toBe(false)
	})
})
