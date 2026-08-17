import { resolveReportTypeConfig } from '@/lib/report-type'
import type { ReportType } from '@/lib/validations/reports'
import { useAccidentInfo } from './use-accident-info'
import { useCalculation } from './use-calculation'
import { useCondition } from './use-condition'
import { useInvoice } from './use-invoice'
import { useVehicleInfo } from './use-vehicle-info'

type TabCompletion = {
	accidentInfo: { filled: number; total: number; isComplete: boolean }
	vehicle: { filled: number; total: number; isComplete: boolean }
	condition: { filled: number; total: number; isComplete: boolean }
	calculation: { filled: number; total: number; isComplete: boolean }
	invoice: { filled: number; total: number; isComplete: boolean }
}

function hasValue(val: unknown): boolean {
	if (val === null || val === undefined || val === '') return false
	if (typeof val === 'number') return true
	if (typeof val === 'boolean') return true
	if (typeof val === 'string') return val.trim().length > 0
	return true
}

function _countFilled(obj: Record<string, unknown> | null | undefined, keys: string[]): number {
	if (!obj) return 0
	return keys.filter((k) => hasValue((obj as Record<string, unknown>)[k])).length
}

/**
 * Computes section completion counts for the tab bar.
 * Sections are groups of related fields — e.g. Vehicle has 4 sections
 * (Identification, Specification, Details, Source).
 * A section counts as "filled" if at least one field in it has a value.
 */
