'use client'

import { useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CheckCircle2, Loader2 } from 'lucide-react'
import {
	useCondition,
	useSaveDamageMarker,
	useDeleteDamageMarker,
	useSavePaintMarker,
	useDeletePaintMarker,
	useSaveTireSet,
	useDeleteTireSet,
} from '@/hooks/use-condition'
import { useAutoSave } from '@/hooks/use-auto-save'
import { getPaintColor } from '@/lib/validations/condition'
import { ConditionSection } from '@/components/report/condition/condition-section'
import { DamageDiagramSection } from '@/components/report/condition/damage-diagram-section'
import { TireSection } from '@/components/report/condition/tire-section'
import { PriorDamageSection } from '@/components/report/condition/prior-damage-section'
import type { ConditionFormData } from '@/components/report/condition/types'

function ConditionPage() {
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useCondition(reportId)
	const saveDamageMarker = useSaveDamageMarker(reportId)
	const deleteDamageMarker = useDeleteDamageMarker(reportId)
	const savePaintMarker = useSavePaintMarker(reportId)
	const deletePaintMarker = useDeletePaintMarker(reportId)
	const saveTireSet = useSaveTireSet(reportId)
	const deleteTireSet = useDeleteTireSet(reportId)

	const { saveField, state: autoSaveState } = useAutoSave({
		reportId,
		section: 'condition',
	})

	const {
		register,
		control,
		formState: { errors },
		reset,
	} = useForm<ConditionFormData>({
		defaultValues: {
			paintType: '',
			hard: '',
			paintCondition: '',
			generalCondition: '',
			bodyCondition: '',
			interiorCondition: '',
			drivingAbility: '',
			specialFeatures: '',
			parkingSensors: false,
			mileageRead: '',
			estimateMileage: '',
			unit: 'km',
			nextMot: '',
			fullServiceHistory: false,
			testDrivePerformed: false,
			errorMemoryRead: false,
			airbagsDeployed: false,
			notes: '',
			manualSetup: false,
			previousDamageReported: '',
			existingDamageNotReported: '',
			subsequentDamage: '',
		},
	})

	// Populate form when data loads
	useEffect(() => {
		if (!data?.condition) return

		const c = data.condition
		const formData: Partial<ConditionFormData> = {
			paintType: c.paintType ?? '',
			hard: c.hard ?? '',
			paintCondition: c.paintCondition ?? '',
			generalCondition: c.generalCondition ?? '',
			bodyCondition: c.bodyCondition ?? '',
			interiorCondition: c.interiorCondition ?? '',
			drivingAbility: c.drivingAbility ?? '',
			specialFeatures: c.specialFeatures ?? '',
			parkingSensors: c.parkingSensors,
			mileageRead: c.mileageRead?.toString() ?? '',
			estimateMileage: c.estimateMileage?.toString() ?? '',
			unit: c.unit ?? 'km',
			nextMot: c.nextMot?.split('T')[0] ?? '',
			fullServiceHistory: c.fullServiceHistory,
			testDrivePerformed: c.testDrivePerformed,
			errorMemoryRead: c.errorMemoryRead,
			airbagsDeployed: c.airbagsDeployed,
			notes: c.notes ?? '',
			manualSetup: c.manualSetup,
			previousDamageReported: c.previousDamageReported ?? '',
			existingDamageNotReported: c.existingDamageNotReported ?? '',
			subsequentDamage: c.subsequentDamage ?? '',
		}

		reset(formData as ConditionFormData)
	}, [data, reset])

	const handleFieldBlur = useCallback(
		(field: string) => {
			const el = document.querySelector<HTMLInputElement>(`[name="${field}"]`)
			if (!el) return
			const value = el.type === 'checkbox' ? el.checked : el.value

			// Map numeric fields
			if (field === 'mileageRead' || field === 'estimateMileage') {
				const numVal = parseInt(el.value, 10)
				saveField(`condition.${field}`, isNaN(numVal) ? null : numVal)
			} else {
				saveField(`condition.${field}`, value)
			}
		},
		[saveField],
	)

	// Damage markers
	const handleAddDamageMarker = useCallback(
		(x: number, y: number) => {
			saveDamageMarker.mutate({ x, y, comment: null })
		},
		[saveDamageMarker],
	)

	const handleDeleteDamageMarker = useCallback(
		(markerId: string) => {
			deleteDamageMarker.mutate(markerId)
		},
		[deleteDamageMarker],
	)

	const handleUpdateDamageMarker = useCallback(
		(markerId: string, comment: string) => {
			const existing = data?.damageMarkers.find((m) => m.id === markerId)
			if (!existing) return
			saveDamageMarker.mutate({
				id: markerId,
				x: existing.x,
				y: existing.y,
				comment,
			})
		},
		[saveDamageMarker, data?.damageMarkers],
	)

	// Paint markers
	const handleAddPaintMarker = useCallback(
		(x: number, y: number) => {
			savePaintMarker.mutate({
				x,
				y,
				thickness: 100,
				color: getPaintColor(100),
			})
		},
		[savePaintMarker],
	)

	const handleUpdatePaintMarker = useCallback(
		(markerId: string, thickness: number) => {
			const existing = data?.paintMarkers.find((m) => m.id === markerId)
			if (!existing) return
			savePaintMarker.mutate({
				id: markerId,
				x: existing.x,
				y: existing.y,
				thickness,
				color: getPaintColor(thickness),
			})
		},
		[savePaintMarker, data?.paintMarkers],
	)

	const handleDeletePaintMarker = useCallback(
		(markerId: string) => {
			deletePaintMarker.mutate(markerId)
		},
		[deletePaintMarker],
	)

	// Tire sets
	const handleSaveTireSet = useCallback(
		(tireSet: { id?: string; setNumber: number; matchAndAlloy: boolean; tires: Array<{ id?: string; position: string; size: string; profileLevel: string; manufacturer: string; usability: number }> }) => {
			saveTireSet.mutate(tireSet)
		},
		[saveTireSet],
	)

	const handleDeleteTireSet = useCallback(
		(tireSetId: string) => {
			deleteTireSet.mutate(tireSetId)
		},
		[deleteTireSet],
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

			{/* Sections */}
			<ConditionSection
				register={register}
				control={control}
				errors={errors}
				onFieldBlur={handleFieldBlur}
			/>

			<DamageDiagramSection
				damageMarkers={data?.damageMarkers ?? []}
				paintMarkers={data?.paintMarkers ?? []}
				onAddDamageMarker={handleAddDamageMarker}
				onDeleteDamageMarker={handleDeleteDamageMarker}
				onUpdateDamageMarker={handleUpdateDamageMarker}
				onAddPaintMarker={handleAddPaintMarker}
				onUpdatePaintMarker={handleUpdatePaintMarker}
				onDeletePaintMarker={handleDeletePaintMarker}
			/>

			<TireSection
				tireSets={data?.tireSets ?? []}
				onSaveTireSet={handleSaveTireSet}
				onDeleteTireSet={handleDeleteTireSet}
			/>

			<PriorDamageSection
				register={register}
				errors={errors}
				onFieldBlur={handleFieldBlur}
			/>
		</div>
	)
}

export default ConditionPage
