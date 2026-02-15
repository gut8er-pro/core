import { describe, it, expect } from 'vitest'
import {
	BVSK_RATES,
	calculateNetTotal,
	calculateTax,
	calculateGrossTotal,
	generateInvoiceNumber,
	lookupBvskRate,
} from './invoice-calculations'

describe('calculateNetTotal', () => {
	it('sums amounts from multiple line items', () => {
		const items = [
			{ amount: 100 },
			{ amount: 200 },
			{ amount: 50 },
		]
		expect(calculateNetTotal(items)).toBe(350)
	})

	it('returns 0 for empty array', () => {
		expect(calculateNetTotal([])).toBe(0)
	})

	it('returns the amount for a single item', () => {
		expect(calculateNetTotal([{ amount: 500 }])).toBe(500)
	})

	it('handles decimal amounts', () => {
		const items = [
			{ amount: 99.99 },
			{ amount: 0.01 },
		]
		expect(calculateNetTotal(items)).toBeCloseTo(100, 2)
	})

	it('handles zero amounts', () => {
		const items = [
			{ amount: 0 },
			{ amount: 0 },
			{ amount: 100 },
		]
		expect(calculateNetTotal(items)).toBe(100)
	})
})

describe('calculateTax', () => {
	it('calculates 19% tax correctly', () => {
		expect(calculateTax(1000, 19)).toBeCloseTo(190, 2)
	})

	it('calculates 7% reduced tax correctly', () => {
		expect(calculateTax(1000, 7)).toBeCloseTo(70, 2)
	})

	it('returns 0 for 0% tax rate', () => {
		expect(calculateTax(1000, 0)).toBe(0)
	})

	it('returns 0 for 0 net total', () => {
		expect(calculateTax(0, 19)).toBe(0)
	})

	it('handles decimal net totals', () => {
		expect(calculateTax(99.99, 19)).toBeCloseTo(18.9981, 4)
	})
})

describe('calculateGrossTotal', () => {
	it('calculates gross total with 19% tax', () => {
		expect(calculateGrossTotal(1000, 19)).toBeCloseTo(1190, 2)
	})

	it('calculates gross total with 7% tax', () => {
		expect(calculateGrossTotal(1000, 7)).toBeCloseTo(1070, 2)
	})

	it('returns net total when tax rate is 0', () => {
		expect(calculateGrossTotal(500, 0)).toBe(500)
	})

	it('returns 0 for zero net total', () => {
		expect(calculateGrossTotal(0, 19)).toBe(0)
	})

	it('handles typical invoice values', () => {
		// 587 EUR base fee + 19% = 698.53
		expect(calculateGrossTotal(587, 19)).toBeCloseTo(698.53, 2)
	})
})

describe('generateInvoiceNumber', () => {
	it('generates number with correct prefix', () => {
		const result = generateInvoiceNumber('INV')
		expect(result.startsWith('INV-')).toBe(true)
	})

	it('includes current year', () => {
		const result = generateInvoiceNumber('GA')
		const year = new Date().getFullYear()
		expect(result.endsWith(`-${year}`)).toBe(true)
	})

	it('follows the PREFIX-NNNN-YYYY format', () => {
		const result = generateInvoiceNumber('TEST')
		const parts = result.split('-')
		expect(parts[0]).toBe('TEST')
		// Sequence part should be 4 digits
		expect(parts[1]).toMatch(/^\d{4}$/)
		// Year part should be 4 digits
		expect(parts[2]).toMatch(/^\d{4}$/)
	})

	it('generates unique numbers across calls', () => {
		const numbers = new Set<string>()
		// Generate 50 invoice numbers and check for reasonable uniqueness
		for (let i = 0; i < 50; i++) {
			numbers.add(generateInvoiceNumber('INV'))
		}
		// With random 4-digit sequences, collisions are very unlikely for 50 calls
		expect(numbers.size).toBeGreaterThan(40)
	})

	it('handles empty prefix', () => {
		const result = generateInvoiceNumber('')
		const year = new Date().getFullYear()
		expect(result).toMatch(new RegExp(`^-\\d{4}-${year}$`))
	})
})

describe('lookupBvskRate', () => {
	it('returns correct rate for lowest bracket (0-500)', () => {
		const rate = lookupBvskRate(250)
		expect(rate.baseFee).toBe(312)
		expect(rate.additionalFee).toBe(50)
	})

	it('returns correct rate for exact lower boundary', () => {
		const rate = lookupBvskRate(0)
		expect(rate.baseFee).toBe(312)
		expect(rate.additionalFee).toBe(50)
	})

	it('returns correct rate for exact upper boundary of first bracket', () => {
		const rate = lookupBvskRate(500)
		// 500 matches both the first (0-500) and second (500-750) brackets
		// find() returns the first match
		const rate0 = lookupBvskRate(500)
		expect(rate0.baseFee).toBe(312)
	})

	it('returns correct rate for mid-range bracket (2000-2500)', () => {
		const rate = lookupBvskRate(2200)
		expect(rate.baseFee).toBe(687)
		expect(rate.additionalFee).toBe(110)
	})

	it('returns correct rate for high bracket (40000-50000)', () => {
		const rate = lookupBvskRate(45000)
		expect(rate.baseFee).toBe(3317)
		expect(rate.additionalFee).toBe(310)
	})

	it('returns last bracket for values above the highest bracket', () => {
		const rate = lookupBvskRate(100000)
		expect(rate.baseFee).toBe(3317)
		expect(rate.additionalFee).toBe(310)
	})

	it('returns correct rate for bracket boundary at 1000', () => {
		const rate = lookupBvskRate(1000)
		// 1000 is the upper bound of 750-1000 bracket
		expect(rate.baseFee).toBe(427)
		expect(rate.additionalFee).toBe(75)
	})

	it('returns correct rate for bracket 5000-6000', () => {
		const rate = lookupBvskRate(5500)
		expect(rate.baseFee).toBe(1192)
		expect(rate.additionalFee).toBe(155)
	})

	it('returns correct rate for bracket 10000-12500', () => {
		const rate = lookupBvskRate(11000)
		expect(rate.baseFee).toBe(1872)
		expect(rate.additionalFee).toBe(195)
	})
})

describe('BVSK_RATES', () => {
	it('has 20 rate entries', () => {
		expect(BVSK_RATES).toHaveLength(20)
	})

	it('starts at 0 minRepairCost', () => {
		const first = BVSK_RATES[0]!
		expect(first.minRepairCost).toBe(0)
	})

	it('ends at 50000 maxRepairCost', () => {
		const last = BVSK_RATES[BVSK_RATES.length - 1]!
		expect(last.maxRepairCost).toBe(50000)
	})

	it('has increasing baseFee values', () => {
		for (let i = 1; i < BVSK_RATES.length; i++) {
			const current = BVSK_RATES[i]!
			const previous = BVSK_RATES[i - 1]!
			expect(current.baseFee).toBeGreaterThan(previous.baseFee)
		}
	})

	it('has non-decreasing additionalFee values', () => {
		for (let i = 1; i < BVSK_RATES.length; i++) {
			const current = BVSK_RATES[i]!
			const previous = BVSK_RATES[i - 1]!
			expect(current.additionalFee).toBeGreaterThanOrEqual(
				previous.additionalFee,
			)
		}
	})

	it('all entries have positive baseFee and additionalFee', () => {
		for (const entry of BVSK_RATES) {
			expect(entry.baseFee).toBeGreaterThan(0)
			expect(entry.additionalFee).toBeGreaterThan(0)
		}
	})
})
