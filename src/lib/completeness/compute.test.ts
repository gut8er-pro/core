import { describe, expect, it } from 'vitest'
import { computeMissingInfo, evaluateTab } from './compute'
import type { ReportType, TabKey } from './types'

/** Empty values for a tab — the state a freshly created report is in. */
const EMPTY: Record<TabKey, Record<string, unknown>> = {
	gallery: {},
	accidentInfo: {},
	vehicle: {},
	condition: {},
	calculation: {},
	invoice: {},
}

function missingPaths(reportType: ReportType, tab: TabKey, values: Record<string, unknown>) {
	return evaluateTab(reportType, tab, values).missingPaths
}

describe('accident info requirements by report type', () => {
	it('requires the accident day, scene and the opponent insurer for liability reports', () => {
		const paths = missingPaths('HS', 'accidentInfo', {})

		expect(paths).toContain('accidentDay')
		expect(paths).toContain('accidentScene')
		expect(paths).toContain('opponentInsuranceCompany')
		expect(paths).toContain('opponentInsuranceNumber')
	})

	it('requires the same accident and opponent fields for short reports', () => {
		const paths = missingPaths('KG', 'accidentInfo', {})

		expect(paths).toContain('accidentDay')
		expect(paths).toContain('opponentInsuranceCompany')
	})

	it('asks for no accident or opponent data on an evaluation report', () => {
		const paths = missingPaths('BE', 'accidentInfo', {})

		expect(paths).not.toContain('accidentDay')
		expect(paths).not.toContain('accidentScene')
		expect(paths.some((path) => path.startsWith('opponent'))).toBe(false)
	})

	it('asks for no accident or opponent data on an oldtimer valuation', () => {
		const paths = missingPaths('OT', 'accidentInfo', {})

		expect(paths).not.toContain('accidentDay')
		expect(paths.some((path) => path.startsWith('opponent'))).toBe(false)
	})

	it('still asks an evaluation report for the claimant address and contact', () => {
		const paths = missingPaths('BE', 'accidentInfo', {})

		expect(paths).toContain('claimantStreet')
		expect(paths).toContain('claimantPostcode')
		expect(paths).toContain('claimantLocation')
	})
})

describe('either/or requirements', () => {
	it('is satisfied by the company alone', () => {
		const paths = missingPaths('HS', 'accidentInfo', { claimantCompany: 'Müller GmbH' })

		expect(paths).not.toContain('claimantCompany')
		expect(paths).not.toContain('claimantLastName')
	})

	it('is satisfied by the last name alone', () => {
		const paths = missingPaths('HS', 'accidentInfo', { claimantLastName: 'Müller' })

		expect(paths).not.toContain('claimantLastName')
		expect(paths).not.toContain('claimantCompany')
	})

	it('flags both sides when neither is filled', () => {
		const paths = missingPaths('HS', 'accidentInfo', {})

		expect(paths).toContain('claimantLastName')
		expect(paths).toContain('claimantCompany')
	})

	it('treats an email or a phone number as interchangeable', () => {
		expect(missingPaths('HS', 'accidentInfo', { claimantPhone: '+49 30 1234' })).not.toContain(
			'claimantEmail',
		)
		expect(missingPaths('HS', 'accidentInfo', { claimantEmail: 'a@b.de' })).not.toContain(
			'claimantPhone',
		)
	})

	it('counts an unsatisfied either/or once, not once per side', () => {
		const withNeither = evaluateTab('HS', 'accidentInfo', {})
		const withCompany = evaluateTab('HS', 'accidentInfo', { claimantCompany: 'Müller GmbH' })

		expect(withNeither.missingCount - withCompany.missingCount).toBe(1)
	})
})

