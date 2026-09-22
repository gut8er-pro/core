import type { CalculationResponse } from '@/hooks/use-calculation'
import type { CalculationFormData } from './types'

const CALCULATION_DEFAULTS: CalculationFormData = {
	replacementValue: '',
	taxRate: '19',
	residualValue: '',
	diminutionInValue: '',
	wheelAlignment: '',
	bodyMeasurements: '',
	bodyPaint: '',
	plasticRepair: false,
	repairMethod: '',
	risks: '',
	damageClass: '',
	dropoutGroup: '',
	costPerDay: '',
	rentalCarClass: '',
	repairTimeDays: '',
	replacementTimeDays: '',
	additionalCosts: [],
	generalCondition: '',
	taxation: '2.4',
	dataSource: '',
	valuationMax: '',
	valuationAvg: '',
	valuationMin: '',
	valuationDate: '',
	correctionResultWithout: '',
	correctionResultWith: '',
	marketValue: '',
	baseVehicleValue: '',
	restorationValue: '',
}

const text = (value: unknown): string =>
	value === null || value === undefined ? '' : String(value)

/** The saved calculation as the Calculation form holds it. */
function calculationFromApi(data: CalculationResponse | undefined | null): CalculationFormData {
	const calculation = data?.calculation
	if (!calculation) return { ...CALCULATION_DEFAULTS }

	// The BE and OT valuation columns are not in the shared response type, so
	// they are read off the record the same way the Calculation page reads them.
	const rest: Record<string, unknown> = calculation

	return {
		...CALCULATION_DEFAULTS,
		replacementValue: text(calculation.replacementValue),
		taxRate: calculation.taxRate ?? CALCULATION_DEFAULTS.taxRate,
		residualValue: text(calculation.residualValue),
		diminutionInValue: text(calculation.diminutionInValue),
		wheelAlignment: calculation.wheelAlignment ?? '',
		bodyMeasurements: calculation.bodyMeasurements ?? '',
		bodyPaint: calculation.bodyPaint ?? '',
		plasticRepair: calculation.plasticRepair ?? CALCULATION_DEFAULTS.plasticRepair,
		repairMethod: calculation.repairMethod ?? '',
		risks: calculation.risks ?? '',
		damageClass: calculation.damageClass ?? '',
		dropoutGroup: calculation.dropoutGroup ?? '',
		costPerDay: text(calculation.costPerDay),
		rentalCarClass: calculation.rentalCarClass ?? '',
		repairTimeDays: text(calculation.repairTimeDays),
		replacementTimeDays: text(calculation.replacementTimeDays),
		additionalCosts: (data?.additionalCosts ?? []).map((cost) => ({
			description: cost.description,
			amount: cost.amount.toString(),
		})),
		generalCondition: text(rest.generalCondition),
		taxation: text(rest.taxation) || CALCULATION_DEFAULTS.taxation,
		dataSource: text(rest.dataSource),
		valuationMax: text(rest.valuationMax),
		valuationAvg: text(rest.valuationAvg),
		valuationMin: text(rest.valuationMin),
		valuationDate: text(rest.valuationDate).split('T')[0] ?? '',
		correctionResultWithout: text(rest.correctionResultWithout),
		correctionResultWith: text(rest.correctionResultWith),
		marketValue: text(rest.marketValue),
		baseVehicleValue: text(rest.baseVehicleValue),
		restorationValue: text(rest.restorationValue),
	}
}

export { CALCULATION_DEFAULTS, calculationFromApi }
