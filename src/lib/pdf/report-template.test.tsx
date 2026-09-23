import { isValidElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { type ReportData, ReportPdfDocument } from './report-template'
import { parseSectionsParam, sectionsFromToggles } from './sections'
import { getPdfTranslations } from './translations'

/**
 * The toggles' contract: each one includes or excludes its section, and the
 * invoice is always last. Asserted on the element tree rather than a rendered
 * PDF — what matters is which sections the document asked for, and rendering
 * 20 photos to a buffer to learn that costs seconds per case (ticket 30).
 */
function componentNames(node: ReactNode, found: string[] = []): string[] {
	if (Array.isArray(node)) {
		for (const child of node) componentNames(child, found)
		return found
	}
	if (!isValidElement(node)) return found

	const type = node.type
	if (typeof type === 'function' && type.name) found.push(type.name)

	const props = node.props as { children?: ReactNode } | null
	if (props?.children) componentNames(props.children, found)
	return found
}

function reportData(): ReportData {
	return {
		report: {
			id: 'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
			title: 'PW Section Test',
			reportType: 'HS',
			createdAt: new Date('2026-09-01'),
			updatedAt: new Date('2026-09-02'),
		},
		accidentInfo: { accidentDay: new Date('2026-08-20'), accidentScene: 'B27 bei Tübingen' },
		claimantInfo: {
			company: null,
			salutation: 'Herr',
			firstName: 'Jonas',
			lastName: 'Schmidt',
			street: 'Hauptstr. 4',
			postcode: '72070',
			location: 'Tübingen',
			email: 'jonas@example.de',
			phone: '+49 7071 1234',
			licensePlate: 'TÜ-JS 123',
			iban: 'DE89370400440532013000',
			eligibleForInputTaxDeduction: false,
			isVehicleOwner: true,
			representedByLawyer: false,
			involvedLawyer: null,
			lawyerFirm: null,
			lawyerStreet: null,
			lawyerPostcode: null,
			lawyerLocation: null,
			lawyerEmail: null,
			lawyerPhone: null,
		},
		ownerInfo: null,
		opponentInfo: null,
		vehicleInfo: {
			vin: 'WVWZZZ1KZAW123456',
			datsCode: null,
			manufacturer: 'Volkswagen',
			mainType: 'Golf',
			subtype: null,
			kbaNumber: null,
			powerKw: 110,
			powerHp: 150,
			engineDesign: null,
			cylinders: 4,
			transmission: null,
			engineDisplacementCcm: 1984,
			firstRegistration: new Date('2019-03-01'),
			lastRegistration: null,
			vehicleType: null,
			motorType: null,
			axles: 2,
			doors: 5,
			seats: 5,
			previousOwners: 1,
		},
		condition: null,
		visits: [],
		expertOpinion: {
			expertName: 'Anna Berger',
			fileNumber: '2026-0042',
			caseDate: null,
			orderWasPlacement: null,
			issuedDate: null,
			orderByClaimant: true,
			mediator: null,
		},
		signatures: [],
		calculation: {
			replacementValue: 14500,
			taxRate: '19',
			residualValue: 3200,
			diminutionInValue: 800,
			wheelAlignment: null,
			bodyMeasurements: null,
			bodyPaint: null,
			plasticRepair: false,
			repairMethod: null,
			risks: null,
			damageClass: null,
			dropoutGroup: null,
			costPerDay: null,
			rentalCarClass: null,
			repairTimeDays: null,
			replacementTimeDays: null,
			generalCondition: null,
			taxation: null,
			dataSource: null,
			valuationMax: null,
			valuationAvg: null,
			valuationMin: null,
			valuationDate: null,
			marketValue: null,
			baseVehicleValue: null,
			restorationValue: null,
			additionalCosts: [],
		},
		invoice: {
			invoiceNumber: 'RE-2026-0042',
			date: new Date('2026-09-02'),
			totalNet: 800,
			totalGross: 952,
			taxRate: 19,
			lineItems: [
				{
					description: 'Grundhonorar',
					amount: 800,
					quantity: 1,
					rate: 800,
					isLumpSum: false,
					order: 0,
				},
			],
		},
		photos: [],
		expert: {
			firstName: 'Anna',
			lastName: 'Berger',
			companyName: 'Berger Kfz-Sachverständige',
			street: 'Werkstr. 12',
			postcode: '70173',
			city: 'Stuttgart',
			website: 'www.berger-kfz.de',
			email: 'info@berger-kfz.de',
			phone: '+49 711 998877',
		},
	}
}

function sectionsOf(param: string | null, toggles?: Parameters<typeof sectionsFromToggles>[0]) {
	const fallback = sectionsFromToggles(
		toggles ?? {
			includeVehicleValuation: true,
			includeCommission: true,
			includeInvoice: true,
		},
	)
	return componentNames(
		ReportPdfDocument({
			data: reportData(),
			t: getPdfTranslations('de'),
			locale: 'de',
			sections: parseSectionsParam(param, fallback),
		}),
	)
}

describe('ReportPdfDocument section selection', () => {
	it('renders every section when all three toggles are on', () => {
		const names = sectionsOf(null)

		expect(names).toContain('VehicleInfoSection')
		expect(names).toContain('AccidentInfoSection')
		expect(names).toContain('VisitsSection')
		expect(names).toContain('ConditionSection')
		expect(names).toContain('CalculationSection')
		expect(names).toContain('InvoiceSection')
		expect(names).toContain('PhotoGallerySection')
	})

	it('renders an invoice-only document when only the invoice is on', () => {
		const names = sectionsOf('invoice')

		expect(names).toContain('InvoiceSection')
		// Nothing from the Gutachten body survives — this is a standalone invoice.
		expect(names).not.toContain('VehicleInfoSection')
		expect(names).not.toContain('AccidentInfoSection')
		expect(names).not.toContain('ConditionSection')
		expect(names).not.toContain('CalculationSection')
		expect(names).not.toContain('PhotoGallerySection')
		expect(names).not.toContain('HeaderSection')
	})

	it('drops only the invoice when the invoice toggle is off', () => {
		const names = sectionsOf('valuation,commission')

		expect(names).not.toContain('InvoiceSection')
		expect(names).toContain('VehicleInfoSection')
		expect(names).toContain('CalculationSection')
		expect(names).toContain('PhotoGallerySection')
	})

	it('drops the valuation when its toggle is off but keeps the report', () => {
		const names = sectionsOf('commission,invoice')

		expect(names).not.toContain('CalculationSection')
		expect(names).toContain('VehicleInfoSection')
		expect(names).toContain('InvoiceSection')
	})

	it('drops the commission section when its toggle is off', () => {
		const names = sectionsOf('valuation,invoice')

		expect(names).not.toContain('VisitsSection')
		expect(names).toContain('CalculationSection')
	})

	it('puts the invoice last, after the photo pages', () => {
		const names = sectionsOf(null)

		expect(names.indexOf('InvoiceSection')).toBeGreaterThan(names.indexOf('PhotoGallerySection'))
		expect(names.indexOf('InvoiceSection')).toBeGreaterThan(names.indexOf('CalculationSection'))
	})

	it('falls back to the stored toggles when no param is given', () => {
		const names = sectionsOf(null, {
			includeVehicleValuation: false,
			includeCommission: true,
			includeInvoice: true,
		})

		expect(names).not.toContain('CalculationSection')
		expect(names).toContain('InvoiceSection')
		expect(names).toContain('VehicleInfoSection')
	})
})
