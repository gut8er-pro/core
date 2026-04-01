import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'

type CalculationFormData = {
	// Vehicle Value
	replacementValue: string
	taxRate: string
	residualValue: string
	diminutionInValue: string
	// Repair
	wheelAlignment: string
	bodyMeasurements: string
	bodyPaint: string
	plasticRepair: boolean
	repairMethod: string
	risks: string
	damageClass: string
	// Loss of Use
	dropoutGroup: string
	costPerDay: string
	rentalCarClass: string
	repairTimeDays: string
	replacementTimeDays: string
	// Additional costs
	additionalCosts: Array<{ description: string; amount: string }>
	// BE Valuation fields
	generalCondition: string
	taxation: string
	dataSource: string
	valuationMax: string
	valuationAvg: string
	valuationMin: string
	valuationDate: string
	// Correction Calculation results (shared HS + BE)
	correctionResultWithout: string
	correctionResultWith: string
	// OT — Oldtimer Valuation
	marketValue: string
	baseVehicleValue: string
	restorationValue: string
}

type CalculationSectionProps = {
	register: UseFormRegister<CalculationFormData>
	control: Control<CalculationFormData>
	errors: FieldErrors<CalculationFormData>
	onFieldBlur?: (field: string) => void
	className?: string
}

export type { CalculationFormData, CalculationSectionProps }
