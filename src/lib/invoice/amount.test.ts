import { describe, expect, it } from 'vitest'
import { invoiceGross } from './amount'

describe('invoiceGross', () => {
	it('prefers the stored gross total', () => {
		expect(
			invoiceGross({ totalGross: 1785, totalNet: 1500, taxRate: 19, lineItems: [] }),
		).toBeCloseTo(1785)
	})

	it('grosses up the stored net when no gross is stored', () => {
		expect(invoiceGross({ totalGross: 0, totalNet: 1000, taxRate: 19, lineItems: [] })).toBeCloseTo(
			1190,
		)
	})

	it('falls back to the line items when both totals are zero', () => {
		expect(
			invoiceGross({
				totalGross: 0,
				totalNet: 0,
				taxRate: 19,
				lineItems: [
					{ amount: 600, rate: 600, quantity: 1 },
					{ amount: 400, rate: 400, quantity: 1 },
				],
			}),
		).toBeCloseTo(1190)
	})

	it('derives a line item amount from rate and quantity when the amount is zero', () => {
		expect(
			invoiceGross({
				totalGross: 0,
				totalNet: 0,
				taxRate: 19,
				lineItems: [{ amount: 0, rate: 50, quantity: 4 }],
			}),
		).toBeCloseTo(238)
	})

	it('uses the default tax rate when none is stored', () => {
		expect(invoiceGross({ totalGross: 0, totalNet: 100, taxRate: 0, lineItems: [] })).toBeCloseTo(
			119,
		)
	})

	it('is zero for an invoice with nothing on it', () => {
		expect(invoiceGross({ totalGross: 0, totalNet: 0, taxRate: 19, lineItems: [] })).toBe(0)
	})
})
