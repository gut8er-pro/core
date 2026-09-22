import { describe, expect, it } from 'vitest'
import { EMISSION_GROUPS, MILEAGE_UNITS } from '@/components/report/condition/types'
import { conditionSchema, damageMarkerSchema, getPaintColor, paintMarkerSchema } from './condition'

describe('conditionSchema', () => {
	it('valid data passes', () => {
		const result = conditionSchema.safeParse({
			paintType: 'Metallic',
			generalCondition: 'Good',
			bodyCondition: 'Minor scratches',
			interiorCondition: 'Clean',
			mileageRead: 85000,
			unit: 'km',
			fullServiceHistory: true,
			testDrivePerformed: false,
			airbagsDeployed: false,
		})
		expect(result.success).toBe(true)
	})

	it('empty object passes', () => {
		const result = conditionSchema.safeParse({})
		expect(result.success).toBe(true)
	})
})

describe('damageMarkerSchema', () => {
	it('valid marker passes', () => {
		const result = damageMarkerSchema.safeParse({
			x: 50,
			y: 30,
			comment: 'Deep scratch on front bumper',
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing x', () => {
		const result = damageMarkerSchema.safeParse({
			y: 30,
			comment: 'Missing x coordinate',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const xError = result.error.issues.find((issue) => issue.path[0] === 'x')
			expect(xError).toBeDefined()
		}
	})
})

describe('paintMarkerSchema', () => {
	it('valid marker passes', () => {
		const result = paintMarkerSchema.safeParse({
			x: 25,
			y: 75,
			thickness: 120,
			color: '#22C55E',
			position: 'Hood center',
		})
		expect(result.success).toBe(true)
	})
})

describe('unit', () => {
	it('accepts every unit the picker offers', () => {
		for (const unit of MILEAGE_UNITS) {
			expect(conditionSchema.safeParse({ unit }).success).toBe(true)
		}
	})

	it('rejects a unit the picker never offered', () => {
		expect(conditionSchema.safeParse({ unit: 'MKR' }).success).toBe(false)
	})
})

describe('emissionGroup', () => {
	it('accepts every Schadstoffgruppe the stickers offer', () => {
		for (const group of EMISSION_GROUPS) {
			expect(conditionSchema.safeParse({ emissionGroup: group }).success).toBe(true)
		}
	})

	it('accepts null — deselecting leaves the group unknown', () => {
		expect(conditionSchema.safeParse({ emissionGroup: null }).success).toBe(true)
	})

	it('rejects a group outside the four', () => {
		expect(conditionSchema.safeParse({ emissionGroup: '5' }).success).toBe(false)
	})
})

describe('getPaintColor', () => {
	it('returns blue for thickness < 70', () => {
		expect(getPaintColor(50)).toBe('#49DCF2')
	})

	it('returns green for thickness 70', () => {
		expect(getPaintColor(70)).toBe('#52D57B')
	})

	it('returns yellow for thickness 161', () => {
		expect(getPaintColor(161)).toBe('#F4CA14')
	})

	it('returns orange for thickness 301', () => {
		expect(getPaintColor(301)).toBe('#F47514')
	})

	it('returns red for thickness 700', () => {
		expect(getPaintColor(700)).toBe('#F41414')
	})
})