function useTabCompletion(reportId: string, reportType?: ReportType | null): TabCompletion {
	const { data: accidentData } = useAccidentInfo(reportId)
	const { data: vehicleData } = useVehicleInfo(reportId)
	const { data: conditionData } = useCondition(reportId)
	const { data: calcData } = useCalculation(reportId)
	const { data: invoiceData } = useInvoice(reportId)

	const config = resolveReportTypeConfig(reportType)

	// ── Accident Info / Customer ──
	// Sections: Accident Info, Claimant, Opponent, Visits, Expert Opinion, Signatures
	const accidentSections = (() => {
		const sections: boolean[] = []

		// Accident Info section (HS/KG only)
		if (config.hasAccidentSection) {
			const ai = accidentData?.accidentInfo
			sections.push(hasValue(ai?.accidentDay) || hasValue(ai?.accidentScene))
		}

		// Claimant / Client section
		const cl = accidentData?.claimantInfo
		sections.push(hasValue(cl?.firstName) || hasValue(cl?.lastName) || hasValue(cl?.company))

		// Opponent section (HS/KG only)
		if (config.hasOpponent) {
			const op = accidentData?.opponentInfo
			sections.push(
				hasValue(op?.firstName) || hasValue(op?.lastName) || hasValue(op?.insuranceCompany),
			)
		}

		// Visits
		sections.push((accidentData?.visits?.length ?? 0) > 0)

		// Expert Opinion
		const eo = accidentData?.expertOpinion
		sections.push(hasValue(eo?.expertName) || hasValue(eo?.fileNumber))

		// Signatures
		sections.push((accidentData?.signatures?.length ?? 0) > 0)

		return {
			filled: sections.filter(Boolean).length,
			total: sections.length,
		}
	})()

	// ── Vehicle ──
	// Sections: Identification, Specification, Details, Source of Data
	const vehicleSections = (() => {
		const v = vehicleData
		const identification = hasValue(v?.vin) || hasValue(v?.manufacturer) || hasValue(v?.mainType)
		const specification =
			hasValue(v?.powerKw) || hasValue(v?.engineDesign) || hasValue(v?.transmission)
		const details = hasValue(v?.vehicleType) || hasValue(v?.motorType) || hasValue(v?.doors)
		const source = hasValue(v?.sourceOfTechnicalData)

		const sections = [identification, specification, details, source]
		return {
			filled: sections.filter(Boolean).length,
			total: sections.length,
		}
	})()

	// ── Condition ──
	// Sections vary, but count key groups
	const conditionSections = (() => {
		const c = conditionData?.condition
		const sections = [
			// Paint
			hasValue(c?.paintType) || hasValue(c?.paintCondition),
			// General condition
			hasValue(c?.generalCondition),
			// Body condition
			hasValue(c?.bodyCondition),
			// Interior condition
			hasValue(c?.interiorCondition),
			// Driving ability
			hasValue(c?.drivingAbility),
			// Mileage
			hasValue(c?.mileageRead),
			// MOT
			hasValue(c?.nextMot),
			// Special features
			hasValue(c?.specialFeatures),
			// Damage markers
			(conditionData?.damageMarkers?.length ?? 0) > 0,
			// Paint markers
			(conditionData?.paintMarkers?.length ?? 0) > 0,
			// Tires
			(conditionData?.tireSets?.length ?? 0) > 0,
			// Prior damage
			hasValue(c?.previousDamageReported) || hasValue(c?.existingDamageNotReported),
		]
		return {
			filled: sections.filter(Boolean).length,
			total: sections.length,
		}
	})()

	// ── Calculation / Valuation ──
	// Base sections come from the type's `calculationVariant`; the correction
	// section is counted when the type `hasCorrection` (HS + BE). Correction
	// results aren't persisted, so completion is proxied by the variant's core
	// calculation data being present — same approach the HS branch always used.
	const calculationSections = (() => {
		// Cast to Record for BE/OT fields that may not be in the strict TS type
		const c = calcData?.calculation as Record<string, unknown> | null | undefined
		const sections: boolean[] = []
		let correctionFilled = false

		if (config.calculationVariant === 'oldtimer') {
			// OT: Market value, Replacement value, Restoration/Base
			sections.push(hasValue(c?.marketValue))
			sections.push(hasValue(c?.replacementValue))
			sections.push(hasValue(c?.baseVehicleValue) || hasValue(c?.restorationValue))
		} else if (config.calculationVariant === 'valuation') {
			// BE: DAT Valuation + Manual Valuation
			sections.push(hasValue(c?.generalCondition) || hasValue(c?.taxation))
			sections.push(hasValue(c?.valuationMax) || hasValue(c?.valuationAvg))
			correctionFilled = hasValue(c?.valuationMax) || hasValue(c?.valuationAvg)
		} else {
			// HS/KG (standard): Vehicle Value, Repair, Loss of Use, Additional Costs
			sections.push(hasValue(c?.replacementValue) || hasValue(c?.residualValue))
			sections.push(
				hasValue(c?.repairMethod) || hasValue(c?.damageClass) || hasValue(c?.wheelAlignment),
			)
			sections.push(hasValue(c?.dropoutGroup) || hasValue(c?.costPerDay))
			sections.push((calcData?.additionalCosts?.length ?? 0) > 0)
			correctionFilled = hasValue(c?.replacementValue) && hasValue(c?.repairMethod)
		}

		if (config.hasCorrection) {
			sections.push(correctionFilled)
		}

		return { filled: sections.filter(Boolean).length, total: sections.length }
	})()

	// ── Invoice ──
	const invoiceSections = (() => {
		const inv = invoiceData?.invoice
		const sections = [
			// Settings
			hasValue(inv?.invoiceNumber) || hasValue(inv?.date),
			// Line items
			(invoiceData?.lineItems?.length ?? 0) > 0,
		]
		return {
			filled: sections.filter(Boolean).length,
			total: sections.length,
		}
	})()

	return {
		accidentInfo: {
			...accidentSections,
			isComplete: accidentSections.filled === accidentSections.total,
		},
		vehicle: {
			...vehicleSections,
			isComplete: vehicleSections.filled === vehicleSections.total,
		},
		condition: {
			...conditionSections,
			isComplete: conditionSections.filled === conditionSections.total,
		},
		calculation: {
			...calculationSections,
			isComplete: calculationSections.filled === calculationSections.total,
		},
		invoice: {
			...invoiceSections,
			isComplete: invoiceSections.filled === invoiceSections.total,
		},
	}
}

export type { TabCompletion }
export { useTabCompletion }
