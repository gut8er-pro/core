import { describe, expect, it } from 'vitest'
import { COLORS, getPaintColor, PAINT_THICKNESS_COLORS } from './design-tokens'

describe('design-tokens', () => {
	describe('COLORS', () => {
		it('has primary green', () => {
			expect(COLORS.primary).toBe('#16A34A')
		})

		it('has all required color tokens', () => {
			expect(COLORS.primaryHover).toBe('#15803D')
			expect(COLORS.primaryLight).toBe('#F0FDF4')
			expect(COLORS.darkGreen).toBe('#166534')
			expect(COLORS.black).toBe('#1A1A1A')
			expect(COLORS.white).toBe('#FFFFFF')
			expect(COLORS.grey25).toBe('#F7F8FA')
			expect(COLORS.grey50).toBe('#D1D5DB')
			expect(COLORS.grey100).toBe('#6B7280')
			expect(COLORS.border).toBe('#E5E7EB')
			expect(COLORS.error).toBe('#EF4444')
			expect(COLORS.warning).toBe('#EAB308')
			expect(COLORS.infoBlue).toBe('#3B82F6')
		})
	})

	describe('PAINT_THICKNESS_COLORS', () => {
		it('has all 5 paint threshold levels', () => {
			expect(Object.keys(PAINT_THICKNESS_COLORS)).toHaveLength(5)
			expect(PAINT_THICKNESS_COLORS.blue.hex).toBe('#49DCF2')
			expect(PAINT_THICKNESS_COLORS.green.hex).toBe('#52D57B')
			expect(PAINT_THICKNESS_COLORS.yellow.hex).toBe('#F4CA14')
			expect(PAINT_THICKNESS_COLORS.orange.hex).toBe('#F47514')
			expect(PAINT_THICKNESS_COLORS.red.hex).toBe('#F41414')
		})
	})

	describe('getPaintColor', () => {
		it('returns blue for < 70 µm', () => {
			expect(getPaintColor(0)).toBe('#49DCF2')
			expect(getPaintColor(50)).toBe('#49DCF2')
			expect(getPaintColor(69)).toBe('#49DCF2')
		})

		it('returns green for 70-160 µm', () => {
			expect(getPaintColor(70)).toBe('#52D57B')
			expect(getPaintColor(100)).toBe('#52D57B')
			expect(getPaintColor(160)).toBe('#52D57B')
		})

		it('returns yellow for 161-300 µm', () => {
			expect(getPaintColor(161)).toBe('#F4CA14')
			expect(getPaintColor(200)).toBe('#F4CA14')
			expect(getPaintColor(300)).toBe('#F4CA14')
		})

		it('returns orange for 301-700 µm', () => {
			expect(getPaintColor(301)).toBe('#F47514')
			expect(getPaintColor(500)).toBe('#F47514')
			expect(getPaintColor(700)).toBe('#F47514')
		})

		it('returns red for > 700 µm', () => {
			expect(getPaintColor(701)).toBe('#F41414')
			expect(getPaintColor(1000)).toBe('#F41414')
		})
	})
})
