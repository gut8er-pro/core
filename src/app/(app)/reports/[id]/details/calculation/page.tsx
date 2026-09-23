'use client'

import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { CorrectionMode } from '@/components/report/calculation/correction-section'
import { CorrectionSection } from '@/components/report/calculation/correction-section'
import type { DatFormData } from '@/components/report/calculation/dat-modal'
import { DatModal } from '@/components/report/calculation/dat-modal'
import { CALCULATION_DEFAULTS, calculationFromApi } from '@/components/report/calculation/form-data'
import { calculationHeadingKey } from '@/components/report/calculation/heading'
import { LossSection } from '@/components/report/calculation/loss-section'
import { OldtimerValuationSection } from '@/components/report/calculation/oldtimer-valuation-section'
import { RepairSection } from '@/components/report/calculation/repair-section'
import type { CalculationFormData } from '@/components/report/calculation/types'
import { ValuationSection } from '@/components/report/calculation/valuation-section'
import { ValueSection } from '@/components/report/calculation/value-section'
import { MissingFieldsProvider } from '@/components/report/missing-info'
import { Button } from '@/components/ui/button'
import { CompletionBadge } from '@/components/ui/completion-badge'
import { useAutoSave } from '@/hooks/use-auto-save'
import { fetchCalculation, useCalculation, useSaveCalculation } from '@/hooks/use-calculation'
import { usePhotos } from '@/hooks/use-photos'
import { useReport } from '@/hooks/use-reports'
import { useUserSettings } from '@/hooks/use-settings'
import { useSubscriptionNotice } from '@/hooks/use-subscription-notice'
import { isSubscriptionRequired } from '@/lib/api/errors'
import { toReportType } from '@/lib/completeness'