describe('conditional requirements', () => {
	it('leaves the lawyer field optional when the claimant is not represented', () => {
		const paths = missingPaths('HS', 'accidentInfo', { claimantRepresentedByLawyer: false })

		expect(paths).not.toContain('claimantInvolvedLawyer')
	})

	it('requires the lawyer field once the claimant is marked as represented', () => {
		const paths = missingPaths('HS', 'accidentInfo', { claimantRepresentedByLawyer: true })

		expect(paths).toContain('claimantInvolvedLawyer')
	})

	it('requires a lawyer signature only while the claimant is represented', () => {
		const unrepresented = missingPaths('HS', 'accidentInfo', {
			claimantRepresentedByLawyer: false,
			signatures: [{ type: 'DATA_PERMISSION', imageUrl: 'data:image/png;base64,x' }],
		})
		const represented = missingPaths('HS', 'accidentInfo', {
			claimantRepresentedByLawyer: true,
			signatures: [{ type: 'DATA_PERMISSION', imageUrl: 'data:image/png;base64,x' }],
		})

		expect(unrepresented).not.toContain('signatures')
		expect(represented).toContain('signatures')
	})

	it('accepts a lawyer signature that carries an image', () => {
		const paths = missingPaths('HS', 'accidentInfo', {
			claimantRepresentedByLawyer: true,
			signatures: [
				{ type: 'DATA_PERMISSION', imageUrl: 'data:image/png;base64,x' },
				{ type: 'LAWYER', imageUrl: 'data:image/png;base64,y' },
			],
		})

		expect(paths.some((path) => path.startsWith('signatures'))).toBe(false)
	})

	it('rejects a signature row that carries no image', () => {
		const paths = missingPaths('HS', 'accidentInfo', {
			signatures: [{ type: 'DATA_PERMISSION', imageUrl: null }],
		})

		expect(paths).toContain('signatures.0.imageUrl')
	})
})

describe('array-backed sections', () => {
	it('reports a section with no rows as missing', () => {
		expect(missingPaths('HS', 'accidentInfo', { visits: [] })).toContain('visits')
		expect(missingPaths('HS', 'invoice', { lineItems: [] })).toContain('lineItems')
		expect(missingPaths('HS', 'condition', { tireSets: [] })).toContain('tireSets')
	})

	it('reports a blank row as missing rather than treating the section as complete', () => {
		const paths = missingPaths('HS', 'accidentInfo', {
			visits: [{ date: '', location: '', expert: '' }],
		})

		expect(paths).toContain('visits.0.date')
		expect(paths).toContain('visits.0.location')
		expect(paths).toContain('visits.0.expert')
	})

	it('reports only the empty fields of a partly filled row', () => {
		const paths = missingPaths('HS', 'accidentInfo', {
			visits: [{ date: '2026-03-01', location: '', expert: 'Kent Torres' }],
		})

		expect(paths).toContain('visits.0.location')
		expect(paths).not.toContain('visits.0.date')
		expect(paths).not.toContain('visits.0.expert')
	})

	it('accepts a complete row', () => {
		const paths = missingPaths('HS', 'accidentInfo', {
			visits: [{ date: '2026-03-01', location: 'Berlin', expert: 'Kent Torres' }],
		})

		expect(paths.some((path) => path.startsWith('visits'))).toBe(false)
	})

	it('reaches into the tyres of a tyre set', () => {
		const paths = missingPaths('HS', 'condition', {
			tireSets: [{ tires: [{ position: 'VL', size: '', profileLevel: '' }] }],
		})

		expect(paths).toContain('tireSets.0.tires.0.size')
		expect(paths).toContain('tireSets.0.tires.0.profileLevel')
		expect(paths).not.toContain('tireSets.0.tires.0.position')
	})

	it('reports a tyre set that carries no tyres', () => {
		const paths = missingPaths('HS', 'condition', { tireSets: [{ tires: [] }] })

		expect(paths).toContain('tireSets.0.tires')
	})
})

describe('unrequired booleans are never reported missing', () => {
	const booleanFields = [
		['accidentInfo', 'claimantEligibleForInputTaxDeduction'],
		['accidentInfo', 'claimantIsVehicleOwner'],
		['accidentInfo', 'claimantRepresentedByLawyer'],
		['accidentInfo', 'orderByClaimant'],
		['condition', 'fullServiceHistory'],
		['condition', 'testDrivePerformed'],
		['condition', 'parkingSensors'],
		['calculation', 'plasticRepair'],
		['invoice', 'eInvoice'],
	] as const

	it.each(booleanFields)('never flags %s.%s whatever its value', (tab, fieldName) => {
		for (const value of [true, false]) {
			for (const reportType of ['HS', 'BE', 'KG', 'OT'] as const) {
				const paths = missingPaths(reportType, tab, { [fieldName]: value })
				expect(paths).not.toContain(fieldName)
			}
		}
	})
})

