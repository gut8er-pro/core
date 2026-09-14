'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { MissingFieldsProvider } from '@/components/report/missing-info'
import { DetailsSection } from '@/components/report/vehicle/details-section'
import { VEHICLE_DEFAULTS, vehicleFromApi } from '@/components/report/vehicle/form-data'
import { IdentificationSection } from '@/components/report/vehicle/identification-section'
import { SpecificationSection } from '@/components/report/vehicle/specification-section'
import type { VehicleFormData } from '@/components/report/vehicle/types'
import { Button } from '@/components/ui/button'
import { CompletionBadge } from '@/components/ui/completion-badge'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useReport } from '@/hooks/use-reports'
import { useVehicleInfo } from '@/hooks/use-vehicle-info'
import { toReportType } from '@/lib/completeness'
import { useToastStore } from '@/stores/toast-store'

function VehiclePage() {
	const t = useTranslations('report')
	const tc = useTranslations('common')
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useVehicleInfo(reportId)
	const { data: report } = useReport(reportId)
	const toast = useToastStore()

	const {
		saveField,
		flushNow,
		state: autoSaveState,
	} = useAutoSave({
		reportId,
		section: 'vehicle',
		disabled: report?.isLocked,
	})

	const {
		register,
		control,
		formState: { errors, dirtyFields },
		reset,
		setValue,
		getValues,
		watch,
	} = useForm<VehicleFormData>({ defaultValues: { ...VEHICLE_DEFAULTS } })

	// Populate form on initial load only (not on refetch after auto-save)
	const initializedRef = useRef(false)
	useEffect(() => {
		if (!data || initializedRef.current) return
		initializedRef.current = true
		reset(vehicleFromApi(data))
	}, [data, reset])

	const handleFieldBlur = useCallback(
		(field: string) => {
			const value = getValues(field as keyof VehicleFormData)
			if (value === undefined) return

			const numericFields = [
				'axles',
				'drivenAxles',
				'doors',
				'seats',
				'previousOwners',
				'powerKw',
				'powerHp',
				'cylinders',
				'displacement',
			]

			if (numericFields.includes(field)) {
				const num = Number(value)
				saveField(field, value === '' ? null : Number.isNaN(num) ? null : num)
			} else {
				saveField(field, value || null)
			}
		},
		[saveField, getValues],
	)

	// Auto-save fires on input change too (debounced) — without this the
	// last-typed field is lost if the user navigates before blur. Skip
	// dotted (array) names; see accident-info/page.tsx for the rationale.
	useEffect(() => {
		const sub = watch((_v, { name, type }) => {
			if (!name || name.includes('.')) return
			// Only save user-initiated changes — reset() also fires watch.
			if (type !== 'change') return
			if (!dirtyFields[name as keyof VehicleFormData]) return
			handleFieldBlur(name)
		})
		return () => sub.unsubscribe()
	}, [watch, handleFieldBlur, dirtyFields])

	// Completion percentage
	const completionPercentage = (() => {
		const values = getValues()
		const allFields: (keyof VehicleFormData)[] = [
			'vin',
			'datsCode',
			'marketIndex',
			'manufacturer',
			'mainType',
			'subType',
			'kbaNumber',
			'powerKw',
			'powerHp',
			'engineDesign',
			'cylinders',
			'transmission',
			'displacement',
			'firstRegistration',
			'lastRegistration',
			'sourceOfTechnicalData',
			'vehicleType',
			'motorType',
		]
		let filled = 0
		for (const f of allFields) {
			if (values[f]) filled++
		}
		return Math.round((filled / allFields.length) * 100)
	})()

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Page heading with completion */}
			<div className="flex items-center justify-between">
				<h2 className="text-h2 font-bold text-black">{t('vehicle.title')}</h2>
				<CompletionBadge percentage={completionPercentage} />
			</div>

			{/* Auto-save status indicator */}
			{autoSaveState.status !== 'idle' && (
				<div className="flex items-center justify-end gap-1 text-caption">
					{autoSaveState.status === 'saving' && (
						<>
							<Loader2 className="h-3 w-3 animate-spin text-grey-100" />
							<span className="text-grey-100">{tc('saving')}</span>
						</>
					)}
					{autoSaveState.status === 'saved' && (
						<>
							<CheckCircle2 className="h-3 w-3 text-primary" />
							<span className="text-primary">{tc('saved')}</span>
						</>
					)}
					{autoSaveState.status === 'error' && (
						<span className="text-error">{tc('failedToSave')}</span>
					)}
				</div>
			)}

			{/* Form sections */}
			<MissingFieldsProvider
				tab="vehicle"
				reportType={toReportType(report?.reportType)}
				control={control}
			>
				<div className="flex flex-col gap-6">
					<IdentificationSection
						register={register}
						control={control}
						errors={errors}
						onFieldBlur={handleFieldBlur}
						setValue={setValue}
					/>

					<SpecificationSection
						register={register}
						control={control}
						errors={errors}
						onFieldBlur={handleFieldBlur}
						setValue={setValue}
					/>

					<DetailsSection
						register={register}
						control={control}
						errors={errors}
						onFieldBlur={handleFieldBlur}
						setValue={setValue}
					/>
				</div>
			</MissingFieldsProvider>

			{/* Update Report button */}
			<div className="flex justify-end">
				<Button
					variant="primary"
					size="lg"
					onClick={() => {
						flushNow()
						toast.success('Report updated', 2000)
					}}
					loading={autoSaveState.status === 'saving'}
				>
					{t('accidentInfo.updateReport')}
				</Button>
			</div>
		</div>
	)
}

export default VehiclePage
