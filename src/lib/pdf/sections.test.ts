import { describe, expect, it } from 'vitest'
import {
	ALL_SECTIONS,
	parseSectionsParam,
	sectionsFromToggles,
	serializeSections,
} from './sections'

describe('sectionsFromToggles', () => {
	it('keeps the report body when anything besides the invoice is on', () => {
		expect(
			sectionsFromToggles({
				includeVehicleValuation: true,
				includeCommission: true,
				includeInvoice: true,
			}),
		).toEqual(ALL_SECTIONS)
	})

	it('drops the report body when the invoice is the only thing asked for', () => {
		expect(
			sectionsFromToggles({
				includeVehicleValuation: false,
				includeCommission: false,
				includeInvoice: true,
			}),
		).toEqual({ report: false, valuation: false, commission: false, invoice: true })
	})

	it('keeps the report body when the invoice is off', () => {
		expect(
			sectionsFromToggles({
				includeVehicleValuation: true,
				includeCommission: true,
				includeInvoice: false,
			}),
		).toEqual({ report: true, valuation: true, commission: true, invoice: false })
	})

	it('keeps the report body for a valuation-plus-invoice document', () => {
		expect(
			sectionsFromToggles({
				includeVehicleValuation: true,
				includeCommission: false,
				includeInvoice: true,
			}),
		).toEqual({ report: true, valuation: true, commission: false, invoice: true })
	})
})

describe('parseSectionsParam', () => {
	const fallback = sectionsFromToggles({
		includeVehicleValuation: true,
		includeCommission: false,
		includeInvoice: true,
	})

	it('falls back to the stored toggles when the param is absent', () => {
		expect(parseSectionsParam(null, fallback)).toEqual(fallback)
	})

	it('falls back rather than producing an empty document from a typo', () => {
		expect(parseSectionsParam('invoce,valution', fallback)).toEqual(fallback)
		expect(parseSectionsParam('', fallback)).toEqual(fallback)
	})

	it('reads an invoice-only request', () => {
		expect(parseSectionsParam('invoice', fallback)).toEqual({
			report: false,
			valuation: false,
			commission: false,
			invoice: true,
		})
	})

	it('overrides the stored toggles rather than intersecting with them', () => {
		expect(parseSectionsParam('commission', fallback)).toEqual({
			report: true,
			valuation: false,
			commission: true,
			invoice: false,
		})
	})

	it('ignores case and stray whitespace', () => {
		expect(parseSectionsParam(' Invoice , VALUATION ', fallback)).toEqual({
			report: true,
			valuation: true,
			commission: false,
			invoice: true,
		})
	})
})

describe('serializeSections', () => {
	it('round-trips through parseSectionsParam', () => {
		const selection = { valuation: true, commission: false, invoice: true }
		const parsed = parseSectionsParam(serializeSections(selection), ALL_SECTIONS)
		expect(parsed).toEqual({ report: true, ...selection })
	})

	it('never emits the report body, which is derived rather than chosen', () => {
		expect(serializeSections({ valuation: false, commission: false, invoice: true })).toBe(
			'invoice',
		)
	})
})