describe('the two required findings', () => {
	const findings = ['airbagsDeployed', 'errorMemoryRead'] as const
	const reportTypes = ['HS', 'BE', 'KG', 'OT'] as const

	it.each(reportTypes)('asks %s for both findings while they are unanswered', (reportType) => {
		const paths = missingPaths(reportType, 'condition', {})

		expect(paths).toContain('airbagsDeployed')
		expect(paths).toContain('errorMemoryRead')
	})

	it.each(findings)('accepts an explicit "no" for %s', (fieldName) => {
		const paths = missingPaths('HS', 'condition', { [fieldName]: false })

		expect(paths).not.toContain(fieldName)
	})

	it.each(findings)('accepts an explicit "yes" for %s', (fieldName) => {
		const paths = missingPaths('HS', 'condition', { [fieldName]: true })

		expect(paths).not.toContain(fieldName)
	})

	it.each(findings)('still asks for %s when it is explicitly null', (fieldName) => {
		const paths = missingPaths('HS', 'condition', { [fieldName]: null })

		expect(paths).toContain(fieldName)
	})
})

describe('rules that could never fail are gone', () => {
	it('does not ask for the invoice fee schedule', () => {
		const paths = missingPaths('HS', 'invoice', {})

		expect(paths).not.toContain('feeSchedule')
	})

	it('does ask for the invoice recipient', () => {
		const paths = missingPaths('HS', 'invoice', {})

		expect(paths).toContain('recipientId')
	})
})

describe('gallery requirements', () => {
	const reportTypes = ['HS', 'BE', 'KG', 'OT'] as const

	it.each(reportTypes)('requires at least one photo on %s', (reportType) => {
		expect(missingPaths(reportType, 'gallery', {})).toContain('photos')
		expect(missingPaths(reportType, 'gallery', { photos: [] })).toContain('photos')
	})

	it('is satisfied by a single photo', () => {
		expect(missingPaths('HS', 'gallery', { photos: [{ id: 'photo-1' }] })).toHaveLength(0)
	})
})

describe('oldtimer vehicle grading', () => {
	const GRADES = {
		gradingBodywork: '2',
		gradingTires: '3',
		gradingPaint: '2',
		gradingInterior: '2',
		gradingChrome: '3',
		gradingEngineBay: '2',
		gradingSeals: '3',
		gradingEngine: '2',
		gradingGlass: '2',
		gradingTrunk: '3',
		gradingOverall: '2',
	}

	it('requires every category and the overall score on an oldtimer valuation', () => {
		const paths = missingPaths('OT', 'condition', {})

		for (const key of Object.keys(GRADES)) {
			expect(paths).toContain(key)
		}
	})

	it('is satisfied once every category is graded', () => {
		const paths = missingPaths('OT', 'condition', GRADES)

		for (const key of Object.keys(GRADES)) {
			expect(paths).not.toContain(key)
		}
	})

	it('does not ask the other three types to grade anything', () => {
		for (const reportType of ['HS', 'BE', 'KG'] as const) {
			const paths = missingPaths(reportType, 'condition', {})

			expect(paths.some((path) => path.startsWith('grading'))).toBe(false)
		}
	})

	it('never requires the value-increasing lists', () => {
		const paths = missingPaths('OT', 'condition', GRADES)

		expect(paths).not.toContain('rareEquipment')
		expect(paths).not.toContain('originality')
		expect(paths).not.toContain('marketReputation')
	})
})

