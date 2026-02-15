import { describe, it, expect } from 'vitest'
import { kwToHp, hpToKw } from './power-conversion'

describe('kwToHp', () => {
	it('converts 100 kW to 136 HP', () => {
		expect(kwToHp(100)).toBe(136)
	})

	it('converts 0 kW to 0 HP', () => {
		expect(kwToHp(0)).toBe(0)
	})
})

describe('hpToKw', () => {
	it('converts 136 HP to 100 kW', () => {
		expect(hpToKw(136)).toBe(100)
	})

	it('converts 200 HP to 147 kW', () => {
		expect(hpToKw(200)).toBe(147)
	})
})
