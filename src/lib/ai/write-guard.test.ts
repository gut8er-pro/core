// The never-overwrite guard (issue 18): AI output pre-fills, never overwrites.
// Each case names a column the client watched Generate clobber on the demo.

import { describe, expect, it } from 'vitest'
import { isUserOwned, pickFillable, skippedKeys } from './write-guard'

describe('isUserOwned', () => {
	it('treats null, undefined and blank strings as free', () => {
		expect(isUserOwned(null)).toBe(false)
		expect(isUserOwned(undefined)).toBe(false)
		expect(isUserOwned('')).toBe(false)
		expect(isUserOwned('   ')).toBe(false)
		expect(isUserOwned([])).toBe(false)
	})

	it('treats false and 0 as deliberate user values', () => {
		// A checkbox the assessor cleared and a count they set to zero are
		// answers, not gaps. Re-filling them is the same defect as overwriting
		// a typed string.
		expect(isUserOwned(false)).toBe(true)
		expect(isUserOwned(0)).toBe(true)
	})

	it('treats non-empty strings, numbers and dates as owned', () => {
		expect(isUserOwned('B-AB 1234')).toBe(true)
		expect(isUserOwned(94)).toBe(true)
		expect(isUserOwned(new Date('2024-01-01'))).toBe(true)
	})
})

describe('pickFillable', () => {
	it('keeps the plate and VIN the assessor typed', () => {
		// Issue 18 case 1: the plate OCR re-detects the visible plate from the
		// photos and used to replace what the assessor entered.
		const existing = { licensePlate: 'SENTINEL-PLATE', vin: 'SENTINELVIN000001' }
		const out = pickFillable(existing, {
			licensePlate: 'M-XX 9999',
			vin: 'WAUZZZ4G7EN123456',
		})
		expect(out).toEqual({})
	})

	it('fills only the empty columns of a partly-filled row', () => {
		const existing = { vin: 'WAUZZZ4G7EN123456', kbaNumber: null, powerKw: null }
		const out = pickFillable(existing, {
			vin: 'OTHERVIN123456789',
			kbaNumber: '8004/AQD',
			powerKw: 94,
		})
		expect(out).toEqual({ kbaNumber: '8004/AQD', powerKw: 94 })
	})

	it('protects the calculation columns the damage analyzer races against', () => {
		// Issue 18 case 1, second half: repairMethod / risks / damageClass.
		const existing = {
			repairMethod: 'Teileersatz laut Werkstatt',
			risks: 'Verdeckte Schäden am Längsträger',
			damageClass: 'III',
		}
		const out = pickFillable(existing, {
			repairMethod: 'Conventional body repair',
			risks: 'Possible hidden damage',
			damageClass: 'II',
		})
		expect(out).toEqual({})
	})

	it('fills everything non-empty when the row does not exist yet', () => {
		const out = pickFillable(null, { vin: 'WAUZZZ4G7EN123456', kbaNumber: '' })
		expect(out).toEqual({ vin: 'WAUZZZ4G7EN123456' })
	})

	it('drops empty candidates instead of blanking a column', () => {
		const out = pickFillable({ manufacturer: null }, { manufacturer: '', mainType: null })
		expect(out).toEqual({})
	})

	it('does not re-fill a checkbox the assessor cleared', () => {
		const out = pickFillable({ plasticRepair: false }, { plasticRepair: true })
		expect(out).toEqual({})
	})
})

describe('skippedKeys', () => {
	it('names the columns the guard refused to touch', () => {
		const skipped = skippedKeys(
			{ licensePlate: 'SENTINEL', vin: null },
			{ licensePlate: 'M-XX 9999', vin: 'WAUZZZ4G7EN123456' },
		)
		expect(skipped).toEqual(['licensePlate'])
	})

	it('reports nothing for a row that does not exist', () => {
		expect(skippedKeys(null, { vin: 'WAUZZZ4G7EN123456' })).toEqual([])
	})
})
