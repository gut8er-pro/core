import { describe, expect, it } from 'vitest'
import {
	DEFAULT_LINE_ITEM_KEYS,
	defaultLineItemByKey,
	lineItemAmount,
	seedLineItems,
} from './default-line-items'

describe('seedLineItems', () => {
	it('seeds the four rows every invoice starts with, in order', () => {
		const items = seedLineItems()
		expect(items.map((item) => item.specialFeature)).toEqual([...DEFAULT_LINE_ITEM_KEYS])
		expect(items.map((item) => item.order)).toEqual([0, 1, 2, 3])
	})

	it('seeds the JVEG per-unit prices', () => {
		const byKey = Object.fromEntries(seedLineItems().map((item) => [item.specialFeature, item]))
		expect(byKey.anfahrt?.rate).toBe(0.7)
		expect(byKey.fotografien?.rate).toBe(2)
		expect(byKey.druck_versand?.rate).toBe(15)
	})

	it('bills nothing until the assessor fills the rows in', () => {
		const items = seedLineItems()
		const grundhonorar = items.find((item) => item.specialFeature === 'grundhonorar')
		expect(grundhonorar?.rate).toBe(0)
		expect(grundhonorar?.amount).toBe(0)
		expect(items.find((item) => item.specialFeature === 'anfahrt')?.amount).toBe(0)
		expect(items.find((item) => item.specialFeature === 'fotografien')?.amount).toBe(0)
	})

	it('starts the per-unit rows at zero units so nothing is billed unasked', () => {
		const items = seedLineItems()
		expect(items.find((item) => item.specialFeature === 'anfahrt')?.quantity).toBe(0)
		expect(items.find((item) => item.specialFeature === 'fotografien')?.quantity).toBe(0)
	})

	it('makes Grundhonorar and Druck & Versand lump sums', () => {
		const items = seedLineItems()
		expect(items.find((item) => item.specialFeature === 'grundhonorar')?.isLumpSum).toBe(true)
		expect(items.find((item) => item.specialFeature === 'druck_versand')?.isLumpSum).toBe(true)
	})
})

describe('defaultLineItemByKey', () => {
	it('allows Pauschale only for Grundhonorar and Druck & Versand', () => {
		expect(defaultLineItemByKey('grundhonorar')?.lumpSumOnly).toBe(true)
		expect(defaultLineItemByKey('druck_versand')?.lumpSumOnly).toBe(true)
		expect(defaultLineItemByKey('anfahrt')?.lumpSumOnly).toBe(false)
		expect(defaultLineItemByKey('fotografien')?.lumpSumOnly).toBe(false)
	})

	it('gives the per-unit rows a unit hint', () => {
		expect(defaultLineItemByKey('anfahrt')?.unitKey).toBe('units.km')
		expect(defaultLineItemByKey('fotografien')?.unitKey).toBe('units.piece')
	})

	it('treats a row the assessor added as no default', () => {
		expect(defaultLineItemByKey('')).toBeUndefined()
		expect(defaultLineItemByKey(null)).toBeUndefined()
		expect(defaultLineItemByKey('Besonderheit')).toBeUndefined()
	})
})

describe('lineItemAmount', () => {
	it('multiplies rate by quantity on a per-unit row', () => {
		expect(lineItemAmount({ rate: '2', quantity: '30' })).toBe(60)
	})

	it('bills a lump-sum row its rate alone', () => {
		expect(lineItemAmount({ isLumpSum: true, rate: '250', quantity: '7' })).toBe(250)
	})

	it('bills a Pauschale-only default row its rate however the row is flagged', () => {
		expect(lineItemAmount({ specialFeature: 'grundhonorar', rate: '890', quantity: '0' })).toBe(890)
		expect(lineItemAmount({ specialFeature: 'druck_versand', rate: '15' })).toBe(15)
	})

	it('bills nothing for a per-unit row with no quantity', () => {
		expect(lineItemAmount({ rate: '250', quantity: '' })).toBe(0)
		expect(lineItemAmount({ specialFeature: 'anfahrt', rate: '0.7' })).toBe(0)
	})

	it('bills nothing when there is no rate', () => {
		expect(lineItemAmount({ rate: '', quantity: '5' })).toBe(0)
		expect(lineItemAmount({})).toBe(0)
	})
})