describe('calculation requirements by report type', () => {
	it('requires the repair and loss-of-use fields for a liability report', () => {
		const paths = missingPaths('HS', 'calculation', {})

		expect(paths).toContain('replacementValue')
		expect(paths).toContain('residualValue')
		expect(paths).toContain('repairMethod')
		expect(paths).toContain('damageClass')
		expect(paths).toContain('dropoutGroup')
		expect(paths).toContain('costPerDay')
		expect(paths).toContain('repairTimeDays')
		expect(paths).toContain('diminutionInValue')
	})

	it('skips the diminution in value on a short report', () => {
		const paths = missingPaths('KG', 'calculation', {})

		expect(paths).toContain('replacementValue')
		expect(paths).not.toContain('diminutionInValue')
	})

	it('asks an evaluation report for its valuation figures only', () => {
		const paths = missingPaths('BE', 'calculation', {})

		expect(paths).toContain('dataSource')
		expect(paths).toContain('valuationMax')
		expect(paths).toContain('valuationAvg')
		expect(paths).toContain('valuationMin')
		expect(paths).toContain('valuationDate')
		expect(paths).not.toContain('repairMethod')
		expect(paths).not.toContain('costPerDay')
	})

	it('asks an oldtimer valuation for market, replacement and restoration values', () => {
		const paths = missingPaths('OT', 'calculation', {})

		expect(paths).toContain('marketValue')
		expect(paths).toContain('replacementValue')
		expect(paths).toContain('restorationValue')
		expect(paths).toContain('baseVehicleValue')
		expect(paths).not.toContain('repairMethod')
		expect(paths).not.toContain('costPerDay')
		expect(paths).not.toContain('repairTimeDays')
	})
})

describe('vehicle requirements by report type', () => {
	it('asks every type for the same identification and specification fields', () => {
		for (const reportType of ['HS', 'BE', 'KG', 'OT'] as const) {
			const paths = missingPaths(reportType, 'vehicle', {})

			expect(paths).toContain('vin')
			expect(paths).toContain('manufacturer')
			expect(paths).toContain('mainType')
			expect(paths).toContain('kbaNumber')
			expect(paths).toContain('firstRegistration')
			expect(paths).toContain('powerKw')
			expect(paths).toContain('displacement')
			expect(paths).toContain('transmission')
			expect(paths).toContain('sourceOfTechnicalData')
		}
	})

	it('asks only the valuation types for the number of previous owners', () => {
		expect(missingPaths('BE', 'vehicle', {})).toContain('previousOwners')
		expect(missingPaths('OT', 'vehicle', {})).toContain('previousOwners')
		expect(missingPaths('HS', 'vehicle', {})).not.toContain('previousOwners')
		expect(missingPaths('KG', 'vehicle', {})).not.toContain('previousOwners')
	})
})

describe('condition requirements by report type', () => {
	it('requires a damage marker only where a collision is being described', () => {
		expect(missingPaths('HS', 'condition', {})).toContain('damageMarkers')
		expect(missingPaths('KG', 'condition', {})).toContain('damageMarkers')
		expect(missingPaths('BE', 'condition', {})).not.toContain('damageMarkers')
		expect(missingPaths('OT', 'condition', {})).not.toContain('damageMarkers')
	})

	it('requires a paint marker everywhere except an evaluation report', () => {
		expect(missingPaths('HS', 'condition', {})).toContain('paintMarkers')
		expect(missingPaths('KG', 'condition', {})).toContain('paintMarkers')
		expect(missingPaths('OT', 'condition', {})).toContain('paintMarkers')
		expect(missingPaths('BE', 'condition', {})).not.toContain('paintMarkers')
	})

	it('requires the condition gradings on every type', () => {
		for (const reportType of ['HS', 'BE', 'KG', 'OT'] as const) {
			const paths = missingPaths(reportType, 'condition', {})

			expect(paths).toContain('generalCondition')
			expect(paths).toContain('bodyCondition')
			expect(paths).toContain('interiorCondition')
			expect(paths).toContain('drivingAbility')
		}
	})
})

