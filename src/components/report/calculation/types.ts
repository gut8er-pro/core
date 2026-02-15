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
}

type CalculationSectionProps = {
	register: UseFormRegister<CalculationFormData>
	control: Control<CalculationFormData>
	errors: FieldErrors<CalculationFormData>
	onFieldBlur?: (field: string) => void
	className?: string
}

export type { CalculationFormData, CalculationSectionProps }
