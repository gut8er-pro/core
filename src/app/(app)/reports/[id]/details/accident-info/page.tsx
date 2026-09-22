'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AccidentSection } from '@/components/report/accident-info/accident-section'
import { ClaimantSection } from '@/components/report/accident-info/claimant-section'
import { ExpertOpinionSection } from '@/components/report/accident-info/expert-opinion-section'
import {
	ACCIDENT_INFO_DEFAULTS,
	accidentInfoFromApi,
} from '@/components/report/accident-info/form-data'
import { OpponentSection } from '@/components/report/accident-info/opponent-section'
import { SignatureSection } from '@/components/report/accident-info/signature-section'
import type { AccidentInfoFormData } from '@/components/report/accident-info/types'
import { VisitSection } from '@/components/report/accident-info/visit-section'
import { MissingFieldsProvider } from '@/components/report/missing-info'
import { SignaturePad } from '@/components/signature/signature-pad.dynamic'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useAccidentInfo, useDeleteSignature, useSaveSignature } from '@/hooks/use-accident-info'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useReport } from '@/hooks/use-reports'
import { toReportType } from '@/lib/completeness'

type SignatureType = 'LAWYER' | 'DATA_PERMISSION' | 'CANCELLATION'

function AccidentInfoPage() {
	const t = useTranslations('report')
	const tc = useTranslations('common')
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useAccidentInfo(reportId)
	const { data: report } = useReport(reportId)
	const saveSignature = useSaveSignature(reportId)
	const deleteSignature = useDeleteSignature(reportId)

	const isLocked = !!report?.isLocked

	const { saveField, state: autoSaveState } = useAutoSave({
		reportId,
		section: 'accident-info',
		disabled: isLocked,
	})

	const [signatureModalType, setSignatureModalType] = useState<SignatureType | null>(null)
	const [signatureValue, setSignatureValue] = useState('')

	const {
		register,
		control,
		formState: { errors, dirtyFields },
		reset,
		getValues,
		setValue,
		watch,
	} = useForm<AccidentInfoFormData>({ defaultValues: { ...ACCIDENT_INFO_DEFAULTS } })

	// Populate form on initial load only (not on refetch after auto-save)
	const initializedRef = useRef(false)
	useEffect(() => {
		if (!data || initializedRef.current) return
		initializedRef.current = true
		reset(accidentInfoFromApi(data))
	}, [data, reset])

	const handleFieldBlur = useCallback(
		(field: string) => {
			// Read from React Hook Form state (works for all field types including
			// selects, radios, checkboxes, and array fields like visits)
			const value = getValues(field as keyof AccidentInfoFormData)
			if (value === undefined) return

			// Visits: save the entire visits array, filtering out empty rows
			if (field.startsWith('visits')) {
				const visits = (getValues('visits') ?? []).filter(
					(v) => v.street || v.postcode || v.location || v.date || v.expert,
				)
				if (visits.length > 0) saveField('visits', visits)
			} else if (field.startsWith('claimant')) {
				const apiField = field.replace('claimant', '')
				const key = apiField.charAt(0).toLowerCase() + apiField.slice(1)
				saveField(`claimantInfo.${key}`, value)
			} else if (field.startsWith('owner')) {
				const key = field.charAt(5).toLowerCase() + field.slice(6)
				saveField(`ownerInfo.${key}`, value)
			} else if (field.startsWith('opponent')) {
				const apiField = field.replace('opponent', '')
				const key = apiField.charAt(0).toLowerCase() + apiField.slice(1)
				saveField(`opponentInfo.${key}`, value)
			} else if (
				field.startsWith('expert') ||
				field === 'fileNumber' ||
				field === 'caseDate' ||
				field === 'orderWasPlacement' ||
				field === 'issuedDate' ||
				field === 'mediator'
			) {
				saveField(`expertOpinion.${field}`, value)
			} else {
				saveField(`accidentInfo.${field}`, value)
			}
		},
		[saveField, getValues],
	)

	// Reflect every input change into the auto-save debounce queue, not just
	// blur events. Without this, a user (or a test) that fills a field and
	// immediately navigates / clicks Generate before the input loses focus
	// loses that field — observed on claimantEmail where no blur ever fired
	// on the last-typed field.
	//
	// Field-array entries (visits.0.street etc.) are intentionally excluded:
	// the form doesn't currently round-trip the created row id back from the
	// API, so per-keystroke saves of an unsaved row would produce duplicate
	// DB rows. Visits keep the existing blur-only save path until that round-
	// trip is wired up.
	useEffect(() => {
		const sub = watch((_values, { name, type }) => {
			if (!name || name.includes('.')) return
			// Only save user-initiated changes — reset() also fires watch and
			// would otherwise overwrite the DB with the form's empty defaults.
			if (type !== 'change') return
			if (!dirtyFields[name as keyof AccidentInfoFormData]) return
			handleFieldBlur(name)
		})
		return () => sub.unsubscribe()
	}, [watch, handleFieldBlur, dirtyFields])

	// Signatures live outside the form, so the completeness engine is handed
	// them alongside the form's own values.
	const signatures = data?.signatures
	const signatureValues = useMemo(() => ({ signatures: signatures ?? [] }), [signatures])

	const handleSignatureSave = useCallback(() => {
		if (!signatureModalType || !signatureValue) return

		saveSignature.mutate({
			type: signatureModalType,
			imageUrl: signatureValue,
		})

		setSignatureModalType(null)
		setSignatureValue('')
	}, [signatureModalType, signatureValue, saveSignature])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Page heading with completion badge + auto-save status */}
			<div className="flex items-center justify-between">
				<h2 className="text-subsection font-medium text-black">
					{report?.reportType === 'OT'
						? t('accidentInfo.clientInformation')
						: t('accidentInfo.title')}
				</h2>
				<div className="flex items-center gap-3">
					{autoSaveState.status === 'saving' && (
						<span className="flex items-center gap-1 text-caption text-grey-100">
							<Loader2 className="h-3 w-3 animate-spin" />
							{tc('saving')}
						</span>
					)}
					{autoSaveState.status === 'saved' && (
						<span className="flex items-center gap-1 text-caption text-primary">
							<CheckCircle2 className="h-3 w-3" />
							{tc('saved')}
						</span>
					)}
					{autoSaveState.status === 'error' && (
						<span className="text-caption text-error">{tc('failedToSave')}</span>
					)}
					<span className="text-body-sm text-grey-100">
						{(() => {
							const fields = [
								'claimantFirstName',
								'claimantLastName',
								'claimantStreet',
								'claimantEmail',
							] as const
							const filled = fields.filter((f) => getValues(f as keyof AccidentInfoFormData)).length
							return `${Math.round((filled / fields.length) * 100)}% ${tc('complete')}`
						})()}
					</span>
				</div>
			</div>

			{/* Form sections — some hidden per report type */}
			<MissingFieldsProvider
				tab="accidentInfo"
				reportType={toReportType(report?.reportType)}
				control={control}
				extraValues={signatureValues}
			>
				<div className="flex flex-col gap-6">
					{report?.reportType !== 'BE' && report?.reportType !== 'OT' && (
						<AccidentSection
							register={register}
							control={control}
							errors={errors}
							onFieldBlur={handleFieldBlur}
							disabled={isLocked}
						/>
					)}

					<ClaimantSection
						register={register}
						control={control}
						errors={errors}
						onFieldBlur={handleFieldBlur}
						reportType={report?.reportType}
						disabled={isLocked}
					/>

					{report?.reportType !== 'BE' && report?.reportType !== 'OT' && (
						<OpponentSection
							register={register}
							control={control}
							errors={errors}
							onFieldBlur={handleFieldBlur}
							disabled={isLocked}
						/>
					)}

					<VisitSection
						register={register}
						control={control}
						errors={errors}
						onFieldBlur={handleFieldBlur}
						reportType={report?.reportType}
						disabled={isLocked}
						getValues={getValues}
						setValue={setValue}
					/>

					<ExpertOpinionSection
						register={register}
						control={control}
						errors={errors}
						onFieldBlur={handleFieldBlur}
						disabled={isLocked}
					/>

					<SignatureSection
						signatures={data?.signatures ?? []}
						onSignatureClick={setSignatureModalType}
						onSignatureRemove={(sigId) => deleteSignature.mutate(sigId)}
						disabled={isLocked}
					/>
				</div>
			</MissingFieldsProvider>

			{/* Signature Modal */}
			<Modal
				title={t('accidentInfo.signatures.yourSignature')}
				open={signatureModalType !== null}
				onClose={() => {
					setSignatureModalType(null)
					setSignatureValue('')
				}}
				size="md"
				footer={
					<>
						<Button
							variant="outline"
							onClick={() => {
								setSignatureModalType(null)
								setSignatureValue('')
							}}
						>
							{tc('cancel')}
						</Button>
						<Button variant="primary" onClick={handleSignatureSave} disabled={!signatureValue}>
							{tc('save')}
						</Button>
					</>
				}
			>
				<SignaturePad value={signatureValue} onChange={setSignatureValue} />
				<p className="mt-4 text-caption text-grey-100">
					{t('accidentInfo.signatures.signatureConsent')}
				</p>
			</Modal>
		</div>
	)
}

export default AccidentInfoPage
