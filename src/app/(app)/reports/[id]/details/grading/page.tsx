'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { OLDTIMER_DEFAULTS, oldtimerFromApi } from '@/components/report/condition/form-data'
import type { ConditionFormData, OldtimerDetailsData } from '@/components/report/condition/types'
import { ValueIncreasingFeaturesSection } from '@/components/report/condition/value-increasing-features-section'
import { VehicleGradingSection } from '@/components/report/condition/vehicle-grading-section'
import { MissingFieldsProvider } from '@/components/report/missing-info'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useCondition } from '@/hooks/use-condition'
import { useReport } from '@/hooks/use-reports'
import { toReportType } from '@/lib/completeness'

/**
 * Vehicle Grading — an Oldtimer valuation's own tab.
 *
 * The grading is what an Oldtimer report is argued from, so it gets the same
 * standing as the valuation it feeds rather than sitting buried inside Condition.
 * The other three report types never grade a vehicle, so they are sent back to
 * Condition rather than shown an empty tab.
 */
function GradingPage() {
	const t = useTranslations('report')
	const tc = useTranslations('common')
	const params = useParams<{ id: string }>()
	const router = useRouter()
	const reportId = params.id
	const { data, isLoading } = useCondition(reportId)
	const { data: report } = useReport(reportId)

	const reportType = report?.reportType
	const isLocked = !!report?.isLocked

	const { saveField, state: autoSaveState } = useAutoSave({
		reportId,
		section: 'condition',
		disabled: isLocked,
	})

	const [oldtimer, setOldtimer] = useState<OldtimerDetailsData>(OLDTIMER_DEFAULTS)
	const initializedRef = useRef(false)
	useEffect(() => {
		if (!data || initializedRef.current) return
		initializedRef.current = true
		setOldtimer(oldtimerFromApi(data.oldtimerDetails))
	}, [data])

	const handleChange = useCallback(
		<K extends keyof OldtimerDetailsData>(field: K, value: OldtimerDetailsData[K]) => {
			setOldtimer((prev) => ({ ...prev, [field]: value }))
			saveField(`oldtimerDetails.${field}`, value)
		},
		[saveField],
	)

	useEffect(() => {
		if (!reportType || reportType === 'OT') return
		router.replace(`/reports/${reportId}/details/condition`)
	}, [reportType, reportId, router])

	// The provider drives the missing-field highlights from a form's values; this
	// tab owns no form, so it hands over an empty one and its own values instead.
	const { control } = useForm<ConditionFormData>()

	if (isLoading || !reportType) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	if (reportType !== 'OT') return null

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h2 className="text-h2 font-bold text-black">{t('condition.vehicleGrading.title')}</h2>
			</div>

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

			<MissingFieldsProvider
				tab="grading"
				reportType={toReportType(reportType)}
				control={control}
				extraValues={oldtimer}
			>
				<div className="flex flex-col gap-6">
					<VehicleGradingSection values={oldtimer} onChange={handleChange} disabled={isLocked} />
					<ValueIncreasingFeaturesSection values={oldtimer} onChange={handleChange} />
				</div>
			</MissingFieldsProvider>
		</div>
	)
}

export default GradingPage