function formatCorrection(value: string | undefined): string {
	const amount = parseFloat(String(value ?? ''))
	if (Number.isNaN(amount)) return '—'
	return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

function CalculationPage() {
	const t = useTranslations('report.calculation')
	const tc = useTranslations('common')
	const subscriptionNotice = useSubscriptionNotice()
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useCalculation(reportId)
	const { data: report } = useReport(reportId)
	const { data: photos } = usePhotos(reportId)
	const { data: settings } = useUserSettings()

	const queryClient = useQueryClient()
	const [isAutoFilling, setIsAutoFilling] = useState(false)
	const [autoFillMessage, setAutoFillMessage] = useState<string | null>(null)
	const [datModalOpen, setDatModalOpen] = useState(false)
	const [correctionMode, setCorrectionMode] = useState<CorrectionMode>('dat')

	const reportType = report?.reportType
	const isValuationReport = reportType === 'BE'
	const isOldtimerReport = reportType === 'OT'
	const isShortReport = reportType === 'KG'
	const isLocked = report?.isLocked === true
	const datConnected =
		settings?.integrations.some(
			(integration) => integration.provider === 'DAT' && integration.isActive,
		) === true

	const { saveField, state: autoSaveState } = useAutoSave({
		reportId,
		section: 'calculation',
		disabled: report?.isLocked,
	})

	const {
		register,
		control,
		formState: { errors, dirtyFields },
		reset,
		getValues,
		watch,
	} = useForm<CalculationFormData>({ defaultValues: { ...CALCULATION_DEFAULTS } })

	// The result cards read the form, not the server, so a typed correction
	// shows up immediately instead of after the auto-save round-trip.
	const correctionValues = useWatch({
		control,
		name: ['correctionResultWithout', 'correctionResultWith'],
	})
	const correctionWithout = formatCorrection(correctionValues[0])
	const correctionWith = formatCorrection(correctionValues[1])

	const initializedRef = useRef(false)
	useEffect(() => {
		if (!data?.calculation || initializedRef.current) return
		initializedRef.current = true
		reset(calculationFromApi(data))
	}, [data, reset])

	const handleFieldBlur = useCallback(
		(field: string) => {
			const value = getValues(field as keyof CalculationFormData)
			if (value === undefined) return

			const floatFields = [
				'replacementValue',
				'residualValue',
				'diminutionInValue',
				'costPerDay',
				'valuationMax',
				'valuationAvg',
				'valuationMin',
				'marketValue',
				'baseVehicleValue',
				'restorationValue',
				'correctionResultWithout',
				'correctionResultWith',
			]
			const intFields = ['repairTimeDays', 'replacementTimeDays']

			if (floatFields.includes(field)) {
				const numVal = parseFloat(String(value))
				saveField(`calculation.${field}`, Number.isNaN(numVal) ? null : numVal)
			} else if (intFields.includes(field)) {
				const numVal = parseInt(String(value), 10)
				saveField(`calculation.${field}`, Number.isNaN(numVal) ? null : numVal)
			} else {
				saveField(`calculation.${field}`, value)
			}
		},
		[saveField, getValues],
	)

	// Auto-save fires on input change too (debounced) — without this the
	// last-typed field is lost if the user navigates before blur. Skip
	// dotted (array) names; see accident-info/page.tsx for rationale.
	// Only save user-initiated changes (dirtyFields) — reset() on data load
	// also fires watch and would otherwise overwrite the DB with empty
	// strings parsed to null.
	useEffect(() => {
		const sub = watch((_v, { name, type }) => {
			if (!name || name.includes('.')) return
			if (type !== 'change') return
			if (!dirtyFields[name as keyof CalculationFormData]) return
			handleFieldBlur(name)
		})
		return () => sub.unsubscribe()
	}, [watch, handleFieldBlur, dirtyFields])

	const saveCalculation = useSaveCalculation(reportId)

	const handleDatSave = useCallback(
		(datData: DatFormData) => {
			saveCalculation.mutate({ datCalculationResult: datData })
		},
		[saveCalculation],
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
			// The account is lapsed. Not a failure of the photos, and no retry helps — so it
			// gets its own message, in the user's language, saying what is closed and what
			// is not. The route's own English "Subscription required" never shows.
			if (isSubscriptionRequired(response)) {
				setAutoFillMessage(subscriptionNotice.message)
				subscriptionNotice.notify()
				return
			}
			if (!response.ok) {
				const resData = await response.json().catch(() => ({ error: 'Auto-fill failed' }))
				setAutoFillMessage(resData.error || t('autoFillFailed'))
				return
			}
			const resData = (await response.json()) as { fieldsUpdated: string[] }
			setAutoFillMessage(t('autoFilledFields', { count: resData.fieldsUpdated.length }))
			// The form initialises once per mount, so a refetch alone would leave
			// the fields the AI just wrote invisible until a reload.
			const fresh = await queryClient.fetchQuery({
				queryKey: ['report', reportId, 'calculation'],
				queryFn: () => fetchCalculation(reportId),
			})
			reset(calculationFromApi(fresh), { keepDirtyValues: true })
		} catch {
			setAutoFillMessage(t('autoFillFailed'))
		} finally {
			setIsAutoFilling(false)
		}
	}, [reportId, queryClient, t, subscriptionNotice, reset])

	// The AI card runs the same extractor as the toolbar button; it only has to
	// say so itself rather than leaving the assessor watching a highlighted card.
	const handleCorrectionAi = useCallback(async () => {
		if (!photos || photos.photos.length === 0) {
			setAutoFillMessage(t('correction.aiNeedsPhotos'))
			return
		}
		await handleAutoFill()
	}, [photos, handleAutoFill, t])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	const sectionTitle = t(calculationHeadingKey(toReportType(reportType)))

	return (
		<div className="flex flex-col gap-6">
			{/* Top row: auto-save status + auto-fill button */}
			<div className="flex items-center justify-end gap-3">
				<div className="flex items-center gap-3">
					{autoFillMessage && <span className="text-caption text-grey-100">{autoFillMessage}</span>}
					<div className="flex items-center gap-1 text-caption">
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
				</div>
				<Button
					variant="primary"
					size="lg"
					onClick={handleAutoFill}
					disabled={isAutoFilling || isLocked}
				>
					{isAutoFilling ? (
						<>
							<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
							{t('autoFilling')}
						</>
					) : (
						<>
							<Sparkles className="mr-1.5 h-4 w-4" />
							{t('uploadImageToAutoFill')}
						</>
					)}
				</Button>
			</div>

			{/* Repair and Valuation Providers banner */}
			<button
				type="button"
				onClick={() => setDatModalOpen(true)}
				className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-white px-5 py-4 text-left transition-colors hover:bg-grey-25"
			>
				<div className="flex flex-col gap-0.5">
					<span className="text-body-sm font-semibold text-black">{t('providers.heading')}</span>
					<span className="text-caption text-grey-100">{t('providers.subtitle')}</span>
				</div>
				<ChevronRight className="h-5 w-5 text-grey-100" />
			</button>

			<DatModal open={datModalOpen} onClose={() => setDatModalOpen(false)} onSave={handleDatSave} />

			{/* White card wrapping all calculation sections */}
			<div className="flex flex-col gap-5 rounded-[20px] bg-white p-5">
				{/* Section heading with completion badge */}
				<div className="flex items-center justify-between">
					<h3 className="text-h3 font-semibold text-black">{sectionTitle}</h3>
					<CompletionBadge
						percentage={(() => {
							const fields = [
								'replacementValue',
								'residualValue',
								'diminutionInValue',
								'repairMethod',
								'costPerDay',
							] as const
							const filled = fields.filter((f) => getValues(f as keyof CalculationFormData)).length
							return Math.round((filled / fields.length) * 100)
						})()}
					/>
				</div>

				<MissingFieldsProvider
					tab="calculation"
					reportType={toReportType(reportType)}
					control={control}
				>
					<fieldset
						disabled={isLocked}
						className="flex flex-col gap-5 border-0 p-0 disabled:opacity-60"
					>
						{isOldtimerReport ? (
							/* OT — Simple Vehicle Value with Market/Replacement/Restoration */
							<OldtimerValuationSection
								register={register}
								control={control}
								errors={errors}
								onFieldBlur={handleFieldBlur}
							/>
						) : isValuationReport ? (
							/* BE — DAT Valuation + Manual Valuation side by side */
							<ValuationSection
								register={register}
								control={control}
								errors={errors}
								onFieldBlur={handleFieldBlur}
								datConnected={datConnected}
								onOpenDat={() => setDatModalOpen(true)}
							/>
						) : (
							/* HS / KG — Value + Repair + Loss of Use */
							<>
								<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
									<ValueSection
										register={register}
										control={control}
										errors={errors}
										onFieldBlur={handleFieldBlur}
										className="rounded-3xl border-2 border-border-faint p-5"
									/>
									<RepairSection
										register={register}
										control={control}
										errors={errors}
										onFieldBlur={handleFieldBlur}
										className="rounded-3xl border-2 border-border-faint p-5"
									/>
								</div>
								<LossSection
									register={register}
									control={control}
									errors={errors}
									onFieldBlur={handleFieldBlur}
									className="rounded-3xl border-2 border-border-faint p-5"
								/>
							</>
						)}

						{/* Correction Calculation — HS and BE only (not KG, not OT) */}
						{!isShortReport && !isOldtimerReport && (
							<CorrectionSection
								control={control}
								onFieldBlur={handleFieldBlur}
								mode={correctionMode}
								onModeChange={setCorrectionMode}
								onOpenDat={() => setDatModalOpen(true)}
								onRunAi={handleCorrectionAi}
								isAiRunning={isAutoFilling}
								aiMessage={autoFillMessage}
								datConnected={datConnected}
								resultWithoutLabel={
									isValuationReport ? t('valuationResultsManual') : t('resultsWithoutRepair')
								}
								resultWithLabel={
									isValuationReport ? t('valuationAfterCorrection') : t('resultsWithRepair')
								}
								resultWithoutValue={correctionWithout}
								resultWithValue={correctionWith}
							/>
						)}
					</fieldset>
				</MissingFieldsProvider>
			</div>
		</div>
	)
}

export default CalculationPage
