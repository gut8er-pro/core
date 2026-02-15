'use client'

import { useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useCalculation } from '@/hooks/use-calculation'
import { useAutoSave } from '@/hooks/use-auto-save'
import { ValueSection } from '@/components/report/calculation/value-section'
import { RepairSection } from '@/components/report/calculation/repair-section'
import { LossSection } from '@/components/report/calculation/loss-section'
import { DatModal } from '@/components/report/calculation/dat-modal'
import type { CalculationFormData } from '@/components/report/calculation/types'

function CalculationPage() {
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useCalculation(reportId)

	const { saveField, state: autoSaveState } = useAutoSave({
		reportId,
		section: 'calculation',
	})

	const {
		register,
		control,
		formState: { errors },
		reset,
	} = useForm<CalculationFormData>({
		defaultValues: {
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
		},
	})

	// Populate form when data loads
	useEffect(() => {
		if (!data?.calculation) return

		const c = data.calculation
		const formData: Partial<CalculationFormData> = {
			replacementValue: c.replacementValue?.toString() ?? '',
			taxRate: c.taxRate ?? '19',
			residualValue: c.residualValue?.toString() ?? '',
			diminutionInValue: c.diminutionInValue?.toString() ?? '',
			wheelAlignment: c.wheelAlignment ?? '',
			bodyMeasurements: c.bodyMeasurements ?? '',
			bodyPaint: c.bodyPaint ?? '',
			plasticRepair: c.plasticRepair,
			repairMethod: c.repairMethod ?? '',
			risks: c.risks ?? '',
			damageClass: c.damageClass ?? '',
			dropoutGroup: c.dropoutGroup ?? '',
			costPerDay: c.costPerDay?.toString() ?? '',
			rentalCarClass: c.rentalCarClass ?? '',
			repairTimeDays: c.repairTimeDays?.toString() ?? '',
			replacementTimeDays: c.replacementTimeDays?.toString() ?? '',
			additionalCosts: (data.additionalCosts ?? []).map((ac) => ({
				description: ac.description,
				amount: ac.amount.toString(),
			})),
		}

		reset(formData as CalculationFormData)
	}, [data, reset])

	const handleFieldBlur = useCallback(
		(field: string) => {
			const el = document.querySelector<HTMLInputElement>(`[name="${field}"]`)
			if (!el) return
			const value = el.type === 'checkbox' ? el.checked : el.value

			// Map numeric fields
			const floatFields = [
				'replacementValue',
				'residualValue',
				'diminutionInValue',
				'costPerDay',
			]
			const intFields = ['repairTimeDays', 'replacementTimeDays']

			if (floatFields.includes(field)) {
				const numVal = parseFloat(el.value)
				saveField(`calculation.${field}`, isNaN(numVal) ? null : numVal)
			} else if (intFields.includes(field)) {
				const numVal = parseInt(el.value, 10)
				saveField(`calculation.${field}`, isNaN(numVal) ? null : numVal)
			} else {
				saveField(`calculation.${field}`, value)
			}
		},
		[saveField],
	)

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Auto-save status indicator */}
			<div className="flex items-center justify-between">
				<DatModal />

				<div className="flex items-center gap-1 text-caption">
					{autoSaveState.status === 'saving' && (
						<>
							<Loader2 className="h-3 w-3 animate-spin text-grey-100" />
							<span className="text-grey-100">Saving...</span>
						</>
					)}
					{autoSaveState.status === 'saved' && (
						<>
							<CheckCircle2 className="h-3 w-3 text-primary" />
							<span className="text-primary">Saved</span>
						</>
					)}
					{autoSaveState.status === 'error' && (
						<span className="text-error">Failed to save</span>
					)}
				</div>
			</div>

			{/* Two-column layout: Value (left) + Repair (right) */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<ValueSection
					register={register}
					control={control}
					errors={errors}
					onFieldBlur={handleFieldBlur}
				/>

				<RepairSection
					register={register}
					control={control}
					errors={errors}
					onFieldBlur={handleFieldBlur}
				/>
			</div>

			{/* Loss of Use - full width below */}
			<LossSection
				register={register}
				control={control}
				errors={errors}
				onFieldBlur={handleFieldBlur}
			/>
		</div>
	)
}

export default CalculationPage
