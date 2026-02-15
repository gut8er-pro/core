'use client'

import { useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useVehicleInfo } from '@/hooks/use-vehicle-info'
import { useAutoSave } from '@/hooks/use-auto-save'
import { IdentificationSection } from '@/components/report/vehicle/identification-section'
import { SpecificationSection } from '@/components/report/vehicle/specification-section'
import { DetailsSection } from '@/components/report/vehicle/details-section'
import type { VehicleFormData } from '@/components/report/vehicle/types'

function VehiclePage() {
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useVehicleInfo(reportId)

	const { saveField, state: autoSaveState } = useAutoSave({
		reportId,
		section: 'vehicle',
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
			vehicleType: '',
			motorType: '',
			axles: 2,
			drivenAxles: 1,
			doors: 4,
			seats: 5,
			previousOwners: 1,
		},
	})

	// Populate form when data loads
	useEffect(() => {
		if (!data) return

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
			// Controlled fields (NumberChipSelector, IconSelector, SelectField) do not
			// render a native <input name="..."> so we read their current value from
			// React Hook Form state instead of the DOM.
			const controlledNumericFields = ['axles', 'drivenAxles', 'doors', 'seats', 'previousOwners']
			const controlledStringFields = ['vehicleType', 'motorType', 'engineDesign', 'transmission']

			if (controlledNumericFields.includes(field)) {
				const value = getValues(field as keyof VehicleFormData)
				saveField(field, Number(value))
				return
			}

			if (controlledStringFields.includes(field)) {
				const value = getValues(field as keyof VehicleFormData)
				saveField(field, value || null)
				return
			}

			// For numeric fields stored as strings in the form, convert to number for the API
			const numericStringFields = ['powerKw', 'powerHp', 'cylinders', 'displacement']

			if (numericStringFields.includes(field)) {
				const input = document.querySelector<HTMLInputElement>(`[name="${field}"]`)
				const rawValue = input?.value
				if (rawValue !== undefined) {
					const num = parseFloat(rawValue)
					saveField(field, rawValue === '' ? null : isNaN(num) ? null : num)
				}
				return
			}

			// String and date fields — read from DOM input
			const input = document.querySelector<HTMLInputElement>(`[name="${field}"]`)
			const value = input?.value
			if (value !== undefined) {
				saveField(field, value || null)
			}
		},
		[saveField, getValues],
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
				{autoSaveState.status === 'error' && (
					<span className="text-error">Failed to save</span>
				)}
			</div>

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
		</div>
	)
}

export default VehiclePage
