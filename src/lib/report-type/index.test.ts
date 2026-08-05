import { describe, expect, it } from 'vitest'
import { REPORT_TYPES } from '@/lib/validations/reports'
import {
	getReportTypeConfig,
	REPORT_TYPE_CONFIG,
	resolveReportType,
	resolveReportTypeConfig,
} from './index'

describe('REPORT_TYPE_CONFIG', () => {
	// Expected values mirror the spec's per-type table exactly — this is the
	// human-checkable copy of the single source of truth.
	const EXPECTED = {
		HS: {
			hasAccidentSection: true,
			hasOpponent: true,
			hasLawyerFields: true,
			hasPresentSubsection: false,
			hasConditionValuationSections: false,
			calculationVariant: 'standard',
			hasCorrection: true,
			customerLabel: 'claimant',
			documentSubtitle: 'damageAssessment',
		},
		KG: {
			hasAccidentSection: true,
			hasOpponent: true,
			hasLawyerFields: true,
			hasPresentSubsection: false,
			hasConditionValuationSections: false,
			calculationVariant: 'standard',
			hasCorrection: false,
			customerLabel: 'claimant',
			documentSubtitle: 'damageAssessment',
		},
		BE: {
			hasAccidentSection: false,
			hasOpponent: false,
			hasLawyerFields: true,
			hasPresentSubsection: false,
			hasConditionValuationSections: false,
			calculationVariant: 'valuation',
			hasCorrection: true,
			customerLabel: 'claimant',
			documentSubtitle: 'vehicleValuation',
		},
		OT: {
			hasAccidentSection: false,
			hasOpponent: false,
			hasLawyerFields: false,
			hasPresentSubsection: true,
			hasConditionValuationSections: true,
			calculationVariant: 'oldtimer',
			hasCorrection: false,
			customerLabel: 'client',
			documentSubtitle: 'oldtimerValuation',
		},
	} as const

	it('has exactly one row per report type', () => {
		expect(Object.keys(REPORT_TYPE_CONFIG).sort()).toEqual([...REPORT_TYPES].sort())
	})

	for (const type of REPORT_TYPES) {
		it(`matches the spec table for ${type}`, () => {
			expect(REPORT_TYPE_CONFIG[type]).toEqual(EXPECTED[type])
		})
	}
})

describe('getReportTypeConfig', () => {
	it('returns the config row for a type', () => {
		expect(getReportTypeConfig('OT')).toBe(REPORT_TYPE_CONFIG.OT)
	})
})

describe('resolveReportTypeConfig', () => {
	it('resolves a known type straight to its config', () => {
		expect(resolveReportTypeConfig('OT')).toBe(REPORT_TYPE_CONFIG.OT)
	})

	it('falls back to the HS config for a nullable/unknown value', () => {
		expect(resolveReportTypeConfig(null)).toBe(REPORT_TYPE_CONFIG.HS)
		expect(resolveReportTypeConfig('')).toBe(REPORT_TYPE_CONFIG.HS)
		expect(resolveReportTypeConfig('XYZ')).toBe(REPORT_TYPE_CONFIG.HS)
	})
})

describe('resolveReportType', () => {
	for (const type of REPORT_TYPES) {
		it(`passes through the known type ${type}`, () => {
			expect(resolveReportType(type)).toBe(type)
		})
	}

	it('defaults null to HS', () => {
		expect(resolveReportType(null)).toBe('HS')
	})

	it('defaults undefined to HS', () => {
		expect(resolveReportType(undefined)).toBe('HS')
	})

	it('defaults a blank string to HS', () => {
		expect(resolveReportType('')).toBe('HS')
	})

	it('defaults an unknown value to HS', () => {
		expect(resolveReportType('XYZ')).toBe('HS')
	})
})

describe('capabilities the bug fixes depend on', () => {
	it('BE and OT have no accident section', () => {
		expect(getReportTypeConfig('BE').hasAccidentSection).toBe(false)
		expect(getReportTypeConfig('OT').hasAccidentSection).toBe(false)
	})

	it('BE and OT have no opponent', () => {
		expect(getReportTypeConfig('BE').hasOpponent).toBe(false)
		expect(getReportTypeConfig('OT').hasOpponent).toBe(false)
	})

	it('BE has a correction section', () => {
		expect(getReportTypeConfig('BE').hasCorrection).toBe(true)
	})

	it("OT's customer label is client", () => {
		expect(getReportTypeConfig('OT').customerLabel).toBe('client')
	})
})