describe('section roll-up', () => {
	it('counts a section complete only once every required field is filled', () => {
		const partly = evaluateTab('HS', 'vehicle', { vin: 'WVWZZZ3CZWE123456' })
		const identification = partly.sections.find((section) => section.id === 'identification')

		expect(identification?.isComplete).toBe(false)
		expect(identification?.missingCount).toBe(3)
	})

	it('counts a section complete once its last required field is filled', () => {
		const complete = evaluateTab('HS', 'vehicle', {
			vin: 'WVWZZZ3CZWE123456',
			manufacturer: 'Volkswagen AG',
			mainType: 'Golf VII',
			kbaNumber: '0603/BGH',
		})
		const identification = complete.sections.find((section) => section.id === 'identification')

		expect(identification?.isComplete).toBe(true)
		expect(identification?.missingCount).toBe(0)
		expect(complete.sectionsComplete).toBe(1)
	})

	it('adds each section up to the tab total', () => {
		const tab = evaluateTab('HS', 'condition', {})
		const sum = tab.sections.reduce((total, section) => total + section.missingCount, 0)

		expect(tab.missingCount).toBe(sum)
		expect(tab.missingPaths.length).toBeGreaterThanOrEqual(tab.missingCount)
	})

	it('adds each tab up to the report total', () => {
		const report = computeMissingInfo('HS', {})
		const sum = Object.values(report.tabs).reduce((total, tab) => total + tab.missingCount, 0)

		expect(report.missingCount).toBe(sum)
		expect(report.isComplete).toBe(false)
	})

	it('reports a report with nothing missing as complete', () => {
		const report = computeMissingInfo('HS', {
			gallery: { photos: [{ id: 'photo-1' }] },
			accidentInfo: {
				accidentDay: '2026-03-01',
				accidentScene: 'A7, km 42',
				claimantLastName: 'Müller',
				claimantStreet: 'Bahnhofstraße 12',
				claimantPostcode: '28195',
				claimantLocation: 'Bremen',
				claimantEmail: 'hans@mueller.de',
				claimantLicensePlate: 'HB AB 1234',
				claimantRepresentedByLawyer: false,
				opponentLastName: 'Schmidt',
				opponentInsuranceCompany: 'HUK',
				opponentInsuranceNumber: 'VS-1234',
				visits: [{ date: '2026-03-02', location: 'Bremen', expert: 'Kent Torres' }],
				expertName: 'Kent Torres',
				fileNumber: 'HB3351',
				caseDate: '2026-03-02',
				issuedDate: '2026-03-05',
				signatures: [{ type: 'DATA_PERMISSION', imageUrl: 'data:image/png;base64,x' }],
			},
			vehicle: {
				vin: 'WVWZZZ3CZWE123456',
				manufacturer: 'Volkswagen AG',
				mainType: 'Golf VII',
				kbaNumber: '0603/BGH',
				firstRegistration: '2018-04-01',
				powerKw: '110',
				displacement: '1968',
				transmission: 'Manual (6-speed)',
				sourceOfTechnicalData: 'KBA',
				vehicleType: 'compact',
				motorType: 'diesel',
				doors: 4,
				seats: 5,
			},
			condition: {
				mileageRead: '125450',
				nextMot: '2027-04-01',
				vehicleColor: 'Schwarz',
				paintType: 'Metallic',
				paintCondition: 'Good',
				generalCondition: 'Average',
				bodyCondition: 'Minor cosmetic',
				interiorCondition: 'Minor wear',
				drivingAbility: 'Roadworthy',
				airbagsDeployed: true,
				errorMemoryRead: false,
				previousDamageReported: 'Keine',
				damageMarkers: [{ id: 'd1', x: 10, y: 10, comment: null }],
				paintMarkers: [{ id: 'p1', x: 10, y: 10, thickness: 120, color: null, position: null }],
				tireSets: [{ tires: [{ position: 'VL', size: '205/55 R16', profileLevel: '6' }] }],
			},
			calculation: {
				replacementValue: '25000',
				residualValue: '18000',
				taxRate: '19',
				damageClass: 'III',
				diminutionInValue: '3500',
				repairMethod: 'Instandsetzung',
				dropoutGroup: 'C',
				costPerDay: '59',
				repairTimeDays: '7',
			},
			invoice: {
				invoiceNumber: 'GH-3552-2026',
				date: '2026-03-06',
				recipientId: 'individual',
				lineItems: [{ description: 'BVSK Appraisal Fee', rate: '890' }],
			},
		})

		expect(report.missingCount).toBe(0)
		expect(report.isComplete).toBe(true)
		for (const tab of Object.values(report.tabs)) {
			expect(tab.sectionsComplete).toBe(tab.sectionsTotal)
		}
	})
})

describe('missing totals across report types', () => {
	it('asks an evaluation report for less than a liability report', () => {
		const hs = computeMissingInfo('HS', EMPTY)
		const be = computeMissingInfo('BE', EMPTY)

		expect(be.missingCount).toBeLessThan(hs.missingCount)
	})

	it('asks a short report for one field less than a liability report', () => {
		const hs = computeMissingInfo('HS', EMPTY)
		const kg = computeMissingInfo('KG', EMPTY)

		expect(hs.missingCount - kg.missingCount).toBe(1)
	})
})
