'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ConditionSection } from '@/components/report/condition/condition-section'
import { DamageDiagramSection } from '@/components/report/condition/damage-diagram-section'
import { PriorDamageSection } from '@/components/report/condition/prior-damage-section'
import { TireSection } from '@/components/report/condition/tire-section'
import { ValueIncreasingFeaturesSection } from '@/components/report/condition/value-increasing-features-section'
import { VehicleGradingSection } from '@/components/report/condition/vehicle-grading-section'
import type { ConditionFormData } from '@/components/report/condition/types'
import { Button } from '@/components/ui/button'
import { CompletionBadge } from '@/components/ui/completion-badge'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { useAutoSave } from '@/hooks/use-auto-save'
import {
	useCondition,
	useDeleteDamageMarker,
	useDeletePaintMarker,
	useDeleteTireSet,
	useSaveDamageMarker,
	useSavePaintMarker,
	useSaveTireSet,
} from '@/hooks/use-condition'
import { useReport } from '@/hooks/use-reports'
import { getPaintColor } from '@/lib/validations/condition'
import { useToastStore } from '@/stores/toast-store'

function ConditionPage() {
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useCondition(reportId)
	const { data: report } = useReport(reportId)
	const toast = useToastStore()
	const saveDamageMarker = useSaveDamageMarker(reportId)
	const deleteDamageMarker = useDeleteDamageMarker(reportId)
	const savePaintMarker = useSavePaintMarker(reportId)
	const deletePaintMarker = useDeletePaintMarker(reportId)
	const saveTireSet = useSaveTireSet(reportId)
	const deleteTireSet = useDeleteTireSet(reportId)
	const [showMissing, setShowMissing] = useState(false)

	const {
		saveField,
		flushNow,
		state: autoSaveState,
	} = useAutoSave({
		reportId,
		section: 'condition',
		disabled: report?.isLocked,
	})

	const {
		register,
		control,
		formState: { errors },
		reset,
		getValues,
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

	// Populate form on initial load only
	const initializedRef = useRef(false)
	useEffect(() => {
		if (!data?.condition || initializedRef.current) return
		initializedRef.current = true

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
			const value = getValues(field as keyof ConditionFormData)
			if (value === undefined) return

			if (field === 'mileageRead' || field === 'estimateMileage') {
				const numVal = parseInt(String(value), 10)
				saveField(`condition.${field}`, Number.isNaN(numVal) ? null : numVal)
			} else {
				saveField(`condition.${field}`, value)
			}
		},
		[saveField, getValues],
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
		(tireSet: {
			id?: string
			setNumber: number
			matchAndAlloy: boolean
			tires: Array<{
				id?: string
				position: string
				size: string
				profileLevel: string
				manufacturer: string
				usability: number
			}>
		}) => {
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

	// Count missing fields for the banner
	const missingFieldCount = (() => {
		const values = getValues()
		let count = 0
		const stringFields: (keyof ConditionFormData)[] = [
			'paintType',
			'hard',
			'paintCondition',
			'generalCondition',
			'bodyCondition',
			'interiorCondition',
			'drivingAbility',
			'specialFeatures',
			'mileageRead',
			'estimateMileage',
			'nextMot',
		]
		for (const f of stringFields) {
			if (!values[f]) count++
		}
		return count
	})()

	// Completion percentage
	const completionPercentage = (() => {
		const values = getValues()
		const allFields: (keyof ConditionFormData)[] = [
			'paintType',
			'hard',
			'paintCondition',
			'generalCondition',
			'bodyCondition',
			'interiorCondition',
			'drivingAbility',
			'specialFeatures',
			'mileageRead',
			'estimateMileage',
			'nextMot',
			'notes',
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
				<h2 className="text-h2 font-bold text-black">Condition</h2>
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

			{/* Sections */}
			<ConditionSection
				register={register}
				control={control}
				errors={errors}
				onFieldBlur={handleFieldBlur}
			/>

			{/* OT-only sections */}
			{report?.reportType === 'OT' && (
				<>
					<ValueIncreasingFeaturesSection />
					<VehicleGradingSection />
				</>
			)}

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

			<PriorDamageSection register={register} errors={errors} onFieldBlur={handleFieldBlur} />

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

export default ConditionPage
