import { describe, expect, it } from 'vitest'
import { calculationHeadingKey } from './heading'

describe('calculationHeadingKey', () => {
	it('heads both valuation types the way their tab is headed', () => {
		expect(calculationHeadingKey('BE')).toBe('valuationTab')
		expect(calculationHeadingKey('OT')).toBe('valuationTab')
	})

	it('keeps the value and repair calculation for the types that have one', () => {
		expect(calculationHeadingKey('HS')).toBe('title')
		expect(calculationHeadingKey('KG')).toBe('title')
	})
})
