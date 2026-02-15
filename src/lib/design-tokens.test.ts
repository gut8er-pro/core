import { describe, expect, it } from 'vitest'
import { COLORS, PAINT_THICKNESS_COLORS, getPaintColor } from './design-tokens'

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
      expect(PAINT_THICKNESS_COLORS.blue.hex).toBe('#3B82F6')
      expect(PAINT_THICKNESS_COLORS.green.hex).toBe('#22C55E')
      expect(PAINT_THICKNESS_COLORS.yellow.hex).toBe('#EAB308')
      expect(PAINT_THICKNESS_COLORS.orange.hex).toBe('#F97316')
      expect(PAINT_THICKNESS_COLORS.red.hex).toBe('#EF4444')
    })
  })

  describe('getPaintColor', () => {
    it('returns blue for < 70 µm', () => {
      expect(getPaintColor(0)).toBe('#3B82F6')
      expect(getPaintColor(50)).toBe('#3B82F6')
      expect(getPaintColor(69)).toBe('#3B82F6')
    })

    it('returns green for 70-160 µm', () => {
      expect(getPaintColor(70)).toBe('#22C55E')
      expect(getPaintColor(100)).toBe('#22C55E')
      expect(getPaintColor(160)).toBe('#22C55E')
    })

    it('returns yellow for 161-300 µm', () => {
      expect(getPaintColor(161)).toBe('#EAB308')
      expect(getPaintColor(200)).toBe('#EAB308')
      expect(getPaintColor(300)).toBe('#EAB308')
    })

    it('returns orange for 301-700 µm', () => {
      expect(getPaintColor(301)).toBe('#F97316')
      expect(getPaintColor(500)).toBe('#F97316')
      expect(getPaintColor(700)).toBe('#F97316')
    })

    it('returns red for > 700 µm', () => {
      expect(getPaintColor(701)).toBe('#EF4444')
      expect(getPaintColor(1000)).toBe('#EF4444')
    })
  })
})
