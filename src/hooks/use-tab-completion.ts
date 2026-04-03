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

function countFilled(obj: Record<string, unknown> | null | undefined, keys: string[]): number {
	if (!obj) return 0
	return keys.filter((k) => hasValue((obj as Record<string, unknown>)[k])).length
}

/**
 * Computes section completion counts for the tab bar.
 * Sections are groups of related fields — e.g. Vehicle has 4 sections
 * (Identification, Specification, Details, Source).
 * A section counts as "filled" if at least one field in it has a value.
 */
function useTabCompletion(reportId: string, reportType?: string): TabCompletion {
	const { data: accidentData } = useAccidentInfo(reportId)
	const { data: vehicleData } = useVehicleInfo(reportId)
	const { data: conditionData } = useCondition(reportId)
	const { data: calcData } = useCalculation(reportId)
	const { data: invoiceData } = useInvoice(reportId)

	const isOT = reportType === 'OT'
	const isBE = reportType === 'BE'

	// ── Accident Info / Customer ──
	// Sections: Accident Info, Claimant, Opponent, Visits, Expert Opinion, Signatures
	const accidentSections = (() => {
		const sections: boolean[] = []

		// Accident Info section (not for BE/OT)
		if (!isBE && !isOT) {
			const ai = accidentData?.accidentInfo
			sections.push(hasValue(ai?.accidentDay) || hasValue(ai?.accidentScene))
		}

		// Claimant / Client section
		const cl = accidentData?.claimantInfo
		sections.push(
			hasValue(cl?.firstName) || hasValue(cl?.lastName) || hasValue(cl?.company),
		)

		// Opponent section (not for BE/OT)
		if (!isBE && !isOT) {
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
		const details =
			hasValue(v?.vehicleType) || hasValue(v?.motorType) || hasValue(v?.doors)
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
	const calculationSections = (() => {
		const c = calcData?.calculation
		if (isOT) {
			// OT: Market value, Replacement value, Restoration, Total
			const sections = [
				hasValue(c?.marketValue),
				hasValue(c?.replacementValue),
				hasValue(c?.baseVehicleValue) || hasValue(c?.restorationValue),
			]
			return { filled: sections.filter(Boolean).length, total: sections.length }
		}
		if (isBE) {
			// BE: DAT Valuation, Manual Valuation, Correction
			const sections = [
				hasValue(c?.generalCondition) || hasValue(c?.taxation),
				hasValue(c?.valuationMax) || hasValue(c?.valuationAvg),
				hasValue(c?.dataSource),
			]
			return { filled: sections.filter(Boolean).length, total: sections.length }
		}
		// HS/KG: Vehicle Value, Repair, Loss of Use, Additional Costs + (HS only: Correction, Results)
		const isKG = reportType === 'KG'
		const sections = [
			// Vehicle Value
			hasValue(c?.replacementValue) || hasValue(c?.residualValue),
			// Repair
			hasValue(c?.repairMethod) || hasValue(c?.damageClass) || hasValue(c?.wheelAlignment),
			// Loss of Use
			hasValue(c?.dropoutGroup) || hasValue(c?.costPerDay),
			// Additional Costs
			(calcData?.additionalCosts?.length ?? 0) > 0,
		]
		if (!isKG) {
			// Correction (HS only) — count as filled if any calc data exists
			sections.push(
				hasValue(c?.replacementValue) && hasValue(c?.repairMethod),
			)
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
