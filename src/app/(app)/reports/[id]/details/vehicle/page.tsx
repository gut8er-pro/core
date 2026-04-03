'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { DetailsSection } from '@/components/report/vehicle/details-section'
import { IdentificationSection } from '@/components/report/vehicle/identification-section'
import { SpecificationSection } from '@/components/report/vehicle/specification-section'
import type { VehicleFormData } from '@/components/report/vehicle/types'
import { Button } from '@/components/ui/button'
import { CompletionBadge } from '@/components/ui/completion-badge'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useReport } from '@/hooks/use-reports'
import { useVehicleInfo } from '@/hooks/use-vehicle-info'
import { useToastStore } from '@/stores/toast-store'

function VehiclePage() {
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useVehicleInfo(reportId)
	const { data: report } = useReport(reportId)
	const toast = useToastStore()
	const [showMissing, setShowMissing] = useState(false)

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
		formState: { errors },
		reset,
		setValue,
		getValues,
	} = useForm<VehicleFormData>({
		defaultValues: {
			vin: '',
			datsCode: '',
			marketIndex: '',
			manufacturer: '',
			mainType: '',
			subType: '',
			kbaNumber: '',
			powerKw: '',
			powerHp: '',
			engineDesign: '',
			cylinders: '',
			transmission: '',
			displacement: '',
			firstRegistration: '',
			lastRegistration: '',
			sourceOfTechnicalData: '',
			vehicleType: '',
			motorType: '',
			axles: 2,
			drivenAxles: 1,
			doors: 4,
			seats: 5,
			previousOwners: 1,
		},
	})

	// Populate form on initial load only (not on refetch after auto-save)
	const initializedRef = useRef(false)
	useEffect(() => {
		if (!data || initializedRef.current) return
		initializedRef.current = true

		const formData: Partial<VehicleFormData> = {
			vin: data.vin ?? '',
			datsCode: data.datsCode ?? '',
			marketIndex: data.marketIndex ?? '',
			manufacturer: data.manufacturer ?? '',
			mainType: data.mainType ?? '',
			subType: data.subType ?? '',
			kbaNumber: data.kbaNumber ?? '',
			powerKw: data.powerKw != null ? String(data.powerKw) : '',
			powerHp: data.powerHp != null ? String(data.powerHp) : '',
			engineDesign: data.engineDesign ?? '',
			cylinders: data.cylinders != null ? String(data.cylinders) : '',
			transmission: data.transmission ?? '',
			displacement: data.displacement != null ? String(data.displacement) : '',
			firstRegistration: data.firstRegistration?.split('T')[0] ?? '',
			lastRegistration: data.lastRegistration?.split('T')[0] ?? '',
			sourceOfTechnicalData: data.sourceOfTechnicalData ?? '',
			vehicleType: data.vehicleType ?? '',
			motorType: data.motorType ?? '',
			axles: data.axles ?? 2,
			drivenAxles: data.drivenAxles ?? 1,
			doors: data.doors ?? 4,
			seats: data.seats ?? 5,
			previousOwners: data.previousOwners ?? 1,
		}

		reset(formData as VehicleFormData)
	}, [data, reset])

	const handleFieldBlur = useCallback(
		(field: string) => {
			const value = getValues(field as keyof VehicleFormData)
			if (value === undefined) return

			const numericFields = ['axles', 'drivenAxles', 'doors', 'seats', 'previousOwners', 'powerKw', 'powerHp', 'cylinders', 'displacement']

			if (numericFields.includes(field)) {
				const num = Number(value)
				saveField(field, value === '' ? null : Number.isNaN(num) ? null : num)
			} else {
				saveField(field, value || null)
			}
		},
		[saveField, getValues],
	)

	// Count missing fields for the banner
	const missingFieldCount = (() => {
		const values = getValues()
		let count = 0
		const stringFields: (keyof VehicleFormData)[] = [
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
		]
		for (const f of stringFields) {
			if (!values[f]) count++
		}
		return count
	})()

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
				<h2 className="text-h2 font-bold text-black">Vehicle</h2>
				<CompletionBadge percentage={completionPercentage} />
			</div>

			{/* Auto-save status indicator */}
			{autoSaveState.status !== 'idle' && (
				<div className="flex items-center justify-end gap-1 text-caption">
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
					{autoSaveState.status === 'error' && <span className="text-error">Failed to save</span>}
				</div>
			)}

			{/* Form sections */}
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

			{/* Update Report button */}
			<div className="flex justify-end">
				<Button
					variant="primary"
					size="lg"
					onClick={() => { flushNow(); toast.success('Report updated', 2000) }}
					loading={autoSaveState.status === 'saving'}
				>
					Update Report
				</Button>
			</div>
		</div>
	)
}

export default VehiclePage
