import { describe, it, expect } from 'vitest'
import { vehicleInfoSchema } from './vehicle'

describe('vehicleInfoSchema', () => {
	it('valid data passes', () => {
		const result = vehicleInfoSchema.safeParse({
			vin: 'WVWZZZ3CZWE123456',
			manufacturer: 'Volkswagen',
			mainType: 'Golf',
			subType: 'GTI',
			kbaNumber: '0603/BJC',
			powerKw: 110,
			powerHp: 150,
			cylinders: 4,
			doors: 5,
			seats: 5,
		})
		expect(result.success).toBe(true)
	})

	it('empty object passes (all optional)', () => {
		const result = vehicleInfoSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('vin exceeding 17 chars fails', () => {
		const result = vehicleInfoSchema.safeParse({
			vin: 'ABCDEFGHIJKLMNOPQR',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const vinError = result.error.issues.find(
				(issue) => issue.path[0] === 'vin',
			)
			expect(vinError).toBeDefined()
		}
	})

	it('kbaNumber exceeding 10 chars fails', () => {
		const result = vehicleInfoSchema.safeParse({
			kbaNumber: '12345678901',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const kbaError = result.error.issues.find(
				(issue) => issue.path[0] === 'kbaNumber',
			)
			expect(kbaError).toBeDefined()
		}
	})

	it('rejects non-string vin', () => {
		const result = vehicleInfoSchema.safeParse({
			vin: 12345,
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const vinError = result.error.issues.find(
				(issue) => issue.path[0] === 'vin',
			)
			expect(vinError).toBeDefined()
		}
	})
})
