'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { ConditionSection } from '@/components/report/condition/condition-section'
import { DamageDiagramSection } from '@/components/report/condition/damage-diagram-section'
import { CONDITION_DEFAULTS, conditionFromApi } from '@/components/report/condition/form-data'
import { PriorDamageSection } from '@/components/report/condition/prior-damage-section'
import { TireSection } from '@/components/report/condition/tire-section'
import type { ConditionFormData } from '@/components/report/condition/types'
import { MissingFieldsProvider } from '@/components/report/missing-info'
import { CompletionBadge } from '@/components/ui/completion-badge'
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
import { toReportType } from '@/lib/completeness'
import { getPaintColor } from '@/lib/validations/condition'

function ConditionPage() {
	const t = useTranslations('report')
	const tc = useTranslations('common')
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useCondition(reportId)
	const { data: report } = useReport(reportId)
	const saveDamageMarker = useSaveDamageMarker(reportId)
	const deleteDamageMarker = useDeleteDamageMarker(reportId)
	const savePaintMarker = useSavePaintMarker(reportId)
	const deletePaintMarker = useDeletePaintMarker(reportId)
	const saveTireSet = useSaveTireSet(reportId)
	const deleteTireSet = useDeleteTireSet(reportId)

	const isLocked = !!report?.isLocked

	const { saveField, state: autoSaveState } = useAutoSave({
		reportId,
		section: 'condition',
		disabled: isLocked,
	})

	const {
		register,
		control,
		formState: { errors, dirtyFields },
		reset,
		getValues,
		watch,
	} = useForm<ConditionFormData>({ defaultValues: { ...CONDITION_DEFAULTS } })

	// Populate form on initial load only
	const initializedRef = useRef(false)
	useEffect(() => {
		if (!data?.condition || initializedRef.current) return
		initializedRef.current = true
		reset(conditionFromApi(data))
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

	// Auto-save also fires on input change (debounced) so the last-typed
	// field doesn't get lost if the user navigates away before blur. Skip
	// dotted (array) names; see accident-info/page.tsx for rationale.
	useEffect(() => {
		const sub = watch((_v, { name, type }) => {
			if (!name || name.includes('.')) return
			// Only save user-initiated changes — reset() also fires watch.
			if (type !== 'change') return
			if (!dirtyFields[name as keyof ConditionFormData]) return
			handleFieldBlur(name)
		})
		return () => sub.unsubscribe()
	}, [watch, handleFieldBlur, dirtyFields])

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

	// Markers and tyre sets live outside the form, so the completeness engine
	// is handed them alongside the form's own values.
	const diagramValues = useMemo(
		() => ({
			damageMarkers: data?.damageMarkers ?? [],
			paintMarkers: data?.paintMarkers ?? [],
			tireSets: data?.tireSets ?? [],
		}),
		[data?.damageMarkers, data?.paintMarkers, data?.tireSets],
	)

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
				<h2 className="text-h2 font-bold text-black">{t('condition.title')}</h2>
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

			{/* Sections */}
			<MissingFieldsProvider
				tab="condition"
				reportType={toReportType(report?.reportType)}
				control={control}
				extraValues={diagramValues}
			>
				<div className="flex flex-col gap-6">
					<ConditionSection
						register={register}
						control={control}
						errors={errors}
						onFieldBlur={handleFieldBlur}
						disabled={isLocked}
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
						disabled={isLocked}
					/>

					<PriorDamageSection
						register={register}
						errors={errors}
						onFieldBlur={handleFieldBlur}
						disabled={isLocked}
					/>
				</div>
			</MissingFieldsProvider>
		</div>
	)
}

export default ConditionPage
