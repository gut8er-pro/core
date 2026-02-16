'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ChevronRight, Info, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompletionBadge } from '@/components/ui/completion-badge'
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

	const queryClient = useQueryClient()
	const [isAutoFilling, setIsAutoFilling] = useState(false)
	const [autoFillMessage, setAutoFillMessage] = useState<string | null>(null)
	const [datModalOpen, setDatModalOpen] = useState(false)

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

	const handleAutoFill = useCallback(async () => {
		setIsAutoFilling(true)
		setAutoFillMessage(null)
		try {
			const response = await fetch(`/api/reports/${reportId}/calculation/auto-fill`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			})
			if (!response.ok) {
				const data = await response.json().catch(() => ({ error: 'Auto-fill failed' }))
				setAutoFillMessage(data.error || 'Auto-fill failed')
				return
			}
			const data = await response.json() as { fieldsUpdated: string[] }
			setAutoFillMessage(`Auto-filled ${data.fieldsUpdated.length} fields`)
			queryClient.invalidateQueries({ queryKey: ['report', reportId, 'calculation'] })
		} catch {
			setAutoFillMessage('Auto-fill failed')
		} finally {
			setIsAutoFilling(false)
		}
	}, [reportId, queryClient])

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
			<div className="flex items-center justify-end">
				<div className="flex items-center gap-3">
					{autoFillMessage && (
						<span className="text-caption text-grey-100">{autoFillMessage}</span>
					)}
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
			</div>

			{/* Repair and Valuation Providers banner */}
			<button
				type="button"
				onClick={() => setDatModalOpen(true)}
				className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-white px-5 py-4 text-left transition-colors hover:bg-grey-25"
			>
				<div className="flex flex-col gap-0.5">
					<span className="text-body-sm font-semibold text-black">Repair and Valuation Providers</span>
					<span className="text-caption text-grey-100">Select and setup calculation provider</span>
				</div>
				<ChevronRight className="h-5 w-5 text-grey-100" />
			</button>

			<DatModal open={datModalOpen} onClose={() => setDatModalOpen(false)} />

			{/* Section heading with completion badge */}
			<div className="flex items-center justify-between">
				<h3 className="text-h3 font-semibold text-black">Value and Repair Calculation</h3>
				<CompletionBadge percentage={30} />
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
