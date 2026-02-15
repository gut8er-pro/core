import { describe, it, expect } from 'vitest'
import {
	calculationSchema,
	additionalCostSchema,
	calculationPatchSchema,
} from './calculation'

describe('calculationSchema', () => {
	it('valid full data passes', () => {
		const result = calculationSchema.safeParse({
			replacementValue: 15000,
			taxRate: '19%',
			residualValue: 8000,
			diminutionInValue: 2500,
			wheelAlignment: 'Required',
			bodyMeasurements: 'Performed',
			bodyPaint: 'Full respray',
			plasticRepair: true,
			repairMethod: 'OEM parts',
			risks: 'Corrosion risk on welded areas',
			damageClass: 'Medium',
			dropoutGroup: 'A',
			costPerDay: 45,
			rentalCarClass: 'C',
			repairTimeDays: 5,
			replacementTimeDays: 14,
		})
		expect(result.success).toBe(true)
	})

	it('empty object passes (all fields optional)', () => {
		const result = calculationSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('null values pass for nullable fields', () => {
		const result = calculationSchema.safeParse({
			replacementValue: null,
			taxRate: null,
			residualValue: null,
			diminutionInValue: null,
			wheelAlignment: null,
			bodyMeasurements: null,
			bodyPaint: null,
			repairMethod: null,
			risks: null,
			damageClass: null,
			dropoutGroup: null,
			costPerDay: null,
			rentalCarClass: null,
			repairTimeDays: null,
			replacementTimeDays: null,
		})
		expect(result.success).toBe(true)
	})

	it('rejects negative replacementValue', () => {
		const result = calculationSchema.safeParse({
			replacementValue: -100,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'replacementValue',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects negative residualValue', () => {
		const result = calculationSchema.safeParse({
			residualValue: -500,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'residualValue',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects negative diminutionInValue', () => {
		const result = calculationSchema.safeParse({
			diminutionInValue: -1,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'diminutionInValue',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects negative costPerDay', () => {
		const result = calculationSchema.safeParse({
			costPerDay: -10,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'costPerDay',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects non-integer repairTimeDays', () => {
		const result = calculationSchema.safeParse({
			repairTimeDays: 3.5,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'repairTimeDays',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects non-integer replacementTimeDays', () => {
		const result = calculationSchema.safeParse({
			replacementTimeDays: 2.7,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'replacementTimeDays',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects negative repairTimeDays', () => {
		const result = calculationSchema.safeParse({
			repairTimeDays: -3,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'repairTimeDays',
			)
			expect(error).toBeDefined()
		}
	})

	it('allows zero for numeric fields', () => {
		const result = calculationSchema.safeParse({
			replacementValue: 0,
			residualValue: 0,
			diminutionInValue: 0,
			costPerDay: 0,
			repairTimeDays: 0,
			replacementTimeDays: 0,
		})
		expect(result.success).toBe(true)
	})

	it('rejects taxRate exceeding 20 chars', () => {
		const result = calculationSchema.safeParse({
			taxRate: 'A'.repeat(21),
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'taxRate',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects risks exceeding 2000 chars', () => {
		const result = calculationSchema.safeParse({
			risks: 'R'.repeat(2001),
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'risks',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects non-number replacementValue', () => {
		const result = calculationSchema.safeParse({
			replacementValue: 'not-a-number',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'replacementValue',
			)
			expect(error).toBeDefined()
		}
	})

	it('rejects non-boolean plasticRepair', () => {
		const result = calculationSchema.safeParse({
			plasticRepair: 'yes',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const error = result.error.issues.find(
				(issue) => issue.path[0] === 'plasticRepair',
			)
			expect(error).toBeDefined()
		}
	})
})

describe('additionalCostSchema', () => {
	it('valid data passes', () => {
		const result = additionalCostSchema.safeParse({
			description: 'Towing costs',
			amount: 250,
		})
		expect(result.success).toBe(true)
	})

	it('valid data with uuid id passes', () => {
		const result = additionalCostSchema.safeParse({
			id: '550e8400-e29b-41d4-a716-446655440000',
			description: 'Storage fees',
			amount: 100,
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing description', () => {
		const result = additionalCostSchema.safeParse({
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
		const result = additionalCostSchema.safeParse({
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
		const result = additionalCostSchema.safeParse({
			description: 'Towing costs',
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
		const result = additionalCostSchema.safeParse({
			description: 'Towing costs',
			amount: -50,
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
		const result = additionalCostSchema.safeParse({
			description: 'No charge item',
			amount: 0,
		})
		expect(result.success).toBe(true)
	})

	it('rejects description exceeding 500 chars', () => {
		const result = additionalCostSchema.safeParse({
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

	it('rejects non-uuid id', () => {
		const result = additionalCostSchema.safeParse({
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
})

describe('calculationPatchSchema', () => {
	it('valid patch with calculation only passes', () => {
		const result = calculationPatchSchema.safeParse({
			calculation: { replacementValue: 10000 },
		})
		expect(result.success).toBe(true)
	})

	it('valid patch with additionalCosts only passes', () => {
		const result = calculationPatchSchema.safeParse({
			additionalCosts: [
				{ description: 'Towing', amount: 200 },
			],
		})
		expect(result.success).toBe(true)
	})

	it('valid patch with deleteAdditionalCostIds passes', () => {
		const result = calculationPatchSchema.safeParse({
			deleteAdditionalCostIds: ['550e8400-e29b-41d4-a716-446655440000'],
		})
		expect(result.success).toBe(true)
	})

	it('empty object passes', () => {
		const result = calculationPatchSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('rejects non-uuid in deleteAdditionalCostIds', () => {
		const result = calculationPatchSchema.safeParse({
			deleteAdditionalCostIds: ['not-a-uuid'],
		})
		expect(result.success).toBe(false)
	})
})
