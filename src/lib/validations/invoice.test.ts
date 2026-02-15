import { describe, it, expect } from 'vitest'
import {
	invoiceSchema,
	lineItemSchema,
	invoicePatchSchema,
} from './invoice'

describe('invoiceSchema', () => {
	it('valid full data passes', () => {
		const result = invoiceSchema.safeParse({
			invoiceNumber: 'GA-0001-2025',
			date: '2025-03-15T10:00:00+01:00',
			recipientId: 'client-abc-123',
			payoutDelay: 14,
			eInvoice: true,
			feeSchedule: 'BVSK',
			totalNet: 1500,
			totalGross: 1785,
			taxRate: 19,
		})
		expect(result.success).toBe(true)
	})

	it('empty object passes (all optional)', () => {
		const result = invoiceSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('null values pass for nullable fields', () => {
		const result = invoiceSchema.safeParse({
			invoiceNumber: null,
			date: null,
			recipientId: null,
			payoutDelay: null,
		})
		expect(result.success).toBe(true)
	})

	it('rejects invoiceNumber exceeding 50 chars', () => {
		const result = invoiceSchema.safeParse({
			invoiceNumber: 'X'.repeat(51),
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'invoiceNumber',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects invalid datetime format for date', () => {
		const result = invoiceSchema.safeParse({
			date: 'not-a-date',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'date',
			)
			expect(error).toBeDefined()
		}
	})

	it('accepts valid ISO datetime with offset', () => {
		const result = invoiceSchema.safeParse({
			date: '2025-06-01T14:30:00+02:00',
		})
		expect(result.success).toBe(true)
	})

	it('rejects negative payoutDelay', () => {
		const result = invoiceSchema.safeParse({
			payoutDelay: -5,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'payoutDelay',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects non-integer payoutDelay', () => {
		const result = invoiceSchema.safeParse({
			payoutDelay: 14.5,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'payoutDelay',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects negative totalNet', () => {
		const result = invoiceSchema.safeParse({
			totalNet: -100,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'totalNet',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects negative totalGross', () => {
		const result = invoiceSchema.safeParse({
			totalGross: -50,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'totalGross',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects taxRate below 0', () => {
		const result = invoiceSchema.safeParse({
			taxRate: -1,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'taxRate',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects taxRate above 100', () => {
		const result = invoiceSchema.safeParse({
			taxRate: 101,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'taxRate',
			)
			expect(error).toBeDefined()
		}
	})

	it('allows taxRate at boundary values 0 and 100', () => {
		const result0 = invoiceSchema.safeParse({ taxRate: 0 })
		expect(result0.success).toBe(true)

		const result100 = invoiceSchema.safeParse({ taxRate: 100 })
		expect(result100.success).toBe(true)
	})

	it('rejects non-boolean eInvoice', () => {
		const result = invoiceSchema.safeParse({
			eInvoice: 'yes',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'eInvoice',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects recipientId exceeding 200 chars', () => {
		const result = invoiceSchema.safeParse({
			recipientId: 'R'.repeat(201),
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'recipientId',
			)
			expect(error).toBeDefined()
		}
	})
})

describe('lineItemSchema', () => {
	it('valid full data passes', () => {
		const result = lineItemSchema.safeParse({
			id: '550e8400-e29b-41d4-a716-446655440000',
			description: 'Grundhonorar',
			specialFeature: 'BVSK',
			isLumpSum: true,
			rate: 587,
			amount: 587,
			quantity: 1,
			perUnit: null,
			order: 0,
		})
		expect(result.success).toBe(true)
	})

	it('minimal valid data passes (only required fields)', () => {
		const result = lineItemSchema.safeParse({
			description: 'Fahrtkosten',
			amount: 45,
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing description', () => {
		const result = lineItemSchema.safeParse({
			amount: 100,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'description',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects empty description', () => {
		const result = lineItemSchema.safeParse({
			description: '',
			amount: 100,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'description',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects missing amount', () => {
		const result = lineItemSchema.safeParse({
			description: 'Test item',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'amount',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects negative amount', () => {
		const result = lineItemSchema.safeParse({
			description: 'Test item',
			amount: -10,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'amount',
			)
			expect(error).toBeDefined()
		}
	})

	it('allows zero amount', () => {
		const result = lineItemSchema.safeParse({
			description: 'No charge',
			amount: 0,
		})
		expect(result.success).toBe(true)
	})

	it('rejects description exceeding 500 chars', () => {
		const result = lineItemSchema.safeParse({
			description: 'D'.repeat(501),
			amount: 100,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'description',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects specialFeature exceeding 200 chars', () => {
		const result = lineItemSchema.safeParse({
			description: 'Test',
			amount: 100,
			specialFeature: 'S'.repeat(201),
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'specialFeature',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects negative rate', () => {
		const result = lineItemSchema.safeParse({
			description: 'Test',
			amount: 100,
			rate: -5,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'rate',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects negative quantity', () => {
		const result = lineItemSchema.safeParse({
			description: 'Test',
			amount: 100,
			quantity: -1,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'quantity',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects non-integer order', () => {
		const result = lineItemSchema.safeParse({
			description: 'Test',
			amount: 100,
			order: 1.5,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'order',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects non-uuid id', () => {
		const result = lineItemSchema.safeParse({
			id: 'not-a-uuid',
			description: 'Test',
			amount: 100,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'id',
			)
			expect(error).toBeDefined()
		}
	})

	it('allows null for nullable fields', () => {
		const result = lineItemSchema.safeParse({
			description: 'Test',
			amount: 100,
			specialFeature: null,
			perUnit: null,
		})
		expect(result.success).toBe(true)
	})
})

describe('invoicePatchSchema', () => {
	it('valid patch with invoice only passes', () => {
		const result = invoicePatchSchema.safeParse({
			invoice: {
				invoiceNumber: 'GA-0001-2025',
				taxRate: 19,
			},
		})
		expect(result.success).toBe(true)
	})

	it('valid patch with lineItems only passes', () => {
		const result = invoicePatchSchema.safeParse({
			lineItems: [
				{ description: 'Grundhonorar', amount: 587 },
				{ description: 'Fahrtkosten', amount: 45 },
			],
		})
		expect(result.success).toBe(true)
	})

	it('valid patch with deleteLineItemIds passes', () => {
		const result = invoicePatchSchema.safeParse({
			deleteLineItemIds: ['550e8400-e29b-41d4-a716-446655440000'],
		})
		expect(result.success).toBe(true)
	})

	it('empty object passes', () => {
		const result = invoicePatchSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('combined patch with all fields passes', () => {
		const result = invoicePatchSchema.safeParse({
			invoice: { eInvoice: true },
			lineItems: [{ description: 'New item', amount: 100 }],
			deleteLineItemIds: ['550e8400-e29b-41d4-a716-446655440000'],
		})
		expect(result.success).toBe(true)
	})

	it('rejects non-uuid in deleteLineItemIds', () => {
		const result = invoicePatchSchema.safeParse({
			deleteLineItemIds: ['not-a-uuid'],
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid line item in array', () => {
		const result = invoicePatchSchema.safeParse({
			lineItems: [
				{ description: 'Valid', amount: 100 },
				{ amount: 50 }, // missing description
			],
		})
		expect(result.success).toBe(false)
	})
})
